# ff-clone – Meeting Audio Transcripts & Summaries

The application ingests meeting audio, runs it through **AWS Transcribe**, and produces action-oriented notes with **OpenAI**. It contains an **Express API**, a **React dashboard**, and **AWS Lambda** workers that glue the pipeline together.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Limits](#limits)
- [Approach (Meeting Life Cycle)](#approach-meeting-life-cycle)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Running the Workers](#running-the-workers)
  - [Transcriber Worker](#transcriber-worker)
  - [Post-Transcribe Worker](#post-transcribe-worker)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

## Overview

`ff-clone` is a meeting assistant that lets users upload recorded conversations, automatically produces transcripts, and summarizes them into structured insights and action items. Audio is stored privately, transcription is performed via **AWS Transcribe**, and notes are generated with **OpenAI** responses adhering to a strict JSON schema.

## Features

- Google OAuth sign-in and JWT-protected API routes.
- Meeting creation, audio uploads via presigned **S3 POST** forms, and status tracking.
- Automatic transcription through **AWS Transcribe** with speaker diarization.
- Structured summaries (overview, key insights, action items) produced with **OpenAI**.
- React dashboard for listing meetings, viewing transcripts, and polling note status.
- Recording page for simulating Live Meeting Recording
- Sample audio for local experimentation (e.g., `sample-audio/` and generated transcript fixtures).

## Limits
- File upload limit via presigned **S3 POST** is restricted to **60 MB**
- Max audio track length for file is limited to **5 mins**
- Rate limit on API is **60 rpm** by default and can be configured in .env via `RATE_LIMIT_RPM`
- Frontend application is not mobile-responsive and is for desktop only use

## Approach (Meeting Life Cycle)

1. **Create & Upload** – User creates a meeting and uploads audio via a presigned S3 POST (`api/src/services/meeting.service.ts`).
2. **Record** – Raw upload triggers `workers/transcriber/transcriber.aws.lambda.mjs`, which marks the meeting `RECORDED`, stores S3 metadata, and starts an AWS Transcribe job.
3. **Transcribe** – Transcribe writes JSON output to the transcript bucket. An `ObjectCreated` event triggers `workers/post-transcribe/post.transcribe.worker.aws.lambda.mjs`, updating the meeting to `TRANSCRIBED`.
4. **Summarize** – The API defers ~60 seconds, calls OpenAI (`api/src/services/summarizer.service.ts`) to generate structured notes, and sets status to `SUMMARIZED`.
5. **Consume** – The React app polls `/api/v1/meetings/:uuid/noteStatus`. Once ready, it retrieves transcript and summary for display.

### Status Flow

| Status        | Meaning                                        | Set by                                   |
|---------------|-------------------------------------------------|-------------------------------------------|
| `NONE`        | Meeting created; no audio yet                   | API (`meeting.service.create`)                          |
| `RECORDING`   | Presigned upload issued / upload in progress    | API (`meeting.service.generateUploadPresignParams`)       |
| `RECORDED`    | Audio stored in raw bucket                      | `transcriber.aws.lambda.mjs`              |
| `TRANSCRIBED` | AWS Transcribe completed                        | `post.transcribe.worker.aws.lambda.mjs`   |
| `SUMMARIZED`  | OpenAI notes generated                          | `summarizer.service.summarize`                      |
| `FAILED`      | Summarization failed                            | Summarizer error path                     |

## Architecture

### Backend API (`api/`)
- Express + TypeScript service (`api/src/app.ts`) with helmet, CORS, and rate limiting.
- Prisma/PostgreSQL persistence (`api/prisma/schema.prisma`).
- Google OAuth & JWT auth via Passport (`api/src/utils/passport.util.ts`).
- Meeting workflow services (`api/src/services/meeting.service.ts`, `summarizer.service.ts`, `webhook.service.ts`).
- Pluggable cache abstraction (`api/src/services/cache.service.ts` using NodeCache by default).

### Frontend (`ui/`)
- Vite + React 19 SPA (`ui/src/main.tsx`) using React Router.
- Auth token management in `ui/src/components/AuthHandler`.
- Dashboard, Meeting Details (with status polling), and simulated recorder under `ui/src/pages`.

### Workers (`workers/`)
- `transcriber/` – Handles raw audio S3 events; starts AWS Transcribe and marks meetings `RECORDED`.
- `post-transcribe/` – Handles transcript S3 events; marks meetings `TRANSCRIBED`.
- Root-level fixtures (sample audio + generated transcripts) for local testing.

### External Services
- AWS S3 (raw + transcript buckets), AWS Transcribe, OpenAI Chat Completions, Google OAuth 2.0.

## Project Structure

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
├── sample-audio/                       # folder contains sample audio files for quick testing
└── README.md                           # This documentation
````

## Tech Stack

* **Backend:** Node 20, Express 5, Prisma, PostgreSQL, Passport, AWS SDK v3, OpenAI SDK.
* **Frontend:** React 19, Vite 7, React Router 7, Axios, TypeScript 5.
* **Workers:** AWS Lambda (Node 20 runtime) with AWS Transcribe client and `fetch`.
* **Infrastructure:** AWS S3, AWS Transcribe, Redis-compatible cache, Google OAuth 2.0.

## Prerequisites

* Node.js 20+ and Yarn.
* PostgreSQL instance.
* AWS account with S3 buckets and Transcribe permissions.
* OpenAI API key (defaults to `gpt-4o-mini` if `OPENAI_MODEL` unset).
* Google OAuth web client credentials.
* Optional: Redis deployment (backend falls back to NodeCache).

## Getting Started

1. **Install dependencies**

   ```bash
   cd api && yarn install
   cd ../ui && yarn install
   ```

2. **Migrate database**

   ```bash
   cd api
   yarn prisma generate
   yarn prisma migrate dev
   ```

3. **Add Backend `.env`**
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
OPENAI_API_KEY=sk-proj-xxxxxxxxx

```
4. **Run backend**

   ```bash
   cd api
   yarn dev   # http://localhost:8081
   ```

5. **Run frontend**

   ```bash
   cd ui
   yarn dev   # http://localhost:5173
   ```
  > Frontend currently imports `BASE_URL` from `ui/src/services/api.service.ts`; consider swapping to `VITE_API_URL` for multi-env builds.


5. **Authenticate**
 * Visit `/login` on frontend to start Google OAuth; the redirect stores a JWT in `localStorage`.

6. **Upload audio**

   * Use “Upload Meeting Audio” in the dashboard (≤ **5.1-minute** clips enforced).
   * Try files in `sample-audio/` for quick tests.

7. **Inspect meeting**

   * Open the meeting row to monitor status, transcript, and summary.

> Without the AWS workers, meetings remain in `RECORDING`.
> Simulate transitions locally by `POST`ing to `/api/v1/webhook/:meetingUuid` with the correct secret.

## Running the Workers

Each worker is packaged as its own mini-project under `workers/`.

### Transcriber Worker

**Path:** `workers/transcriber/`
Handles `s3:ObjectCreated:*` events from the raw audio bucket: posts meeting metadata, starts AWS Transcribe, and marks status `RECORDED`.

**Setup**

```bash
cd workers/transcriber
yarn install    # or npm install
```

**Required env**

```env
AWS_REGION=ap-south-1              # or REGION
TRANSCRIBE_OUTPUT_BUCKET=your-transcript-bucket
WEBHOOK_DOMAIN_NAME=https://your-api-domain
WEBHOOK_SECRET=super-secret
```

**Deployment tips**

* Zip `transcriber.aws.lambda.mjs` together with `node_modules/`.
* Runtime: **Node.js 20.x**.
* Attach IAM policy allowing `s3:GetObject`, `s3:PutObject`, and `transcribe:StartTranscriptionJob`.
* Configure the **raw-audio** S3 bucket to trigger the Lambda on object creation.

### Post-Transcribe Worker

**Path:** `workers/post-transcribe/`
Handles `s3:ObjectCreated:*` events from the transcript bucket: signals the API that transcription finished (`TRANSCRIBED`).

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

* Zip `post.transcribe.worker.aws.lambda.mjs` with `node_modules/`.
* Runtime: **Node.js 20.x**.
* IAM policy needs S3 read access for the transcript bucket (metadata only).
* Configure the **transcript** bucket to trigger this Lambda on new objects.

## API Endpoints

**Base:** `http://localhost:8081/api`

| Method | Path                              | Description                     | Auth        |
| ------ | --------------------------------- | ------------------------------- | ----------- |
| GET    | /v1/auth/google                   | Begin Google OAuth flow         | Public      |
| GET    | /v1/auth/google/redirect          | OAuth callback handler          | Public      |
| POST   | /v1/meetings                      | Create meeting                  | Bearer JWT  |
| GET    | /v1/meetings                      | List user meetings              | Bearer JWT  |
| GET    | /v1/meetings/:uuid                | Fetch meeting details           | Bearer JWT  |
| GET    | /v1/meetings/:uuid/noteStatus     | Fetch meeting note status       | Bearer JWT  |
| GET    | /v1/meetings/:uuid/transcript     | Fetch transcript JSON           | Bearer JWT  |
| POST   | /v1/meetings/:uuid/upload/presign | Generate presigned S3 POST      | Bearer JWT  |
| POST   | /v1/webhook/:meetingUuid          | Worker webhook (status updates) | Webhook key |

## Database Schema

* **users:** Google-authenticated users.
* **meetings:** Metadata, S3 keys, summary payloads, and processing status.
  See `api/prisma/schema.prisma` and migrations for field-level details and indexes.

## Troubleshooting

* **401/403** – Token missing/expired or `JWT_SECRET` mismatch. UI clears tokens automatically on auth failures.
* **Stuck at `RECORDING`** – Check that the raw S3 bucket triggers the Transcriber Lambda and that `WEBHOOK_SECRET` matches.
* **Transcript fetch errors** – Validate transcript bucket permissions and `S3_TRANSCRIPT_BUCKET`.
* **No summaries** – Ensure `OPENAI_API_KEY` is set, the model is enabled, and inspect API logs for OpenAI errors.
* **CORS failures** – Align `FE_DOMAIN_NAME` with the deployed frontend origin.

## Useful Commands

**Backend**

```bash
cd api
npx prisma generate
npx prisma migrate dev
yarn dev # start in dev mode
yarn start
```

**Frontend**

```bash
cd ui
yarn dev # start in dev mode
yarn build
```

**Workers**

```bash
cd workers/transcriber
yarn install
node transcriber.aws.lambda.mjs    # run with a mocked event payload

cd ../post-transcribe
yarn install
node post.transcribe.worker.aws.lambda.mjs  # run with a mocked event payload
```