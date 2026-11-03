-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('UNRESOLVED', 'RESOLVED', 'IGNORED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "platform" TEXT NOT NULL DEFAULT 'javascript',
ADD COLUMN     "uploadTokenHash" TEXT;

-- CreateTable
CREATE TABLE "project_keys" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Default',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "culprit" TEXT,
    "level" TEXT NOT NULL DEFAULT 'error',
    "platform" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 1,
    "firstRelease" TEXT,
    "lastRelease" TEXT,
    "regressedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "release" TEXT,
    "environment" TEXT,
    "platform" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_maps" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_maps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_keys_publicKey_key" ON "project_keys"("publicKey");

-- CreateIndex
CREATE INDEX "project_keys_projectId_idx" ON "project_keys"("projectId");

-- CreateIndex
CREATE INDEX "issues_projectId_status_lastSeen_idx" ON "issues"("projectId", "status", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "issues_projectId_fingerprint_key" ON "issues"("projectId", "fingerprint");

-- CreateIndex
CREATE INDEX "events_issueId_timestamp_idx" ON "events"("issueId", "timestamp");

-- CreateIndex
CREATE INDEX "events_projectId_timestamp_idx" ON "events"("projectId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "events_projectId_eventId_key" ON "events"("projectId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "releases_projectId_version_key" ON "releases"("projectId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "source_maps_releaseId_filePath_key" ON "source_maps"("releaseId", "filePath");

-- AddForeignKey
ALTER TABLE "project_keys" ADD CONSTRAINT "project_keys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issues" ADD CONSTRAINT "issues_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_maps" ADD CONSTRAINT "source_maps_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
