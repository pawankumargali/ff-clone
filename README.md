# ff-clone – Meeting Audio Transcripts & Summaries

The application ingests meeting audio, runs it through **AWS Transcribe**, and produces action-oriented notes with **OpenAI**. It contains an **Express API**, a **React dashboard**, and **AWS Lambda** workers that glue the pipeline together.

## Table of Contents
- [1. Overview](#1-overview)
- [2. High-Level Design](#2-high-level-design)
  - [2.1 Sequence Walkthrough](#21-sequence-walkthrough)
  - [2.2 Meeting Status Flow](#22-meeting-status-flow)
  - [2.3 Visual Diagram](#23-visual-diagram)
- [3. Features](#3-features)
- [4. Limits](#4-limits)
- [5. Architecture](#5-architecture)
  - [5.1 Backend API](#51-backend-api)
  - [5.2 Frontend](#52-frontend)
  - [5.3 Workers](#53-workers)
  - [5.4 External Services](#54-external-services)
- [6. Project Structure](#6-project-structure)
- [7. Tech Stack](#7-tech-stack)
- [8. Prerequisites](#8-prerequisites)
- [9. Environment Variables](#9-environment-variables)
- [10. Getting Started](#10-getting-started)
  - [10.1 Install Dependencies](#101-install-dependencies)
  - [10.2 Migrate Database](#102-migrate-database)
  - [10.3 Run Backend](#103-run-backend)
  - [10.4 Run Frontend](#104-run-frontend)
  - [10.5 Authenticate](#105-authenticate)
  - [10.6 Upload Audio](#106-upload-audio)
  - [10.7 Inspect Meeting](#107-inspect-meeting)
- [11. Running the Workers](#11-running-the-workers)
  - [11.1 Transcriber Worker](#111-transcriber-worker)
  - [11.2 Post-Transcribe Worker](#112-post-transcribe-worker)
- [12. API Endpoints](#12-api-endpoints)
- [13. Database Schema](#13-database-schema)
- [14. Troubleshooting](#14-troubleshooting)
- [15. Useful Commands](#15-useful-commands)
  - [15.1 Backend](#151-backend)
  - [15.2 Frontend](#152-frontend)
  - [15.3 Workers](#153-workers)

## 1. Overview

`ff-clone` is a meeting assistant that lets users upload recorded conversations, automatically produces transcripts, and summarizes them into structured insights and action items. Audio is stored privately, transcription is performed via **AWS Transcribe**, and notes are generated with **OpenAI** responses adhering to a strict JSON schema.

## 2. High-Level Design

### 2.1 Sequence Walkthrough

1. **Authenticate & initiate meeting** – the React dashboard exchanges Google OAuth credentials for a JWT issued by the Express API, then calls `POST /api/v1/meetings` to create a meeting stub with status `NONE`.
2. **Upload audio** – the dashboard requests a presigned POST payload from `POST /api/v1/meetings/:uuid/upload`, uploads audio directly to the raw S3 bucket, and the API marks the meeting `RECORDING`. S3 emits an `ObjectCreated` event.
3. **Kick off transcription** – the Raw Audio bucket event invokes the Transcriber Lambda, which updates the meeting to `RECORDED`, persists S3 metadata, and starts an AWS Transcribe job targeting the upload.
4. **Collect transcript artifacts** – AWS Transcribe writes JSON into the transcript bucket. The Post-Transcribe Lambda validates completion details, notifies the API, and the meeting progresses to `TRANSCRIBED`.
5. **Generate summaries** – after a short defer timer, the API calls the OpenAI summarizer with the transcript URL. Structured notes are persisted, the meeting becomes `SUMMARIZED`, and cache entries are primed for quick reads.
6. **Serve results to the UI** – the dashboard polls `GET /api/v1/meetings/:uuid/noteStatus` until `SUMMARIZED`, then retrieves transcript and summary payloads. Subsequent reads can hit the cache with PostgreSQL as fallback.

### 2.2 Meeting Status Flow

| Status        | Meaning                                     | Set by                                                   |
|---------------|---------------------------------------------|----------------------------------------------------------|
| `NONE`        | Meeting created; no audio yet               | API (`meeting.service.create`)                           |
| `RECORDING`   | Presigned upload issued / upload in flight  | API (`meeting.service.generateUploadPresignParams`)      |
| `RECORDED`    | Audio stored in raw bucket                  | `workers/transcriber/transcriber.aws.lambda.mjs`         |
| `TRANSCRIBED` | AWS Transcribe completed                    | `workers/post-transcribe/post.transcribe.worker.aws.lambda.mjs` |
| `SUMMARIZED`  | OpenAI-generated notes stored               | `api/src/services/summarizer.service.ts`                 |
| `FAILED`      | Summarization failed                        | Summarizer error path                                    |

### 2.3 Visual Diagram

[View the full interaction sequence diagram.](sequence-flow.svg)

## 3. Features

- Google OAuth sign-in with JWT-protected API routes.
- Meeting creation, audio uploads via presigned **S3 POST** forms, and status tracking.
- Automatic transcription through **AWS Transcribe** with speaker diarization.
- Structured summaries (overview, key insights, action items) produced with **OpenAI**.
- React dashboard for listing meetings, viewing transcripts, and polling note status.
- Recording page for simulating live meeting recording.
- Sample audio for local experimentation (`sample-audio/` with generated transcript fixtures).

## 4. Limits

- File upload limit via presigned **S3 POST** is restricted to **60 MB**.
- Maximum audio track length is **5 minutes**.
- Default API rate limit is **60 rpm**; override with `RATE_LIMIT_RPM`.
- Frontend is desktop-only at the moment (not mobile responsive).

## 5. Architecture

### 5.1 Backend API

- Express + TypeScript service (`api/src/app.ts`) with helmet, CORS, and rate limiting.
- Prisma/PostgreSQL persistence (`api/prisma/schema.prisma`).
- Google OAuth & JWT authentication via Passport (`api/src/utils/passport.util.ts`).
- Meeting workflow services (`meeting.service.ts`, `summarizer.service.ts`, `webhook.service.ts`).
- Pluggable cache abstraction (`api/src/services/cache.service.ts`, NodeCache by default).

### 5.2 Frontend

- Vite + React 19 SPA (`ui/src/main.tsx`) using React Router.
- Auth token management in `ui/src/components/AuthHandler`.
- Dashboard, Meeting Details (with status polling), and simulated recorder under `ui/src/pages`.

### 5.3 Workers

- `workers/transcriber/` handles raw audio S3 events; starts AWS Transcribe and marks meetings `RECORDED`.
- `workers/post-transcribe/` handles transcript S3 events and marks meetings `TRANSCRIBED`.
- Root-level fixtures (sample audio + generated transcripts) for local testing.

### 5.4 External Services

- AWS S3 (raw + transcript buckets).
- AWS Transcribe.
- OpenAI Chat Completions API.
- Google OAuth 2.0.

## 6. Project Structure

```text
/
├── api/                                # Express backend
│   ├── config.ts                       # Centralised runtime config loader
│   ├── src/
│   │   ├── app.ts                      # Express bootstrap
│   │   ├── controllers/                # Route handlers (auth, meetings, webhook)
│   │   ├── middleware/                 # Auth, validators, logger, error handler
│   │   │   └── validators/             # Zod schemas for request validation
│   │   ├── routes/                     # Route registration modules
│   │   ├── services/                   # Biz logic (meeting, summarizer, upload, DB, cache)
│   │   └── utils/                      # AWS S3, JWT, OpenAI, strings, constants
│   ├── prisma/
│   │   ├── schema.prisma               # Database schema and enums
│   │   └── migrations/                 # Prisma migration files
│   ├── Dockerfile                      # Container build for API
│   ├── package.json / yarn.lock        # Backend dependencies
│   └── dist/                           # Transpiled JS output (generated)
├── ui/                                 # React dashboard
│   ├── src/
│   │   ├── assets/                     # SVG/React icon components
│   │   ├── components/                 # Shared UI (Navbar, StatusPill, AuthHandler, etc.)
│   │   ├── pages/                      # Dashboard, MeetingDetails, RecordMeeting, Login
│   │   ├── services/                   # Axios API client & auth helpers
│   │   ├── utils/                      # Shared utilities and types
│   │   └── main.tsx                    # App entry point
│   ├── public/                         # Static assets served by Vite
│   ├── vite.config.ts / tsconfig.*     # Build & TypeScript configs
│   └── package.json / yarn.lock        # Frontend dependencies
├── workers/                            # AWS Lambda workers + fixtures
│   ├── transcriber/                    # Raw-audio event handler package
│   │   ├── transcriber.aws.lambda.mjs  # Lambda entrypoint
│   │   ├── package.json / yarn.lock    # Worker dependencies
│   └── post-transcribe/                # Transcript event handler package
│       ├── post.transcribe.worker.aws.lambda.mjs
│       ├── package.json / yarn.lock
├── sample-audio/                       # Sample audio files for quick testing
└── README.md                           # This documentation
```

## 7. Tech Stack

- **Backend:** Node 20, Express 5, Prisma, PostgreSQL, Passport, AWS SDK v3, OpenAI SDK.
- **Frontend:** React 19, Vite 7, React Router 7, Axios, TypeScript 5.
- **Workers:** AWS Lambda (Node 20 runtime) with AWS Transcribe client and `fetch`.
- **Infrastructure:** AWS S3, AWS Transcribe, Redis-compatible cache, Google OAuth 2.0.

## 8. Prerequisites

- Node.js 20+ and Yarn.
- PostgreSQL instance.
- AWS account with S3 buckets and Transcribe permissions.
- OpenAI API key (defaults to `gpt-4o-mini` when `OPENAI_MODEL` is unset).
- Google OAuth web client credentials.
- Optional Redis deployment (backend falls back to NodeCache).

## 9. Environment Variables

```env
# APP
DATABASE_URL=postgresql://localuser:localpwd@localhost:5432/ffdb?schema=public
PORT=8081
RATE_LIMIT_RPM=3000
JWT_SECRET=jwt_secret
WEBHOOK_SECRET=webhook_secret
FE_DOMAIN_NAME=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=oauth_secret

# AWS
AWS_ACCESS_KEY_ID=aws_xxx_id
AWS_SECRET_ACCESS_KEY=aws_xxx_secret
AWS_REGION=ap-south-1
S3_BUCKET=example.bucket
S3_TRANSCRIPT_BUCKET=example.transcript.bucket

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxx
```

## 10. Getting Started

### 10.1 Install Dependencies

```bash
cd api && yarn install
cd ../ui && yarn install
```

### 10.2 Migrate Database

```bash
cd api
yarn prisma generate
yarn prisma migrate dev
```

### 10.3 Run Backend

```bash
cd api
yarn dev   # http://localhost:8081
```

### 10.4 Run Frontend

```bash
cd ui
yarn dev   # http://localhost:5173
```

> The frontend currently imports `BASE_URL` from `ui/src/services/api.service.ts`; consider switching to `VITE_API_URL` for multi-environment builds.

### 10.5 Authenticate

Visit `/login` on the frontend to initiate Google OAuth; the redirect stores a JWT in `localStorage`.

### 10.6 Upload Audio

Use “Upload Meeting Audio” in the dashboard (≤ five-minute clips enforced). Try files in `sample-audio/` for quick tests.

### 10.7 Inspect Meeting

Open the meeting row to monitor status, transcript, and summary.

> Without the AWS workers, meetings stay in `RECORDING`. Simulate transitions locally by `POST`ing to `/api/v1/webhook/:meetingUuid` with the correct secret.

## 11. Running the Workers

Each worker is packaged as its own mini-project under `workers/`.

### 11.1 Transcriber Worker

**Path:** `workers/transcriber/`  
**Responsibilities:** Handles `s3:ObjectCreated:*` events from the raw audio bucket, posts meeting metadata, starts AWS Transcribe, and marks status `RECORDED`.

**Setup**

```bash
cd workers/transcriber
yarn install
```

**Required env**

```env
AWS_REGION=ap-south-1
TRANSCRIBE_OUTPUT_BUCKET=your-transcript-bucket
WEBHOOK_DOMAIN_NAME=https://your-api-domain
WEBHOOK_SECRET=super-secret
```

**Deployment tips**

- Zip `transcriber.aws.lambda.mjs` together with `node_modules/`.
- Runtime: **Node.js 20.x**.
- Attach IAM policy allowing `s3:GetObject`, `s3:PutObject`, and `transcribe:StartTranscriptionJob`.
- Configure the raw audio S3 bucket to trigger the Lambda on object creation.

### 11.2 Post-Transcribe Worker

**Path:** `workers/post-transcribe/`  
**Responsibilities:** Handles `s3:ObjectCreated:*` events from the transcript bucket, signals the API that transcription finished, and marks status `TRANSCRIBED`.

**Setup**

```bash
cd workers/post-transcribe
yarn install
```

**Required env**

```env
REGION=ap-south-1
WEBHOOK_DOMAIN_NAME=https://your-api-domain
WEBHOOK_SECRET=super-secret
```

**Deployment tips**

- Zip `post.transcribe.worker.aws.lambda.mjs` together with `node_modules/`.
- Runtime: **Node.js 20.x**.
- IAM policy needs S3 read access for the transcript bucket (metadata only).
- Configure the transcript bucket to trigger this Lambda on new objects.

## 12. API Endpoints

**Base:** `http://localhost:8081/api`

| Method | Path                              | Description                     | Auth        |
|--------|-----------------------------------|---------------------------------|-------------|
| GET    | /v1/auth/google                   | Begin Google OAuth flow         | Public      |
| GET    | /v1/auth/google/redirect          | OAuth callback handler          | Public      |
| POST   | /v1/meetings                      | Create meeting                  | Bearer JWT  |
| GET    | /v1/meetings                      | List user meetings              | Bearer JWT  |
| GET    | /v1/meetings/:uuid                | Fetch meeting details           | Bearer JWT  |
| GET    | /v1/meetings/:uuid/noteStatus     | Fetch meeting note status       | Bearer JWT  |
| GET    | /v1/meetings/:uuid/transcript     | Fetch transcript JSON           | Bearer JWT  |
| POST   | /v1/meetings/:uuid/upload/presign | Generate presigned S3 POST      | Bearer JWT  |
| POST   | /v1/webhook/:meetingUuid          | Worker webhook (status updates) | Webhook key |

## 13. Database Schema

- **users:** Google-authenticated users.
- **meetings:** Metadata, S3 keys, summary payloads, and processing status. See `api/prisma/schema.prisma` and migrations for field-level details and indexes.

## 14. Troubleshooting

- **401/403** – token missing/expired or `JWT_SECRET` mismatch. The UI clears tokens automatically on auth failures.
- **Stuck at `RECORDING`** – check the raw S3 bucket trigger for the Transcriber Lambda and confirm `WEBHOOK_SECRET`.
- **Transcript fetch errors** – validate transcript bucket permissions and `S3_TRANSCRIPT_BUCKET`.
- **No summaries** – ensure `OPENAI_API_KEY` is configured, the model is enabled, and inspect API logs for OpenAI errors.
- **CORS failures** – align `FE_DOMAIN_NAME` with the deployed frontend origin.

## 15. Useful Commands

### 15.1 Backend

```bash
cd api
npx prisma generate
npx prisma migrate dev
yarn dev     # start in dev mode
yarn start
```

### 15.2 Frontend

```bash
cd ui
yarn dev     # start in dev mode
yarn build
```

### 15.3 Workers

```bash
cd workers/transcriber
yarn install
node transcriber.aws.lambda.mjs    # run with a mocked event payload

cd ../post-transcribe
yarn install
node post.transcribe.worker.aws.lambda.mjs  # run with a mocked event payload
```
