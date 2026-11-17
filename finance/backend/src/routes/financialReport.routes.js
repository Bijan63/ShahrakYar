const express =
    require("express");

const {

    getTrialBalance,

    getGeneralLedger,

    getBalanceSheet,

    getIncomeStatement,

    getCashFlowStatement

} =
    require("../controllers/financialReport.controller");


const router =
    express.Router();


// ======================================================
// Financial Reports
// ======================================================


/**
 * @swagger
 * tags:
 *   name: Financial Reports
 *   description: Financial reporting APIs
 */


/**
 * @swagger
 * /api/finance/reports/trial-balance:
 *   get:
 *     summary: Get Trial Balance
 *     description: >
 *       Returns the trial balance for all leaf accounts of the selected
 *       fiscal period. Opening balances are combined with posted journal
 *       entry movements. The report is balanced when total debit equals
 *       total credit.
 *     tags:
 *       - Financial Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Trial balance fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trial balance fetched successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - fiscalPeriod
 *                     - totalDebit
 *                     - totalCredit
 *                     - difference
 *                     - isBalanced
 *                     - accounts
 *                   properties:
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
 *                     totalDebit:
 *                       type: number
 *                       example: 40200000
 *                     totalCredit:
 *                       type: number
 *                       example: 40200000
 *                     difference:
 *                       type: number
 *                       example: 0
 *                     isBalanced:
 *                       type: boolean
 *                       example: true
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           accountId:
 *                             type: string
 *                             format: uuid
 *                           code:
 *                             type: string
 *                             example: "1101"
 *                           name:
 *                             type: string
 *                             example: بانک ملت
 *                           type:
 *                             type: string
 *                             example: ASSET
 *                           parentId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           openingDebit:
 *                             type: number
 *                             example: 0
 *                           openingCredit:
 *                             type: number
 *                             example: 0
 *                           periodDebit:
 *                             type: number
 *                             example: 29100000
 *                           periodCredit:
 *                             type: number
 *                             example: 3500000
 *                           debit:
 *                             type: number
 *                             example: 29100000
 *                           credit:
 *                             type: number
 *                             example: 3500000
 *                           balance:
 *                             type: number
 *                             example: 25600000
 *       400:
 *         description: Invalid fiscal period or request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get(

    "/reports/trial-balance",

    getTrialBalance

);


/**
 * @swagger
 * /api/finance/reports/general-ledger:
 *   get:
 *     summary: Get General Ledger
 *     description: >
 *       Returns the general ledger for a leaf account within the selected
 *       fiscal period, including opening balance, posted journal movements,
 *       running balances and closing balance.
 *     tags:
 *       - Financial Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: accountId
 *         required: true
 *         description: Leaf account ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: General ledger fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: General ledger fetched successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - fiscalPeriod
 *                     - account
 *                     - openingBalance
 *                     - totalDebit
 *                     - totalCredit
 *                     - closingBalance
 *                     - lines
 *                   properties:
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
 *                     account:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         code:
 *                           type: string
 *                           example: "1101"
 *                         name:
 *                           type: string
 *                           example: بانک ملت
 *                         type:
 *                           type: string
 *                           example: ASSET
 *                     openingBalance:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           nullable: true
 *                         debit:
 *                           type: number
 *                           example: 0
 *                         credit:
 *                           type: number
 *                           example: 0
 *                         balance:
 *                           type: number
 *                           example: 0
 *                     totalDebit:
 *                       type: number
 *                       example: 29100000
 *                     totalCredit:
 *                       type: number
 *                       example: 3500000
 *                     closingBalance:
 *                       type: number
 *                       example: 25600000
 *                     lines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           type:
 *                             type: string
 *                             example: JOURNAL_ENTRY
 *                           journalEntryId:
 *                             type: string
 *                             format: uuid
 *                           entryNumber:
 *                             type: string
 *                             example: JV-1405-001
 *                           entryDate:
 *                             type: string
 *                             format: date-time
 *                           description:
 *                             type: string
 *                             nullable: true
 *                           debit:
 *                             type: number
 *                             example: 1000000
 *                           credit:
 *                             type: number
 *                             example: 0
 *                           balance:
 *                             type: number
 *                             example: 1000000
 *       400:
 *         description: Invalid fiscal period or account
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fiscal period or account not found
 *       500:
 *         description: Internal server error
 */
router.get(

    "/reports/general-ledger",

    getGeneralLedger

);


/**
 * @swagger
 * /api/finance/reports/balance-sheet/{fiscalPeriodId}:
 *   get:
 *     summary: Get Balance Sheet
 *     description: >
 *       Returns the balance sheet for the selected fiscal period, including
 *       assets, liabilities, equity, current-period revenue, expenses,
 *       net income and the final balance check.
 *     tags:
 *       - Financial Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Balance sheet fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Balance sheet fetched successfully
 *                 data:
 *                   type: object
 *                   required:
 *                     - fiscalPeriod
 *                     - assets
 *                     - liabilities
 *                     - equity
 *                     - currentPeriod
 *                     - totalAssets
 *                     - totalLiabilitiesAndEquity
 *                     - difference
 *                     - isBalanced
 *                   properties:
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
 *                     assets:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 32200000
 *                         accounts:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/BalanceSheetAccount"
 *                     liabilities:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 0
 *                         accounts:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/BalanceSheetAccount"
 *                     equity:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 3500000
 *                         accounts:
 *                           type: array
 *                           items:
 *                             $ref: "#/components/schemas/BalanceSheetAccount"
 *                     currentPeriod:
 *                       type: object
 *                       properties:
 *                         revenue:
 *                           type: number
 *                           example: 30200000
 *                         expenses:
 *                           type: number
 *                           example: 1500000
 *                         netIncome:
 *                           type: number
 *                           example: 28700000
 *                     totalAssets:
 *                       type: number
 *                       example: 32200000
 *                     totalLiabilitiesAndEquity:
 *                       type: number
 *                       example: 32200000
 *                     difference:
 *                       type: number
 *                       example: 0
 *                     isBalanced:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid fiscal period
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get(

    "/reports/balance-sheet/:fiscalPeriodId",

    getBalanceSheet

);


/**
 * @swagger
 * /api/finance/reports/income-statement/{fiscalPeriodId}:
 *   get:
 *     summary: Get Income Statement
 *     description: >
 *       Returns revenue, expenses and net income for the selected
 *       fiscal period based on posted journal entries.
 *     tags:
 *       - Financial Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Income statement fetched successfully
 *       400:
 *         description: Invalid fiscal period
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get(

    "/reports/income-statement/:fiscalPeriodId",

    getIncomeStatement

);


/**
 * @swagger
 * /api/finance/reports/cash-flow/{fiscalPeriodId}:
 *   get:
 *     summary: Get Cash Flow Statement
 *     description: >
 *       Returns the cash flow statement for the selected fiscal period using
 *       POSTED journal entries only. Cash movements are classified into
 *       operating, investing and financing activities. Cash-to-cash journal
 *       entries are reported separately as internal transfers. Unclassified
 *       balance-sheet counterpart movements are exposed under
 *       unmappedCashMovements and are included only in the reconciliation
 *       that compares the report with the cash ledger.
 *     tags:
 *       - Financial Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         description: Fiscal period UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Cash flow statement fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *                 - message
 *                 - data
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cash flow statement fetched successfully
 *                 data:
 *                   $ref: "#/components/schemas/CashFlowStatement"
 *       400:
 *         description: Invalid fiscal period or request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get(

    "/reports/cash-flow/:fiscalPeriodId",

    getCashFlowStatement

);

// ======================================================
// Swagger Schemas
// ======================================================


/**
 * @swagger
 * components:
 *   schemas:
 *     CashFlowFiscalPeriod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "1405"
 *         name:
 *           type: string
 *           example: دوره مالی سال 1405 - اصلاح شده
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           example: ACTIVE
 *
 *     CashFlowMovement:
 *       type: object
 *       properties:
 *         journalEntryId:
 *           type: string
 *           format: uuid
 *         entryNumber:
 *           type: string
 *           example: JV-CF-TEST-INVESTING-20260924
 *         entryDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *           nullable: true
 *         cashAccountId:
 *           type: string
 *           format: uuid
 *         cashAccountCode:
 *           type: string
 *           example: "1101"
 *         cashAccountName:
 *           type: string
 *           example: بانک ملت
 *         counterpartAccountId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         counterpartAccountCode:
 *           type: string
 *           nullable: true
 *           example: "1501"
 *         counterpartAccountName:
 *           type: string
 *           nullable: true
 *           example: تجهیزات و تأسیسات
 *         counterpartAccountType:
 *           type: string
 *           nullable: true
 *           example: ASSET
 *         amount:
 *           type: number
 *           example: 5000000
 *         classification:
 *           type: string
 *           enum:
 *             - OPERATING
 *             - INVESTING
 *             - FINANCING
 *             - NONE
 *           example: INVESTING
 *         direction:
 *           type: string
 *           enum:
 *             - INFLOW
 *             - OUTFLOW
 *           example: OUTFLOW
 *         allocation:
 *           type: string
 *           enum:
 *             - PROPORTIONAL
 *             - FALLBACK
 *           example: PROPORTIONAL
 *
 *     CashFlowActivitySection:
 *       type: object
 *       required:
 *         - inflows
 *         - outflows
 *         - netCashFlow
 *       properties:
 *         inflows:
 *           type: object
 *           required:
 *             - total
 *             - items
 *           properties:
 *             total:
 *               type: number
 *               example: 180000000
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CashFlowMovement"
 *         outflows:
 *           type: object
 *           required:
 *             - total
 *             - items
 *           properties:
 *             total:
 *               type: number
 *               example: 1000000
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CashFlowMovement"
 *         netCashFlow:
 *           type: number
 *           example: 179000000
 *
 *     CashFlowUnmappedMovements:
 *       type: object
 *       required:
 *         - total
 *         - inflows
 *         - outflows
 *         - netCashFlow
 *       properties:
 *         total:
 *           type: number
 *           example: 0
 *         inflows:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               example: 0
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CashFlowMovement"
 *         outflows:
 *           type: object
 *           properties:
 *             total:
 *               type: number
 *               example: 0
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CashFlowMovement"
 *         netCashFlow:
 *           type: number
 *           example: 0
 *
 *     CashFlowInternalTransfer:
 *       type: object
 *       properties:
 *         journalEntryId:
 *           type: string
 *           format: uuid
 *         entryNumber:
 *           type: string
 *           example: JV-CF-TEST-TRANSFER-20260924
 *         entryDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *           nullable: true
 *         cashAccountId:
 *           type: string
 *           format: uuid
 *         cashAccountCode:
 *           type: string
 *           example: "1102"
 *         cashAccountName:
 *           type: string
 *           example: بانک صادرات
 *         debit:
 *           type: number
 *           example: 2000000
 *         credit:
 *           type: number
 *           example: 0
 *         transferType:
 *           type: string
 *           enum:
 *             - IN
 *             - OUT
 *           example: IN
 *
 *     CashFlowOpeningAccount:
 *       type: object
 *       required:
 *         - accountId
 *         - code
 *         - name
 *         - debit
 *         - credit
 *         - balance
 *         - balanceSide
 *       properties:
 *         accountId:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "1103"
 *         name:
 *           type: string
 *           example: بانک ملی
 *         debit:
 *           type: number
 *           example: 2000000
 *         credit:
 *           type: number
 *           example: 0
 *         balance:
 *           type: number
 *           example: 2000000
 *         balanceSide:
 *           type: string
 *           enum:
 *             - DEBIT
 *             - CREDIT
 *             - ZERO
 *           example: DEBIT
 *
 *     CashFlowClosingAccount:
 *       type: object
 *       required:
 *         - accountId
 *         - code
 *         - name
 *         - openingDebit
 *         - openingCredit
 *         - periodDebit
 *         - periodCredit
 *         - closingBalance
 *         - balanceSide
 *       properties:
 *         accountId:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: "1101"
 *         name:
 *           type: string
 *           example: بانک ملت
 *         openingDebit:
 *           type: number
 *           example: 0
 *         openingCredit:
 *           type: number
 *           example: 0
 *         periodDebit:
 *           type: number
 *           example: 190000000
 *         periodCredit:
 *           type: number
 *           example: 8000000
 *         closingBalance:
 *           type: number
 *           example: 182000000
 *         balanceSide:
 *           type: string
 *           enum:
 *             - DEBIT
 *             - CREDIT
 *             - ZERO
 *           example: DEBIT
 *
 *     CashFlowReconciliation:
 *       type: object
 *       required:
 *         - ledgerClosingCash
 *         - difference
 *         - differenceAfterUnmapped
 *         - unmappedCashNetChange
 *         - unmappedCashMovementCount
 *         - isClassificationComplete
 *         - isReconciled
 *       properties:
 *         ledgerClosingCash:
 *           type: number
 *           example: 187500000
 *         difference:
 *           type: number
 *           example: 0
 *         differenceAfterUnmapped:
 *           type: number
 *           example: 0
 *         unmappedCashNetChange:
 *           type: number
 *           example: 0
 *         unmappedCashMovementCount:
 *           type: integer
 *           example: 0
 *         isClassificationComplete:
 *           type: boolean
 *           example: true
 *         isReconciled:
 *           type: boolean
 *           example: true
 *
 *     CashFlowStatement:
 *       type: object
 *       required:
 *         - fiscalPeriod
 *         - operatingActivities
 *         - investingActivities
 *         - financingActivities
 *         - unmappedCashMovements
 *         - internalTransfers
 *         - openingCash
 *         - openingCashAccounts
 *         - netChangeInCash
 *         - netChangeInCashIncludingUnmapped
 *         - closingCash
 *         - closingCashIncludingUnmapped
 *         - closingCashAccounts
 *         - reconciliation
 *       properties:
 *         fiscalPeriod:
 *           $ref: "#/components/schemas/CashFlowFiscalPeriod"
 *         operatingActivities:
 *           $ref: "#/components/schemas/CashFlowActivitySection"
 *         investingActivities:
 *           $ref: "#/components/schemas/CashFlowActivitySection"
 *         financingActivities:
 *           $ref: "#/components/schemas/CashFlowActivitySection"
 *         unmappedCashMovements:
 *           $ref: "#/components/schemas/CashFlowUnmappedMovements"
 *         internalTransfers:
 *           type: object
 *           required:
 *             - total
 *             - items
 *           properties:
 *             total:
 *               type: number
 *               example: 2000000
 *             items:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/CashFlowInternalTransfer"
 *         openingCash:
 *           type: number
 *           example: 3500000
 *         openingCashAccounts:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/CashFlowOpeningAccount"
 *         netChangeInCash:
 *           type: number
 *           example: 184000000
 *         netChangeInCashIncludingUnmapped:
 *           type: number
 *           example: 184000000
 *         closingCash:
 *           type: number
 *           example: 187500000
 *         closingCashIncludingUnmapped:
 *           type: number
 *           example: 187500000
 *         closingCashAccounts:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/CashFlowClosingAccount"
 *         reconciliation:
 *           $ref: "#/components/schemas/CashFlowReconciliation"
 */

// ======================================================
// Export
// ======================================================

module.exports =
    router;