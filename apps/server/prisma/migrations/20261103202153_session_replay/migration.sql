-- CreateTable
CREATE TABLE "replays" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "replayId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    "userAgent" TEXT,
    "release" TEXT,
    "environment" TEXT,
    "userId" TEXT,
    "errorEventIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replay_chunks" (
    "id" TEXT NOT NULL,
    "replayId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "events" JSONB NOT NULL,

    CONSTRAINT "replay_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "replays_projectId_startedAt_idx" ON "replays"("projectId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "replays_projectId_replayId_key" ON "replays"("projectId", "replayId");

-- CreateIndex
CREATE UNIQUE INDEX "replay_chunks_replayId_sequence_key" ON "replay_chunks"("replayId", "sequence");

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_chunks" ADD CONSTRAINT "replay_chunks_replayId_fkey" FOREIGN KEY ("replayId") REFERENCES "replays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
