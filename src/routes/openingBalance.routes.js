const express = require("express");

const {
  getOpeningBalances,
  getOpeningBalanceById,
  getOpeningBalancesByFiscalPeriod,
  getOpeningBalancesByAccount,
  getOpeningBalanceByFiscalPeriodAndAccount,
  validateOpeningBalances,
  createOpeningBalance,
  updateOpeningBalance,
  deleteOpeningBalance,
} = require("../controllers/openingBalance.controller");

const router = express.Router();

// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     OpeningBalance:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         accountId:
 *           type: string
 *           format: uuid
 *         debit:
 *           type: number
 *           format: double
 *           example: 1000000
 *         credit:
 *           type: number
 *           format: double
 *           example: 0
 *         description:
 *           type: string
 *           nullable: true
 *           example: مانده افتتاحیه حساب بانک
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateOpeningBalance:
 *       type: object
 *       required:
 *         - fiscalPeriodId
 *         - accountId
 *       properties:
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         accountId:
 *           type: string
 *           format: uuid
 *         debit:
 *           type: number
 *           format: double
 *           default: 0
 *           example: 1000000
 *         credit:
 *           type: number
 *           format: double
 *           default: 0
 *         description:
 *           type: string
 *           nullable: true
 *           example: مانده افتتاحیه حساب بانک ملت
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *           default: ACTIVE
 *
 *     UpdateOpeningBalance:
 *       type: object
 *       properties:
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         accountId:
 *           type: string
 *           format: uuid
 *         debit:
 *           type: number
 *           format: double
 *           example: 1000000
 *         credit:
 *           type: number
 *           format: double
 *           example: 0
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 */

// ======================================================
// GET ALL OPENING BALANCES
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances:
 *   get:
 *     summary: Get all opening balances
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Opening balances fetched successfully
 *       500:
 *         description: Failed to fetch opening balances
 */
router.get("/", getOpeningBalances);

// ======================================================
// GET OPENING BALANCES BY FISCAL PERIOD
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/fiscal-period/{fiscalPeriodId}:
 *   get:
 *     summary: Get opening balances by fiscal period
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balances fetched successfully
 *       400:
 *         description: Fiscal period ID is required
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Failed to fetch opening balances
 */
router.get("/fiscal-period/:fiscalPeriodId", getOpeningBalancesByFiscalPeriod);

// ======================================================
// GET OPENING BALANCES BY ACCOUNT
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/account/{accountId}:
 *   get:
 *     summary: Get opening balances by account
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balances fetched successfully
 *       400:
 *         description: Account ID is required
 *       404:
 *         description: Account not found
 *       500:
 *         description: Failed to fetch opening balances
 */
router.get("/account/:accountId", getOpeningBalancesByAccount);

// ======================================================
// GET OPENING BALANCE BY FISCAL PERIOD AND ACCOUNT
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/fiscal-period/{fiscalPeriodId}/account/{accountId}:
 *   get:
 *     summary: Get opening balance by fiscal period and account
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balance fetched successfully
 *       400:
 *         description: Fiscal period ID and account ID are required
 *       404:
 *         description: Opening balance not found
 *       500:
 *         description: Failed to fetch opening balance
 */
router.get(
  "/fiscal-period/:fiscalPeriodId/account/:accountId",
  getOpeningBalanceByFiscalPeriodAndAccount
);

// ======================================================
// VALIDATE OPENING BALANCES
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/validate/{fiscalPeriodId}:
 *   get:
 *     summary: Validate opening balances for a fiscal period
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balance validation completed successfully
 *       400:
 *         description: Fiscal period ID is required
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Failed to validate opening balances
 */
router.get("/validate/:fiscalPeriodId", validateOpeningBalances);

// ======================================================
// GET OPENING BALANCE BY ID
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/{id}:
 *   get:
 *     summary: Get opening balance by ID
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balance fetched successfully
 *       400:
 *         description: Opening balance ID is required
 *       404:
 *         description: Opening balance not found
 *       500:
 *         description: Failed to fetch opening balance
 */
router.get("/:id", getOpeningBalanceById);

// ======================================================
// CREATE OPENING BALANCE
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances:
 *   post:
 *     summary: Create opening balance
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOpeningBalance'
 *     responses:
 *       201:
 *         description: Opening balance created successfully
 *       400:
 *         description: Invalid opening balance data
 *       404:
 *         description: Fiscal period or account not found
 *       409:
 *         description: Opening balance already exists
 *       500:
 *         description: Failed to create opening balance
 */
router.post("/", createOpeningBalance);

// ======================================================
// UPDATE OPENING BALANCE
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/{id}:
 *   put:
 *     summary: Update opening balance
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOpeningBalance'
 *     responses:
 *       200:
 *         description: Opening balance updated successfully
 *       400:
 *         description: Invalid opening balance data or inactive fiscal period
 *       404:
 *         description: Opening balance, fiscal period, or account not found
 *       409:
 *         description: Opening balance cannot be changed because it has financial history
 *       500:
 *         description: Failed to update opening balance
 */
router.put("/:id", updateOpeningBalance);

// ======================================================
// DELETE OPENING BALANCE
// ======================================================

/**
 * @swagger
 * /api/finance/opening-balances/{id}:
 *   delete:
 *     summary: Delete opening balance
 *     tags:
 *       - Opening Balances
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Opening balance deleted successfully
 *       400:
 *         description: Opening balance ID is required or fiscal period is inactive
 *       404:
 *         description: Opening balance not found
 *       409:
 *         description: Opening balance cannot be deleted because the fiscal period has financial history
 *       500:
 *         description: Failed to delete opening balance
 */
router.delete("/:id", deleteOpeningBalance);

module.exports = router;
