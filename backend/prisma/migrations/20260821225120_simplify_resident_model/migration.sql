/*
  Warnings:

  - You are about to drop the column `buildingId` on the `Resident` table. All the data in the column will be lost.
  - You are about to drop the column `residentType` on the `Resident` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_buildingId_fkey";

-- DropIndex
DROP INDEX "Resident_buildingId_idx";

-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "buildingId",
DROP COLUMN "residentType";

-- DropEnum
DROP TYPE "ResidentType";
