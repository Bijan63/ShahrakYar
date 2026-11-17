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
CREATE INDEX "OpeningBalance_fiscalPeriodId_idx" ON "OpeningBalance"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "OpeningBalance_accountId_idx" ON "OpeningBalance"("accountId");

-- CreateIndex
CREATE INDEX "OpeningBalance_status_idx" ON "OpeningBalance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpeningBalance_fiscalPeriodId_accountId_key" ON "OpeningBalance"("fiscalPeriodId", "accountId");

-- AddForeignKey
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpeningBalance" ADD CONSTRAINT "OpeningBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
