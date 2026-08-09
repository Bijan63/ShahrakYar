/*
  Warnings:

  - The primary key for the `Building` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Candidate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fullName` on the `Candidate` table. All the data in the column will be lost.
  - The primary key for the `Complex` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Election` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `status` column on the `Election` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Ownership` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Person` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Property` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyAddress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Residency` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Resident` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Unit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Vote` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[electionId,personId]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,personId,startDate]` on the table `Ownership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nationalId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[propertyId,personId,startDate]` on the table `Residency` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[personId]` on the table `Resident` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[electionId,voterId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `personId` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Election` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ownership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PropertyAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Residency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Resident` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Unit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voterId` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Building" DROP CONSTRAINT "Building_complexId_fkey";

-- DropForeignKey
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_electionId_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_personId_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Property" DROP CONSTRAINT "Property_complexId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyAddress" DROP CONSTRAINT "PropertyAddress_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Residency" DROP CONSTRAINT "Residency_personId_fkey";

-- DropForeignKey
ALTER TABLE "Residency" DROP CONSTRAINT "Residency_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_unitId_fkey";

-- DropForeignKey
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_userId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_buildingId_fkey";

-- DropForeignKey
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_personId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_electionId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_residentId_fkey";

-- DropIndex
DROP INDEX "Vote_residentId_electionId_candidateId_key";

-- AlterTable
ALTER TABLE "Building" DROP CONSTRAINT "Building_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "complexId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Building_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Building_id_seq";

-- AlterTable
ALTER TABLE "Candidate" DROP CONSTRAINT "Candidate_pkey",
DROP COLUMN "fullName",
ADD COLUMN     "personId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "electionId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Candidate_id_seq";

-- AlterTable
ALTER TABLE "Complex" DROP CONSTRAINT "Complex_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Complex_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Complex_id_seq";

-- AlterTable
ALTER TABLE "Election" DROP CONSTRAINT "Election_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "ElectionStatus" NOT NULL DEFAULT 'DRAFT',
ADD CONSTRAINT "Election_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Election_id_seq";

-- AlterTable
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ALTER COLUMN "personId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Ownership_id_seq";

-- AlterTable
ALTER TABLE "Person" DROP CONSTRAINT "Person_pkey",
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Person_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Person_id_seq";

-- AlterTable
ALTER TABLE "Property" DROP CONSTRAINT "Property_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "complexId" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'VACANT',
ADD CONSTRAINT "Property_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Property_id_seq";

-- AlterTable
ALTER TABLE "PropertyAddress" DROP CONSTRAINT "PropertyAddress_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyAddress_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PropertyAddress_id_seq";

-- AlterTable
ALTER TABLE "Residency" DROP CONSTRAINT "Residency_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ALTER COLUMN "personId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Residency_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Residency_id_seq";

-- AlterTable
ALTER TABLE "Resident" DROP CONSTRAINT "Resident_pkey",
ADD COLUMN     "personId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "unitId" SET DATA TYPE TEXT,
ALTER COLUMN "buildingId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Resident_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Resident_id_seq";

-- AlterTable
ALTER TABLE "Unit" DROP CONSTRAINT "Unit_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "buildingId" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Unit_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Unit_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "personId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_pkey",
ADD COLUMN     "voterId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "residentId" DROP NOT NULL,
ALTER COLUMN "residentId" SET DATA TYPE TEXT,
ALTER COLUMN "candidateId" SET DATA TYPE TEXT,
ALTER COLUMN "electionId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Vote_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Vote_id_seq";

-- DropEnum
DROP TYPE "PropertyRelationType";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "personId" TEXT,
    "electionId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_personId_idx" ON "AuditLog"("personId");

-- CreateIndex
CREATE INDEX "AuditLog_electionId_idx" ON "AuditLog"("electionId");

-- CreateIndex
CREATE INDEX "Building_complexId_idx" ON "Building"("complexId");

-- CreateIndex
CREATE INDEX "Candidate_personId_idx" ON "Candidate"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_electionId_personId_key" ON "Candidate"("electionId", "personId");

-- CreateIndex
CREATE INDEX "Election_status_idx" ON "Election"("status");

-- CreateIndex
CREATE INDEX "Ownership_propertyId_idx" ON "Ownership"("propertyId");

-- CreateIndex
CREATE INDEX "Ownership_personId_idx" ON "Ownership"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_propertyId_personId_startDate_key" ON "Ownership"("propertyId", "personId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Person_nationalId_key" ON "Person"("nationalId");

-- CreateIndex
CREATE INDEX "Property_complexId_idx" ON "Property"("complexId");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "PropertyAddress_propertyId_idx" ON "PropertyAddress"("propertyId");

-- CreateIndex
CREATE INDEX "Residency_propertyId_idx" ON "Residency"("propertyId");

-- CreateIndex
CREATE INDEX "Residency_personId_idx" ON "Residency"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Residency_propertyId_personId_startDate_key" ON "Residency"("propertyId", "personId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "Resident_personId_key" ON "Resident"("personId");

-- CreateIndex
CREATE INDEX "Resident_unitId_idx" ON "Resident"("unitId");

-- CreateIndex
CREATE INDEX "Resident_buildingId_idx" ON "Resident"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_buildingId_idx" ON "Unit"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_propertyId_idx" ON "Unit"("propertyId");

-- CreateIndex
CREATE INDEX "Vote_candidateId_idx" ON "Vote"("candidateId");

-- CreateIndex
CREATE INDEX "Vote_voterId_idx" ON "Vote"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_electionId_voterId_key" ON "Vote"("electionId", "voterId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_complexId_fkey" FOREIGN KEY ("complexId") REFERENCES "Complex"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAddress" ADD CONSTRAINT "PropertyAddress_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residency" ADD CONSTRAINT "Residency_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Residency" ADD CONSTRAINT "Residency_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE SET NULL ON UPDATE CASCADE;
