-- CreateTable
CREATE TABLE "CashFlowItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classification" "CashFlowClassification" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlowMapping" (
    "id" TEXT NOT NULL,
    "fiscalPeriodId" TEXT NOT NULL,
    "counterpartAccountId" TEXT NOT NULL,
    "cashAccountId" TEXT,
    "cashFlowItemId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashFlowMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CashFlowItem_code_key" ON "CashFlowItem"("code");

-- CreateIndex
CREATE INDEX "CashFlowItem_classification_idx" ON "CashFlowItem"("classification");

-- CreateIndex
CREATE INDEX "CashFlowItem_isActive_idx" ON "CashFlowItem"("isActive");

-- CreateIndex
CREATE INDEX "CashFlowItem_sortOrder_idx" ON "CashFlowItem"("sortOrder");

-- CreateIndex
CREATE INDEX "CashFlowMapping_fiscalPeriodId_idx" ON "CashFlowMapping"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "CashFlowMapping_counterpartAccountId_idx" ON "CashFlowMapping"("counterpartAccountId");

-- CreateIndex
CREATE INDEX "CashFlowMapping_cashAccountId_idx" ON "CashFlowMapping"("cashAccountId");

-- CreateIndex
CREATE INDEX "CashFlowMapping_cashFlowItemId_idx" ON "CashFlowMapping"("cashFlowItemId");

-- CreateIndex
CREATE INDEX "CashFlowMapping_isActive_idx" ON "CashFlowMapping"("isActive");

-- CreateIndex
CREATE INDEX "CashFlowMapping_fiscalPeriodId_priority_idx" ON "CashFlowMapping"("fiscalPeriodId", "priority");

-- CreateIndex
CREATE INDEX "CashFlowMapping_fiscalPeriodId_cashAccountId_counterpartAcc_idx" ON "CashFlowMapping"("fiscalPeriodId", "cashAccountId", "counterpartAccountId");

-- AddForeignKey
ALTER TABLE "CashFlowMapping" ADD CONSTRAINT "CashFlowMapping_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "FiscalPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowMapping" ADD CONSTRAINT "CashFlowMapping_counterpartAccountId_fkey" FOREIGN KEY ("counterpartAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowMapping" ADD CONSTRAINT "CashFlowMapping_cashAccountId_fkey" FOREIGN KEY ("cashAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowMapping" ADD CONSTRAINT "CashFlowMapping_cashFlowItemId_fkey" FOREIGN KEY ("cashFlowItemId") REFERENCES "CashFlowItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
