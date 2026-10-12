-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('MONTHLY', 'ANNUAL', 'SPECIAL', 'UTILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "UnitAccount" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnitAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charge" (
    "id" TEXT NOT NULL,
    "unitAccountId" TEXT NOT NULL,
    "fiscalPeriodId" TEXT,
    "type" "ChargeType" NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "periodMonth" INTEGER,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" "ChargeStatus" NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charge_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "UnitAccount_unitId_key" ON "UnitAccount"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitAccount_code_key" ON "UnitAccount"("code");

-- CreateIndex
CREATE INDEX "UnitAccount_isActive_idx" ON "UnitAccount"("isActive");

-- CreateIndex
CREATE INDEX "Charge_unitAccountId_idx" ON "Charge"("unitAccountId");

-- CreateIndex
CREATE INDEX "Charge_fiscalPeriodId_idx" ON "Charge"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "Charge_type_idx" ON "Charge"("type");

-- CreateIndex
CREATE INDEX "Charge_periodYear_idx" ON "Charge"("periodYear");

-- CreateIndex
CREATE INDEX "Charge_periodMonth_idx" ON "Charge"("periodMonth");

-- CreateIndex
CREATE INDEX "Charge_status_idx" ON "Charge"("status");

-- CreateIndex
CREATE INDEX "Charge_issueDate_idx" ON "Charge"("issueDate");

-- CreateIndex
CREATE INDEX "Charge_dueDate_idx" ON "Charge"("dueDate");

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

-- AddForeignKey
ALTER TABLE "UnitAccount" ADD CONSTRAINT "UnitAccount_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_unitAccountId_fkey" FOREIGN KEY ("unitAccountId") REFERENCES "UnitAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_unitAccountId_fkey" FOREIGN KEY ("unitAccountId") REFERENCES "UnitAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "Charge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargePayment" ADD CONSTRAINT "ChargePayment_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE SET NULL ON UPDATE CASCADE;
