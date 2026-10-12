const express = require("express");

const router = express.Router();

const chargePaymentController =
    require("../controllers/chargePayment.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


// ======================================================
// Swagger
// ======================================================

/**
 * @swagger
 * tags:
 *   name: Charge Payments
 *   description: Charge payment management
 */


// ======================================================
// Get All Payments
// ======================================================

/**
 * @swagger
 * /api/charge-payments:
 *   get:
 *     summary: Get all charge payments
 *     tags: [Charge Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charge payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChargePayment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    chargePaymentController.getPayments
);


// ======================================================
// Create Payment
// ======================================================

/**
 * @swagger
 * /api/charge-payments:
 *   post:
 *     summary: Create charge payment with accounting journal entry
 *     description: |
 *       Creates a charge payment and its accounting journal entry atomically.
 *
 *       Accounting treatment:
 *       - Debit: financial account's linked posting account
 *       - Credit: configured charge receivable account
 *
 *       For example, a payment through Bank Mellat creates:
 *       - Debit 1101 Bank Mellat
 *       - Credit 1201 Charge Receivables
 *
 *       The payment, journal entry, journal entry lines, and charge status
 *       are committed in a single database transaction.
 *     tags: [Charge Payments]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChargePaymentRequest'
 *           examples:
 *             bankPayment:
 *               summary: Bank Mellat charge payment
 *               value:
 *                 unitAccountId: "617c1b21-dc09-4894-a437-3b66ab9501fa"
 *                 chargeId: "9971da5a-416c-443f-bd60-8c087d6f1a80"
 *                 financialAccountId: "a35598b5-4625-4762-a8e5-d5008b577cb9"
 *                 amount: 3000000
 *                 paymentDate: "2026-09-11T08:30:45.167Z"
 *                 description: "پرداخت شارژ"
 *
 *     responses:
 *       201:
 *         description: Charge payment and accounting journal entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateChargePaymentResponse'
 *
 *       400:
 *         description: Invalid payment data, invalid fiscal period, invalid financial account, overpayment, or invalid accounting configuration
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Charge, unit account, resident, or financial account not found
 *
 *       409:
 *         description: Concurrent payment conflict
 */

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    chargePaymentController.createPayment
);


// ======================================================
// Get Payment By ID
// ======================================================

/**
 * @swagger
 * /api/charge-payments/{id}:
 *   get:
 *     summary: Get charge payment by ID
 *     tags: [Charge Payments]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Charge payment UUID
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *       200:
 *         description: Charge payment fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payment:
 *                   $ref: '#/components/schemas/ChargePayment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Charge payment not found
 */

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    chargePaymentController.getPaymentById
);


// ======================================================
// Get Payments By Charge
// ======================================================

/**
 * @swagger
 * /api/charge-payments/charge/{chargeId}:
 *   get:
 *     summary: Get payments for a charge
 *     tags: [Charge Payments]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: chargeId
 *         required: true
 *         description: Charge UUID
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *       200:
 *         description: Charge payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChargePayment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Charge not found
 */

router.get(
    "/charge/:chargeId",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    chargePaymentController.getPaymentsByCharge
);


// ======================================================
// Get Payments By Unit Account
// ======================================================

/**
 * @swagger
 * /api/charge-payments/unit-account/{unitAccountId}:
 *   get:
 *     summary: Get payments for a unit account
 *     tags: [Charge Payments]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: unitAccountId
 *         required: true
 *         description: Unit account UUID
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *       200:
 *         description: Unit account payments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChargePayment'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
    "/unit-account/:unitAccountId",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    chargePaymentController.getPaymentsByUnitAccount
);


// ======================================================
// Export
// ======================================================

module.exports = router;