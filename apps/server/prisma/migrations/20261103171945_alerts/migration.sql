-- CreateEnum
CREATE TYPE "AlertChannelType" AS ENUM ('SLACK', 'DISCORD', 'TELEGRAM', 'EMAIL');

-- CreateEnum
CREATE TYPE "AlertTrigger" AS ENUM ('NEW_ISSUE', 'REGRESSION', 'SPIKE');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "alert_channels" (
    "id" TEXT NOT NULL,
    "type" "AlertChannelType" NOT NULL,
    "name" TEXT NOT NULL,
    "configEnc" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_rules" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "AlertTrigger" NOT NULL,
    "spikeThreshold" INTEGER,
    "spikeWindowMins" INTEGER,
    "minLevel" TEXT NOT NULL DEFAULT 'error',
    "environment" TEXT,
    "cooldownMins" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_deliveries" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "channelId" TEXT,
    "issueId" TEXT,
    "status" "DeliveryStatus" NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instance_settings" (
    "key" TEXT NOT NULL,
    "valueEnc" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instance_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "_AlertChannelToAlertRule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AlertChannelToAlertRule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "alert_rules_projectId_trigger_enabled_idx" ON "alert_rules"("projectId", "trigger", "enabled");

-- CreateIndex
CREATE INDEX "alert_deliveries_ruleId_issueId_createdAt_idx" ON "alert_deliveries"("ruleId", "issueId", "createdAt");

-- CreateIndex
CREATE INDEX "alert_deliveries_createdAt_idx" ON "alert_deliveries"("createdAt");

-- CreateIndex
CREATE INDEX "_AlertChannelToAlertRule_B_index" ON "_AlertChannelToAlertRule"("B");

-- AddForeignKey
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "alert_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_deliveries" ADD CONSTRAINT "alert_deliveries_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "alert_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertChannelToAlertRule" ADD CONSTRAINT "_AlertChannelToAlertRule_A_fkey" FOREIGN KEY ("A") REFERENCES "alert_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlertChannelToAlertRule" ADD CONSTRAINT "_AlertChannelToAlertRule_B_fkey" FOREIGN KEY ("B") REFERENCES "alert_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
