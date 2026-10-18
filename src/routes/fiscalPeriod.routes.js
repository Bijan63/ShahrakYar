const express = require("express");

const {
    getFiscalPeriods,
    getFiscalPeriodById,
    getFiscalPeriodByCode,
    createFiscalPeriod,
    updateFiscalPeriod,
    deleteFiscalPeriod
} = require("../controllers/fiscalPeriod.controller");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Fiscal Periods
 *     description: Fiscal period management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FiscalPeriod:
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
 *           example: "دوره مالی سال 1405"
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
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
 */

/**
 * @swagger
 * /api/finance/fiscal-periods:
 *   get:
 *     summary: Get all fiscal periods
 *     tags:
 *       - Fiscal Periods
 *     responses:
 *       200:
 *         description: Fiscal periods fetched successfully
 *       404:
 *         description: Fiscal periods not found
 *       500:
 *         description: Internal server error
 */
router.get("/", getFiscalPeriods);

/**
 * @swagger
 * /api/finance/fiscal-periods/code/{code}:
 *   get:
 *     summary: Get fiscal period by code
 *     tags:
 *       - Fiscal Periods
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         example: "1405"
 *     responses:
 *       200:
 *         description: Fiscal period fetched successfully
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get("/code/:code", getFiscalPeriodByCode);

/**
 * @swagger
 * /api/finance/fiscal-periods/{id}:
 *   get:
 *     summary: Get fiscal period by ID
 *     tags:
 *       - Fiscal Periods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fiscal period fetched successfully
 *       404:
 *         description: Fiscal period not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", getFiscalPeriodById);

/**
 * @swagger
 * /api/finance/fiscal-periods:
 *   post:
 *     summary: Create fiscal period
 *     tags:
 *       - Fiscal Periods
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: "1406"
 *               name:
 *                 type: string
 *                 example: "دوره مالی سال 1406"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2027-04-01T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2028-03-31T23:59:59.999Z"
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - INACTIVE
 *                 default: ACTIVE
 *     responses:
 *       201:
 *         description: Fiscal period created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Fiscal period conflict
 *       500:
 *         description: Internal server error
 */
router.post("/", createFiscalPeriod);

/**
 * @swagger
 * /api/finance/fiscal-periods/{id}:
 *   put:
 *     summary: Update fiscal period
 *     tags:
 *       - Fiscal Periods
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
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "1405"
 *               name:
 *                 type: string
 *                 example: "دوره مالی سال 1405 - اصلاح شده"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - INACTIVE
 *     responses:
 *       200:
 *         description: Fiscal period updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Fiscal period not found
 *       409:
 *         description: Fiscal period conflict
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateFiscalPeriod);

/**
 * @swagger
 * /api/finance/fiscal-periods/{id}:
 *   delete:
 *     summary: Delete fiscal period
 *     tags:
 *       - Fiscal Periods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fiscal period deleted successfully
 *       404:
 *         description: Fiscal period not found
 *       409:
 *         description: Fiscal period cannot be deleted because it is in use
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteFiscalPeriod);

module.exports = router;