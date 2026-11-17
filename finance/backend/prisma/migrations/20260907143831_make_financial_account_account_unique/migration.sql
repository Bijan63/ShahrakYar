/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `FinancialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FinancialAccount_accountId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_accountId_key" ON "FinancialAccount"("accountId");
