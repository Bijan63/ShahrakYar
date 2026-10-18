const express = require("express");

const {
    getAccounts,
    getAccountById,
    getAccountByCode,
    getActiveAccountByCode,
    getAccountsByParentId,
    getRootAccounts,
    createAccount,
    updateAccount,
    deleteAccount
} = require("../controllers/account.controller");


const router = express.Router();


// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: 1100
 *         name:
 *           type: string
 *           example: بانک‌ها
 *         type:
 *           type: string
 *           enum:
 *             - ASSET
 *             - LIABILITY
 *             - EQUITY
 *             - REVENUE
 *             - EXPENSE
 *         cashFlowClassification:
 *           type: string
 *           enum:
 *             - NONE
 *             - OPERATING
 *             - INVESTING
 *             - FINANCING
 *           default: NONE
 *           example: OPERATING
 *           description: Cash flow classification used by financial reports
 *         description:
 *           type: string
 *           nullable: true
 *           example: حساب‌های بانکی شهرک
 *         isActive:
 *           type: boolean
 *           example: true
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *
 *     CreateAccount:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *       properties:
 *         code:
 *           type: string
 *           example: 1100
 *         name:
 *           type: string
 *           example: بانک‌ها
 *         type:
 *           type: string
 *           enum:
 *             - ASSET
 *             - LIABILITY
 *             - EQUITY
 *             - REVENUE
 *             - EXPENSE
 *         cashFlowClassification:
 *           type: string
 *           enum:
 *             - NONE
 *             - OPERATING
 *             - INVESTING
 *             - FINANCING
 *           default: NONE
 *           example: OPERATING
 *           description: Cash flow classification used by financial reports
 *         description:
 *           type: string
 *           nullable: true
 *           example: حساب‌های بانکی شهرک
 *         isActive:
 *           type: boolean
 *           default: true
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *
 *     UpdateAccount:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum:
 *             - ASSET
 *             - LIABILITY
 *             - EQUITY
 *             - REVENUE
 *             - EXPENSE
 *         cashFlowClassification:
 *           type: string
 *           enum:
 *             - NONE
 *             - OPERATING
 *             - INVESTING
 *             - FINANCING
 *           default: NONE
 *           example: OPERATING
 *           description: Cash flow classification used by financial reports
 *         description:
 *           type: string
 *           nullable: true
 *         isActive:
 *           type: boolean
 *         parentId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 */


// ======================================================
// Get All Accounts
// ======================================================

/**
 * @swagger
 * /api/finance/accounts:
 *   get:
 *     summary: Get all accounts
 *     tags:
 *       - Accounts
 *     responses:
 *       200:
 *         description: Accounts fetched successfully
 */
router.get(
    "/",
    getAccounts
);


// ======================================================
// Get Root Accounts
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/root:
 *   get:
 *     summary: Get root accounts
 *     description: Get accounts without a parent account
 *     tags:
 *       - Accounts
 *     responses:
 *       200:
 *         description: Root accounts fetched successfully
 */
router.get(
    "/root",
    getRootAccounts
);


// ======================================================
// Get Accounts by Parent ID
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/parent/{parentId}:
 *   get:
 *     summary: Get child accounts
 *     description: Get accounts belonging to a specific parent account
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Child accounts fetched successfully
 *       404:
 *         description: Parent account not found
 */
router.get(
    "/parent/:parentId",
    getAccountsByParentId
);


// ======================================================
// Get Account by Code
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/code/{code}:
 *   get:
 *     summary: Get account by code
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account fetched successfully
 *       404:
 *         description: Account not found
 */
router.get(
    "/code/:code",
    getAccountByCode
);


// ======================================================
// Get Active Account by Code
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/code/{code}/active:
 *   get:
 *     summary: Get active account by code
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active account fetched successfully
 *       404:
 *         description: Active account not found
 */
router.get(
    "/code/:code/active",
    getActiveAccountByCode
);


// ======================================================
// Get Account by ID
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/{id}:
 *   get:
 *     summary: Get account by ID
 *     tags:
 *       - Accounts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Account fetched successfully
 *       404:
 *         description: Account not found
 */
router.get(
    "/:id",
    getAccountById
);


// ======================================================
// Create Account
// ======================================================

/**
 * @swagger
 * /api/finance/accounts:
 *   post:
 *     summary: Create account
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccount'
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Parent account not found
 *       409:
 *         description: Account code already exists
 */
router.post(
    "/",
    createAccount
);


// ======================================================
// Update Account
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/{id}:
 *   put:
 *     summary: Update account
 *     tags:
 *       - Accounts
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
 *             $ref: '#/components/schemas/UpdateAccount'
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Account not found
 *       409:
 *         description: Account code already exists
 */
router.put(
    "/:id",
    updateAccount
);


// ======================================================
// Delete Account
// ======================================================

/**
 * @swagger
 * /api/finance/accounts/{id}:
 *   delete:
 *     summary: Delete account
 *     tags:
 *       - Accounts
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
 *         description: Account deleted successfully
 *       404:
 *         description: Account not found
 *       409:
 *         description: Account has child accounts
 */
router.delete(
    "/:id",
    deleteAccount
);


// ======================================================
// Export
// ======================================================

module.exports = router;