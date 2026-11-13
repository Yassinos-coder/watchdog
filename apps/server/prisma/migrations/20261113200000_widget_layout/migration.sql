-- AlterTable
ALTER TABLE "dashboard_widgets" ADD COLUMN "layoutX" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "layoutY" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "layoutW" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN "layoutH" INTEGER NOT NULL DEFAULT 4;

-- Lay existing widgets out two per row, in their current order
UPDATE "dashboard_widgets" SET "layoutX" = ("position" % 2) * 6, "layoutY" = ("position" / 2) * 4;
