/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[personId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('LAND', 'VILLA', 'APARTMENT', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('VACANT', 'BUILT', 'UNDER_CONSTRUCTION', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PropertyRelationType" AS ENUM ('SPLIT', 'MERGE', 'REPLACED');

-- CreateEnum
CREATE TYPE "ResidencyType" AS ENUM ('OWNER', 'TENANT', 'FAMILY');

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_buildingId_fkey";

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "code" TEXT,
ADD COLUMN     "propertyId" INTEGER,
ALTER COLUMN "floor" DROP NOT NULL,
ALTER COLUMN "buildingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "personId" INTEGER;

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nationalId" TEXT,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" SERIAL NOT NULL,
    "complexId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "registryNumber" TEXT,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL,
    "landArea" DOUBLE PRECISION,
    "builtArea" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAddress" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "mainStreet" TEXT,
    "subStreet" TEXT,
    "alley" TEXT,
    "number" TEXT,
    "description" TEXT,

    CONSTRAINT "PropertyAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Residency" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "personId" INTEGER NOT NULL,
    "type" "ResidencyType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Residency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_code_key" ON "Unit"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAddress" ADD CONSTRAINT "PropertyAddress_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residency" ADD CONSTRAINT "Residency_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residency" ADD CONSTRAINT "Residency_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
