-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('COUNTER', 'GAUGE', 'DISTRIBUTION');

-- CreateEnum
CREATE TYPE "WidgetSource" AS ENUM ('METRIC', 'TRANSACTIONS');

-- CreateEnum
CREATE TYPE "WidgetAggregation" AS ENUM ('AVG', 'SUM', 'MIN', 'MAX', 'COUNT', 'P50', 'P95', 'P99');

-- CreateEnum
CREATE TYPE "WidgetDisplay" AS ENUM ('LINE', 'BAR', 'NUMBER');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "traceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "op" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "durationMs" DOUBLE PRECISION NOT NULL,
    "release" TEXT,
    "environment" TEXT,
    "spans" JSONB NOT NULL,
    "tags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "tags" JSONB NOT NULL,
    "release" TEXT,
    "environment" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "WidgetSource" NOT NULL,
    "metricName" TEXT,
    "filterName" TEXT,
    "aggregation" "WidgetAggregation" NOT NULL DEFAULT 'AVG',
    "display" "WidgetDisplay" NOT NULL DEFAULT 'LINE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_projectId_name_timestamp_idx" ON "transactions"("projectId", "name", "timestamp");

-- CreateIndex
CREATE INDEX "transactions_projectId_timestamp_idx" ON "transactions"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "transactions_traceId_idx" ON "transactions"("traceId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_projectId_eventId_key" ON "transactions"("projectId", "eventId");

-- CreateIndex
CREATE INDEX "metrics_projectId_name_timestamp_idx" ON "metrics"("projectId", "name", "timestamp");

-- CreateIndex
CREATE INDEX "metrics_projectId_timestamp_idx" ON "metrics"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "dashboards_projectId_idx" ON "dashboards"("projectId");

-- CreateIndex
CREATE INDEX "dashboard_widgets_dashboardId_position_idx" ON "dashboard_widgets"("dashboardId", "position");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
