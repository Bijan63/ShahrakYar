/*
  Warnings:

  - Added the required column `direction` to the `CashFlowMapping` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CashFlowDirection" AS ENUM ('INFLOW', 'OUTFLOW');

-- DropIndex
DROP INDEX "CashFlowMapping_fiscalPeriodId_cashAccountId_counterpartAcc_idx";

-- AlterTable
ALTER TABLE "CashFlowMapping" ADD COLUMN     "direction" "CashFlowDirection" NOT NULL;

-- CreateIndex
CREATE INDEX "CashFlowMapping_fiscalPeriodId_cashAccountId_counterpartAcc_idx" ON "CashFlowMapping"("fiscalPeriodId", "cashAccountId", "counterpartAccountId", "direction", "priority");
