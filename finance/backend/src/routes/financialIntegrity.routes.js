const express =
    require("express");

const {
    validateFinancialIntegrity
} =
    require("../controllers/financialIntegrity.controller");

const router =
    express.Router();


/**
 * @swagger
 * tags:
 *   name: Financial Integrity
 *   description: Financial integrity validation
 */


/**
 * @swagger
 * /api/finance/financial-integrity/{fiscalPeriodId}:
 *   get:
 *     summary: Validate financial integrity
 *     description: |
 *       Validates the financial integrity of a fiscal period.
 *
 *       The validation checks:
 *       - Opening balances
 *       - Journal entries
 *       - Journal entry debit/credit equality
 *       - Account validity
 *       - Trial balance
 *       - Balance sheet
 *       - Overall financial consistency
 *
 *     tags:
 *       - Financial Integrity
 *
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period ID
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 24afbeea-defd-47bf-a56a-9fb0f9b2f0f2
 *
 *     responses:
 *       200:
 *         description: Financial integrity validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Financial integrity validation passed
 *
 *                 data:
 *                   type: object
 *                   properties:
 *
 *                     fiscalPeriod:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         code:
 *                           type: string
 *                           example: "1405"
 *                         name:
 *                           type: string
 *                           example: دوره مالی سال 1405 - اصلاح شده
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           example: ACTIVE
 *
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *
 *                     openingBalances:
 *                       type: object
 *                       properties:
 *                         isBalanced:
 *                           type: boolean
 *                           example: true
 *                         isValid:
 *                           type: boolean
 *                           example: true
 *                         openingBalanceCount:
 *                           type: integer
 *                           example: 3
 *                         totalDebit:
 *                           type: number
 *                           example: 3500000
 *                         totalCredit:
 *                           type: number
 *                           example: 3500000
 *                         difference:
 *                           type: number
 *                           example: 0
 *                         invalidCount:
 *                           type: integer
 *                           example: 0
 *                         invalidBalances:
 *                           type: array
 *                           items:
 *                             type: object
 *
 *                     journalEntries:
 *                       type: object
 *                       properties:
 *                         totalEntries:
 *                           type: integer
 *                           example: 17
 *                         unbalancedCount:
 *                           type: integer
 *                           example: 0
 *                         invalidCount:
 *                           type: integer
 *                           example: 0
 *                         isBalanced:
 *                           type: boolean
 *                           example: true
 *                         isValid:
 *                           type: boolean
 *                           example: true
 *                         unbalancedEntries:
 *                           type: array
 *                           items:
 *                             type: object
 *                         invalidEntries:
 *                           type: array
 *                           items:
 *                             type: object
 *
 *                     trialBalance:
 *                       type: object
 *                       properties:
 *                         totalDebit:
 *                           type: number
 *                           example: 40200000
 *                         totalCredit:
 *                           type: number
 *                           example: 40200000
 *                         difference:
 *                           type: number
 *                           example: 0
 *                         isBalanced:
 *                           type: boolean
 *                           example: true
 *
 *                     balanceSheet:
 *                       type: object
 *                       properties:
 *                         totalAssets:
 *                           type: number
 *                           example: 32200000
 *                         totalLiabilitiesAndEquity:
 *                           type: number
 *                           example: 32200000
 *                         difference:
 *                           type: number
 *                           example: 0
 *                         isBalanced:
 *                           type: boolean
 *                           example: true
 *
 *       400:
 *         description: Invalid fiscal period ID or validation error
 *
 *       404:
 *         description: Fiscal period not found
 *
 *       500:
 *         description: Internal server error
 */
router.get(
    "/:fiscalPeriodId",
    validateFinancialIntegrity
);


module.exports =
    router;