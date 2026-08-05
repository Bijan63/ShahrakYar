/*
  Warnings:

  - You are about to drop the column `floors` on the `Building` table. All the data in the column will be lost.
  - You are about to drop the column `totalUnits` on the `Building` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[complexId,name]` on the table `Building` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Building` table without a default value. This is not possible if the table is not empty.
  - Made the column `complexId` on table `Building` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Complex` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Building" DROP CONSTRAINT "Building_complexId_fkey";

-- AlterTable
ALTER TABLE "Building" DROP COLUMN "floors",
DROP COLUMN "totalUnits",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "complexId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Complex" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "buildingId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Building_complexId_name_key" ON "Building"("complexId", "name");

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
