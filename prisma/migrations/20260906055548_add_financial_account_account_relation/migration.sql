/*
  Warnings:

  - A unique constraint covering the columns `[fiscalPeriodId,code]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Made the column `fiscalPeriodId` on table `Account` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Account_code_key";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "fiscalPeriodId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "ChargePayment" (
    "id" TEXT NOT NULL,
    "unitAccountId" TEXT NOT NULL,
    "chargeId" TEXT,
    "residentId" TEXT,
    "financialAccountId" TEXT,
    "journalEntryId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChargePayment_unitAccountId_idx" ON "ChargePayment"("unitAccountId");

-- CreateIndex
CREATE INDEX "ChargePayment_chargeId_idx" ON "ChargePayment"("chargeId");

-- CreateIndex
CREATE INDEX "ChargePayment_residentId_idx" ON "ChargePayment"("residentId");

-- CreateIndex
CREATE INDEX "ChargePayment_financialAccountId_idx" ON "ChargePayment"("financialAccountId");

-- CreateIndex
CREATE INDEX "ChargePayment_journalEntryId_idx" ON "ChargePayment"("journalEntryId");

-- CreateIndex
CREATE INDEX "ChargePayment_paymentDate_idx" ON "ChargePayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "Account_fiscalPeriodId_code_key" ON "Account"("fiscalPeriodId", "code");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountId_idx" ON "FinancialAccount"("accountId");

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
