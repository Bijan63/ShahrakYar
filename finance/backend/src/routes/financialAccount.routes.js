const express = require("express");

const {
    getFinancialAccounts,
    getFinancialAccountById,
    getFinancialAccountByCode,
    createFinancialAccount,
    updateFinancialAccount,
    deleteFinancialAccount
} = require("../controllers/financialAccount.controller");


const router = express.Router();


// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     FinancialAccount:
 *       type: object
 *       properties:
 *
 *         id:
 *           type: string
 *           format: uuid
 *
 *         code:
 *           type: string
 *           example: BANK-MELLAT-1405
 *
 *         name:
 *           type: string
 *           example: حساب بانک ملت
 *
 *         type:
 *           type: string
 *           enum:
 *             - BANK
 *             - CASH
 *             - POS
 *
 *         bankName:
 *           type: string
 *           nullable: true
 *           example: بانک ملت
 *
 *         accountNumber:
 *           type: string
 *           nullable: true
 *           example: "1234567890"
 *
 *         cardNumber:
 *           type: string
 *           nullable: true
 *           example: "6104331234567890"
 *
 *         iban:
 *           type: string
 *           nullable: true
 *           example: IR123456789012345678901234
 *
 *         openingBalance:
 *           type: string
 *           example: "12500000.50"
 *
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         accountId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         fiscalPeriod:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/FiscalPeriod'
 *
 *         fund:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Fund'
 *
 *         account:
 *           nullable: true
 *           allOf:
 *             - $ref: '#/components/schemas/Account'
 *
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *
 *     CreateFinancialAccount:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *       properties:
 *
 *         code:
 *           type: string
 *           example: BANK-MELLAT-1405
 *
 *         name:
 *           type: string
 *           example: حساب بانک ملت
 *
 *         type:
 *           type: string
 *           enum:
 *             - BANK
 *             - CASH
 *             - POS
 *
 *         bankName:
 *           type: string
 *           nullable: true
 *           example: بانک ملت
 *
 *         accountNumber:
 *           type: string
 *           nullable: true
 *           example: "1234567890"
 *
 *         cardNumber:
 *           type: string
 *           nullable: true
 *           example: "6104331234567890"
 *
 *         iban:
 *           type: string
 *           nullable: true
 *           example: IR123456789012345678901234
 *
 *         openingBalance:
 *           type: number
 *           format: double
 *           default: 0
 *           example: 12500000.50
 *
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *           default: ACTIVE
 *
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         accountId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *
 *     UpdateFinancialAccount:
 *       type: object
 *       properties:
 *
 *         code:
 *           type: string
 *
 *         name:
 *           type: string
 *
 *         type:
 *           type: string
 *           enum:
 *             - BANK
 *             - CASH
 *             - POS
 *
 *         bankName:
 *           type: string
 *           nullable: true
 *
 *         accountNumber:
 *           type: string
 *           nullable: true
 *
 *         cardNumber:
 *           type: string
 *           nullable: true
 *
 *         iban:
 *           type: string
 *           nullable: true
 *
 *         openingBalance:
 *           type: number
 *           format: double
 *
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *         accountId:
 *           type: string
 *           format: uuid
 *           nullable: true
 */


// ======================================================
// Financial Accounts
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts:
 *   get:
 *     summary: Get all financial accounts
 *     tags:
 *       - Financial Accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Financial accounts fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinancialAccount'
 */
router.get(
    "/",
    getFinancialAccounts
);


// ======================================================
// Get Financial Account by Code
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts/code/{code}:
 *   get:
 *     summary: Get financial account by code
 *     tags:
 *       - Financial Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Financial account fetched successfully
 *       400:
 *         description: Code is required
 *       404:
 *         description: Financial account not found
 */
router.get(
    "/code/:code",
    getFinancialAccountByCode
);


// ======================================================
// Get Financial Account by ID
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts/{id}:
 *   get:
 *     summary: Get financial account by ID
 *     tags:
 *       - Financial Accounts
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
 *         description: Financial account fetched successfully
 *       400:
 *         description: ID is required
 *       404:
 *         description: Financial account not found
 */
router.get(
    "/:id",
    getFinancialAccountById
);


// ======================================================
// Create Financial Account
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts:
 *   post:
 *     summary: Create financial account
 *     tags:
 *       - Financial Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFinancialAccount'
 *     responses:
 *       201:
 *         description: Financial account created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Financial account code already exists
 */
router.post(
    "/",
    createFinancialAccount
);


// ======================================================
// Update Financial Account
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts/{id}:
 *   put:
 *     summary: Update financial account
 *     tags:
 *       - Financial Accounts
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
 *             $ref: '#/components/schemas/UpdateFinancialAccount'
 *     responses:
 *       200:
 *         description: Financial account updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Financial account not found
 *       409:
 *         description: Financial account code already exists
 */
router.put(
    "/:id",
    updateFinancialAccount
);


// ======================================================
// Delete Financial Account
// ======================================================


/**
 * @swagger
 * /api/finance/financial-accounts/{id}:
 *   delete:
 *     summary: Delete financial account
 *     tags:
 *       - Financial Accounts
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
 *         description: Financial account deleted successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Financial account not found
 */
router.delete(
    "/:id",
    deleteFinancialAccount
);


// ======================================================
// Export
// ======================================================

module.exports = router;