-- CreateEnum
CREATE TYPE "CashFlowClassification" AS ENUM ('NONE', 'OPERATING', 'INVESTING', 'FINANCING');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "cashFlowClassification" "CashFlowClassification" NOT NULL DEFAULT 'NONE';
