const express =
    require("express");

const router =
    express.Router();

const chargeController =
    require("../controllers/charge.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


// ======================================================
// Charge Routes
// ======================================================


// ======================================================
// Get All Charges
// ======================================================

/**
 * @swagger
 * /api/charges:
 *   get:
 *     tags:
 *       - Charges
 *     summary: Get all charges
 *     description: |
 *       Returns all charges accessible to the authenticated
 *       ADMIN or MANAGER user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 charges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Charge'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 */

router.get(

    "/",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.getCharges

);


// ======================================================
// Create Charge
// ======================================================

/**
 * @swagger
 * /api/charges:
 *   post:
 *     tags:
 *       - Charges
 *     summary: Create a charge
 *     description: |
 *       Creates a new charge for a unit account and, atomically
 *       with the charge creation, creates and posts its accounting
 *       journal entry.
 *
 *       Accounting treatment:
 *       - Debit: 1201 - مطالبات شارژ
 *       - Credit: 4100 - درآمد شارژ
 *
 *       The charge and journal entry are created inside the same
 *       database transaction. If either operation fails, the
 *       transaction is rolled back.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChargeRequest'
 *           example:
 *             unitAccountId: "617c1b21-dc09-4894-a437-3b66ab9501fa"
 *             fiscalPeriodId: "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2"
 *             type: "MONTHLY"
 *             periodYear: 1405
 *             periodMonth: 8
 *             amount: 1100000
 *             description: "شارژ ماهانه مرداد ۱۴۰۵"
 *             issueDate: "2026-09-11T10:03:31.079Z"
 *     responses:
 *       201:
 *         description: Charge and accounting journal entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateChargeResponse'
 *             example:
 *               success: true
 *               message: "Charge created successfully"
 *               charge:
 *                 id: "9c2fef69-2040-4118-a17f-f7a0f463dd92"
 *                 unitAccountId: "617c1b21-dc09-4894-a437-3b66ab9501fa"
 *                 fiscalPeriodId: "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2"
 *                 type: "MONTHLY"
 *                 periodYear: 1405
 *                 periodMonth: 8
 *                 amount: 1100000
 *                 description: "تست نهایی پاسخ API صدور شارژ"
 *                 status: "ISSUED"
 *               journalEntry:
 *                 id: "858de62e-60f0-4c82-b06d-9e04d27070fa"
 *                 entryNumber: "JV-CHARGE-9c2fef69-2040-4118-a17f-f7a0f463dd92"
 *                 status: "POSTED"
 *                 fiscalPeriodId: "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2"
 *                 fundId: null
 *                 lines:
 *                   - accountId: "2d5c5e91-28e8-41fe-84ca-01e2419d8945"
 *                     debit: 1100000
 *                     credit: 0
 *                   - accountId: "22ce47fe-10e6-445b-915b-874cb940b2f4"
 *                     debit: 0
 *                     credit: 1100000
 *       400:
 *         description: Invalid request or related record
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       409:
 *         description: Transaction conflict
 */

router.post(

    "/",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.createCharge

);


// ======================================================
// Get Charges By Unit Account
// IMPORTANT: must be before /:id
// ======================================================

/**
 * @swagger
 * /api/charges/unit-account/{unitAccountId}:
 *   get:
 *     tags:
 *       - Charges
 *     summary: Get charges by unit account
 *     description: Returns all charges belonging to a specific unit account.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitAccountId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unit account UUID
 *     responses:
 *       200:
 *         description: Charges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 charges:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Charge'
 *       400:
 *         description: Invalid unit account ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Unit account not found
 */

router.get(

    "/unit-account/:unitAccountId",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.getChargesByUnitAccount

);


// ======================================================
// Get Charge By ID
// ======================================================

/**
 * @swagger
 * /api/charges/{id}:
 *   get:
 *     tags:
 *       - Charges
 *     summary: Get charge by ID
 *     description: Returns a single charge by UUID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Charge UUID
 *     responses:
 *       200:
 *         description: Charge retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 charge:
 *                   $ref: '#/components/schemas/Charge'
 *       400:
 *         description: Invalid charge ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Charge not found
 */

router.get(

    "/:id",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.getChargeById

);


// ======================================================
// Update Charge
// ======================================================

/**
 * @swagger
 * /api/charges/{id}:
 *   put:
 *     tags:
 *       - Charges
 *     summary: Update a charge
 *     description: Updates an existing charge.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Charge UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum:
 *                   - MONTHLY
 *                   - ANNUAL
 *                   - SPECIAL
 *                   - UTILITY
 *                   - OTHER
 *               periodYear:
 *                 type: integer
 *                 example: 1405
 *               periodMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 12
 *                 nullable: true
 *                 example: 8
 *               amount:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *                 example: 1100000
 *               description:
 *                 type: string
 *                 example: "شارژ اصلاح‌شده"
 *               issueDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Charge updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Charge updated successfully"
 *                 charge:
 *                   $ref: '#/components/schemas/Charge'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Charge not found
 *       409:
 *         description: Charge cannot be modified
 */

router.put(

    "/:id",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.updateCharge

);


// ======================================================
// Cancel Charge
// ======================================================

/**
 * @swagger
 * /api/charges/{id}/cancel:
 *   patch:
 *     tags:
 *       - Charges
 *     summary: Cancel a charge
 *     description: Cancels an unpaid charge.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Charge UUID
 *     responses:
 *       200:
 *         description: Charge cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Charge cancelled successfully"
 *                 charge:
 *                   $ref: '#/components/schemas/Charge'
 *       400:
 *         description: Invalid charge ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Charge not found
 *       409:
 *         description: Paid or partially paid charge cannot be cancelled
 */

router.patch(

    "/:id/cancel",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.cancelCharge

);


// ======================================================
// Delete Charge
// ======================================================

/**
 * @swagger
 * /api/charges/{id}:
 *   delete:
 *     tags:
 *       - Charges
 *     summary: Delete a charge
 *     description: Deletes an eligible charge without payments.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Charge UUID
 *     responses:
 *       200:
 *         description: Charge deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Charge deleted successfully"
 *       400:
 *         description: Invalid charge ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Charge not found
 *       409:
 *         description: Charge with payments or paid status cannot be deleted
 */

router.delete(

    "/:id",

    authMiddleware,

    authorize(
        "ADMIN",
        "MANAGER"
    ),

    chargeController.deleteCharge

);


module.exports =
    router;