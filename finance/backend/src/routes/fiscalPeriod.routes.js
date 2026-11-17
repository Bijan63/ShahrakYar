
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
 *     description: Fiscal period management using the Jalali calendar
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
 *           description: Fiscal period start boundary stored as an ISO date-time.
 *           example: "2026-03-20T20:30:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Inclusive fiscal period end boundary stored as an ISO date-time.
 *           example: "2027-03-20T20:29:59.999Z"
 *         startDateJalali:
 *           type: string
 *           description: Start date in the Jalali calendar and Asia/Tehran timezone.
 *           example: "1405/01/01"
 *         endDateJalali:
 *           type: string
 *           description: End date in the Jalali calendar and Asia/Tehran timezone.
 *           example: "1405/12/29"
 *         calendar:
 *           type: string
 *           enum:
 *             - JALALI
 *           example: JALALI
 *         timeZone:
 *           type: string
 *           example: Asia/Tehran
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
 *     FiscalPeriodListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FiscalPeriod'
 *
 *     FiscalPeriodResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/FiscalPeriod'
 *
 *     FiscalPeriodDeleteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Fiscal period deleted successfully
 *
 *     FiscalPeriodError:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Fiscal period not found
 *
 *     FiscalPeriodInput:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *           description: >
 *             A four-digit Jalali year such as 1405 automatically determines
 *             the fiscal period boundaries. Other custom codes require
 *             explicit startDate and endDate values.
 *           example: "1405"
 *         name:
 *           type: string
 *           example: "دوره مالی سال 1405"
 *         startDate:
 *           type: string
 *           description: >
 *             Optional for a four-digit Jalali year code. If supplied for
 *             a Jalali year, it must match that year's first day.
 *             Required for custom fiscal period codes.
 *             Accepted formats are Jalali YYYY/MM/DD, Gregorian YYYY-MM-DD,
 *             or an ISO timestamp with Z or an explicit UTC offset.
 *           example: "1405/01/01"
 *         endDate:
 *           type: string
 *           description: >
 *             Optional for a four-digit Jalali year code. If supplied for
 *             a Jalali year, it must match that year's final day.
 *             Required for custom fiscal period codes.
 *             Accepted formats are Jalali YYYY/MM/DD, Gregorian YYYY-MM-DD,
 *             or an ISO timestamp with Z or an explicit UTC offset.
 *           example: "1405/12/29"
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *           default: ACTIVE
 *
 *     FiscalPeriodUpdateInput:
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: >
 *             Changing the code to a four-digit Jalali year recalculates
 *             the fiscal period boundaries automatically.
 *           example: "1406"
 *         name:
 *           type: string
 *           example: "دوره مالی سال 1405 - اصلاح شده"
 *         startDate:
 *           type: string
 *           description: >
 *             Optional date boundary. For a four-digit Jalali year code,
 *             the supplied value must match the corresponding year boundary.
 *             For custom codes, the supplied value is normalized according
 *             to the supported date formats.
 *         endDate:
 *           type: string
 *           description: >
 *             Optional date boundary. For a four-digit Jalali year code,
 *             the supplied value must match the corresponding year boundary.
 *             For custom codes, the supplied value is normalized according
 *             to the supported date formats.
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 */

/**
 * @swagger
 * /api/finance/fiscal-periods:
 *   get:
 *     summary: Get all fiscal periods
 *     description: Returns all fiscal periods with Gregorian and Jalali date representations.
 *     tags:
 *       - Fiscal Periods
 *     responses:
 *       200:
 *         description: Fiscal periods fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodListResponse'
 *       401:
 *         description: Access token is missing, invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodError'
 *       403:
 *         description: Administrator access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodError'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
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
 *     description: >
 *       For four-digit Jalali year codes, startDate and endDate are generated
 *       automatically. For custom codes, both date boundaries are required.
 *       Only one fiscal period can be ACTIVE at a time.
 *     tags:
 *       - Fiscal Periods
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FiscalPeriodInput'
 *           examples:
 *             jalaliYear:
 *               summary: Create a Jalali fiscal year
 *               value:
 *                 code: "1406"
 *                 name: "دوره مالی سال 1406"
 *                 status: INACTIVE
 *             customPeriod:
 *               summary: Create a custom fiscal period
 *               value:
 *                 code: "FY-CUSTOM-01"
 *                 name: "دوره مالی سفارشی"
 *                 startDate: "1405/01/01"
 *                 endDate: "1405/12/29"
 *                 status: INACTIVE
 *     responses:
 *       201:
 *         description: Fiscal period created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodResponse'
 *       400:
 *         description: Invalid request, date boundary or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       409:
 *         description: Duplicate code or another active fiscal period exists
 *       500:
 *         description: Internal server error
 */
router.post("/", createFiscalPeriod);

/**
 * @swagger
 * /api/finance/fiscal-periods/{id}:
 *   put:
 *     summary: Update fiscal period
 *     description: >
 *       All request body properties are optional. Changing dates is prohibited
 *       when the fiscal period has financial history. A four-digit Jalali
 *       year code determines the corresponding fiscal period boundaries.
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
 *             $ref: '#/components/schemas/FiscalPeriodUpdateInput'
 *     responses:
 *       200:
 *         description: Fiscal period updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodResponse'
 *       400:
 *         description: Invalid request, date boundary or status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: Fiscal period not found
 *       409:
 *         description: Duplicate code or another active fiscal period exists
 *       500:
 *         description: Internal server error
 */
router.put("/:id", updateFiscalPeriod);

/**
 * @swagger
 * /api/finance/fiscal-periods/{id}:
 *   delete:
 *     summary: Delete fiscal period
 *     description: >
 *       A fiscal period cannot be deleted while it has financial dependencies,
 *       including accounts, funds, journal entries, opening balances,
 *       property accounts or charge payments.
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FiscalPeriodDeleteResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Administrator access required
 *       404:
 *         description: Fiscal period not found
 *       409:
 *         description: Fiscal period has financial dependencies
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteFiscalPeriod);

module.exports = router;
