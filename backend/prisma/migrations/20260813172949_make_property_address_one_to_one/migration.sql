/*
  Warnings:

  - A unique constraint covering the columns `[propertyId]` on the table `PropertyAddress` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Property_complexId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAddress_propertyId_key" ON "PropertyAddress"("propertyId");
