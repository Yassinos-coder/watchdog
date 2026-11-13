-- AlterEnum
ALTER TYPE "WidgetSource" ADD VALUE 'ERRORS';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "dashboardsSeeded" BOOLEAN NOT NULL DEFAULT false;

-- Projects that already have dashboards keep them and do not get a default one
UPDATE "projects" SET "dashboardsSeeded" = true WHERE "id" IN (SELECT "projectId" FROM "dashboards");
