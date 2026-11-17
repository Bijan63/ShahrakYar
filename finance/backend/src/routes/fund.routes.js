const express = require("express");

const {
    getFunds,
    getFundById,
    getFundByCode,
    createFund,
    updateFund,
    deleteFund
} = require("../controllers/fund.controller");


const router = express.Router();


// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Fund:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         code:
 *           type: string
 *           example: OPERATING-1405
 *         name:
 *           type: string
 *           example: صندوق هزینه‌های جاری
 *         type:
 *           type: string
 *           enum:
 *             - OPERATING
 *             - CAPITAL
 *         description:
 *           type: string
 *           nullable: true
 *           example: هزینه‌های جاری شهرک
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
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
 *     CreateFund:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - type
 *       properties:
 *         code:
 *           type: string
 *           example: OPERATING-1405
 *         name:
 *           type: string
 *           example: صندوق هزینه‌های جاری
 *         type:
 *           type: string
 *           enum:
 *             - OPERATING
 *             - CAPITAL
 *         description:
 *           type: string
 *           nullable: true
 *           example: هزینه‌های جاری شهرک
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *
 *     UpdateFund:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum:
 *             - OPERATING
 *             - CAPITAL
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 */


// ======================================================
// Funds
// ======================================================


/**
 * @swagger
 * /api/finance/funds:
 *   get:
 *     summary: Get all funds
 *     tags:
 *       - Funds
 *     responses:
 *       200:
 *         description: Funds fetched successfully
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
 *                     $ref: '#/components/schemas/Fund'
 */
router.get(
    "/",
    getFunds
);


// ======================================================
// Get Fund by Code
// ======================================================


/**
 * @swagger
 * /api/finance/funds/code/{code}:
 *   get:
 *     summary: Get fund by code
 *     tags:
 *       - Funds
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fund fetched successfully
 *       404:
 *         description: Fund not found
 */
router.get(
    "/code/:code",
    getFundByCode
);


// ======================================================
// Get Fund by ID
// ======================================================


/**
 * @swagger
 * /api/finance/funds/{id}:
 *   get:
 *     summary: Get fund by ID
 *     tags:
 *       - Funds
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fund fetched successfully
 *       404:
 *         description: Fund not found
 */
router.get(
    "/:id",
    getFundById
);


// ======================================================
// Create Fund
// ======================================================


/**
 * @swagger
 * /api/finance/funds:
 *   post:
 *     summary: Create fund
 *     tags:
 *       - Funds
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFund'
 *     responses:
 *       201:
 *         description: Fund created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Fund code already exists
 */
router.post(
    "/",
    createFund
);


// ======================================================
// Update Fund
// ======================================================


/**
 * @swagger
 * /api/finance/funds/{id}:
 *   put:
 *     summary: Update fund
 *     tags:
 *       - Funds
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
 *             $ref: '#/components/schemas/UpdateFund'
 *     responses:
 *       200:
 *         description: Fund updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Fund not found
 *       409:
 *         description: Fund code already exists
 */
router.put(
    "/:id",
    updateFund
);


// ======================================================
// Delete Fund
// ======================================================


/**
 * @swagger
 * /api/finance/funds/{id}:
 *   delete:
 *     summary: Delete fund
 *     tags:
 *       - Funds
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
 *         description: Fund deleted successfully
 *       404:
 *         description: Fund not found
 */
router.delete(
    "/:id",
    deleteFund
);


// ======================================================
// Export
// ======================================================

module.exports = router;