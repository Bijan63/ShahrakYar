-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('OPERATING', 'CAPITAL');

-- CreateEnum
CREATE TYPE "FinancialAccountType" AS ENUM ('BANK', 'CASH', 'POS');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "FiscalPeriod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fund" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FundType" NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "fiscalPeriodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyAccount" (
    "id" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "fiscalPeriodId" TEXT,
    "fundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "fiscalPeriodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialAccountType" NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "cardNumber" TEXT,
    "iban" TEXT,
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "fiscalPeriodId" TEXT,
    "fundId" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingConfiguration" (
    "id" TEXT NOT NULL,
    "fiscalPeriodId" TEXT NOT NULL,
    "chargeReceivableAccountId" TEXT NOT NULL,
    "chargeRevenueAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalPeriodId" TEXT NOT NULL,
    "fundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntryLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpeningBalance" (
    "id" TEXT NOT NULL,
    "fiscalPeriodId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpeningBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalPeriod_code_key" ON "FiscalPeriod"("code");

-- CreateIndex
CREATE INDEX "FiscalPeriod_startDate_idx" ON "FiscalPeriod"("startDate");

-- CreateIndex
CREATE INDEX "FiscalPeriod_endDate_idx" ON "FiscalPeriod"("endDate");

-- CreateIndex
CREATE INDEX "FiscalPeriod_status_idx" ON "FiscalPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Fund_code_key" ON "Fund"("code");

-- CreateIndex
CREATE INDEX "Fund_type_idx" ON "Fund"("type");

-- CreateIndex
CREATE INDEX "Fund_status_idx" ON "Fund"("status");

-- CreateIndex
CREATE INDEX "Fund_fiscalPeriodId_idx" ON "Fund"("fiscalPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAccount_accountNumber_key" ON "PropertyAccount"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAccount_propertyId_key" ON "PropertyAccount"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAccount_propertyId_idx" ON "PropertyAccount"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAccount_status_idx" ON "PropertyAccount"("status");

-- CreateIndex
CREATE INDEX "PropertyAccount_fiscalPeriodId_idx" ON "PropertyAccount"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "PropertyAccount_fundId_idx" ON "PropertyAccount"("fundId");

-- CreateIndex
CREATE INDEX "Account_type_idx" ON "Account"("type");

-- CreateIndex
CREATE INDEX "Account_parentId_idx" ON "Account"("parentId");

-- CreateIndex
CREATE INDEX "Account_isActive_idx" ON "Account"("isActive");

-- CreateIndex
CREATE INDEX "Account_fiscalPeriodId_idx" ON "Account"("fiscalPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_fiscalPeriodId_code_key" ON "Account"("fiscalPeriodId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_code_key" ON "FinancialAccount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_accountId_key" ON "FinancialAccount"("accountId");

-- CreateIndex
CREATE INDEX "FinancialAccount_type_idx" ON "FinancialAccount"("type");

-- CreateIndex
CREATE INDEX "FinancialAccount_status_idx" ON "FinancialAccount"("status");

-- CreateIndex
CREATE INDEX "FinancialAccount_fiscalPeriodId_idx" ON "FinancialAccount"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "FinancialAccount_fundId_idx" ON "FinancialAccount"("fundId");

-- CreateIndex
CREATE INDEX "FinancialAccount_accountId_idx" ON "FinancialAccount"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingConfiguration_fiscalPeriodId_key" ON "AccountingConfiguration"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "AccountingConfiguration_chargeReceivableAccountId_idx" ON "AccountingConfiguration"("chargeReceivableAccountId");

-- CreateIndex
CREATE INDEX "AccountingConfiguration_chargeRevenueAccountId_idx" ON "AccountingConfiguration"("chargeRevenueAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_entryNumber_key" ON "JournalEntry"("entryNumber");

-- CreateIndex
CREATE INDEX "JournalEntry_entryDate_idx" ON "JournalEntry"("entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntry_fiscalPeriodId_idx" ON "JournalEntry"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "JournalEntry_fundId_idx" ON "JournalEntry"("fundId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON "JournalEntryLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_accountId_idx" ON "JournalEntryLine"("accountId");

-- CreateIndex
CREATE INDEX "OpeningBalance_fiscalPeriodId_idx" ON "OpeningBalance"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "OpeningBalance_accountId_idx" ON "OpeningBalance"("accountId");

-- CreateIndex
CREATE INDEX "OpeningBalance_status_idx" ON "OpeningBalance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningBalance_fiscalPeriodId_accountId_key" ON "OpeningBalance"("fiscalPeriodId", "accountId");

-- AddForeignKey
ALTER TABLE "Fund" ADD CONSTRAINT "Fund_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAccount" ADD CONSTRAINT "PropertyAccount_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAccount" ADD CONSTRAINT "PropertyAccount_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingConfiguration" ADD CONSTRAINT "AccountingConfiguration_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingConfiguration" ADD CONSTRAINT "AccountingConfiguration_chargeReceivableAccountId_fkey" FOREIGN KEY ("chargeReceivableAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingConfiguration" ADD CONSTRAINT "AccountingConfiguration_chargeRevenueAccountId_fkey" FOREIGN KEY ("chargeRevenueAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_financialAccountId_fkey" FOREIGN KEY ("financialAccountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
