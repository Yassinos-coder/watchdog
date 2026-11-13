-- AlterEnum
ALTER TYPE "AlertTrigger" ADD VALUE 'METRIC';
ALTER TYPE "WidgetAggregation" ADD VALUE 'RATE';
ALTER TYPE "WidgetDisplay" ADD VALUE 'TABLE';

-- CreateEnum
CREATE TYPE "MetricComparator" AS ENUM ('ABOVE', 'BELOW');

-- AlterTable
ALTER TABLE "alert_rules" ADD COLUMN "metricSource" "WidgetSource",
ADD COLUMN "metricName" TEXT,
ADD COLUMN "metricAggregation" "WidgetAggregation",
ADD COLUMN "metricComparator" "MetricComparator",
ADD COLUMN "metricThreshold" DOUBLE PRECISION,
ADD COLUMN "metricWindowMins" INTEGER,
ADD COLUMN "metricTagKey" TEXT,
ADD COLUMN "metricTagValue" TEXT;

-- AlterTable
ALTER TABLE "dashboard_widgets" ADD COLUMN "groupBy" TEXT,
ADD COLUMN "tagKey" TEXT,
ADD COLUMN "tagValue" TEXT;

-- CreateTable
CREATE TABLE "metric_rollups" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "unit" TEXT,
    "environment" TEXT NOT NULL DEFAULT '',
    "tags" JSONB NOT NULL,
    "tagsKey" TEXT NOT NULL,
    "bucket" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL,
    "sum" DOUBLE PRECISION NOT NULL,
    "min" DOUBLE PRECISION NOT NULL,
    "max" DOUBLE PRECISION NOT NULL,
    "p50" DOUBLE PRECISION NOT NULL,
    "p95" DOUBLE PRECISION NOT NULL,
    "p99" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "metric_rollups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metric_rollups_projectId_name_bucket_idx" ON "metric_rollups"("projectId", "name", "bucket");

-- CreateIndex
CREATE INDEX "metric_rollups_bucket_idx" ON "metric_rollups"("bucket");

-- CreateIndex
CREATE UNIQUE INDEX "metric_rollups_projectId_name_type_environment_tagsKey_buck_key" ON "metric_rollups"("projectId", "name", "type", "environment", "tagsKey", "bucket");

-- AddForeignKey
ALTER TABLE "metric_rollups" ADD CONSTRAINT "metric_rollups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
