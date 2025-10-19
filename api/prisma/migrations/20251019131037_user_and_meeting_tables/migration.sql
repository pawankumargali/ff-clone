-- CreateEnum
CREATE TYPE "MeetingNoteStatus" AS ENUM ('NONE', 'RECORDING', 'RECORDED', 'TRANSCRIBED', 'SUMMARIZED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profile_pic" TEXT,
    "sub" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT,
    "slug" TEXT NOT NULL,
    "noteStatus" "MeetingNoteStatus" NOT NULL DEFAULT 'NONE',
    "uuid" TEXT NOT NULL,
    "audioUrl" TEXT,
    "audioKey" TEXT,
    "transcriptKey" TEXT,
    "transcriptUrl" TEXT NOT NULL,
    "summaryJson" JSONB,
    "summaryRawText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_id_key" ON "users"("email_id");

-- CreateIndex
CREATE UNIQUE INDEX "meetings_uuid_key" ON "meetings"("uuid");

-- CreateIndex
CREATE INDEX "meetings_user_id_uuid_idx" ON "meetings"("user_id", "uuid");

-- CreateIndex
CREATE INDEX "meetings_user_id_slug_idx" ON "meetings"("user_id", "slug");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
