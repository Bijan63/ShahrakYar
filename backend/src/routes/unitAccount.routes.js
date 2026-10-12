const express =
    require("express");


const router =
    express.Router();


const unitAccountController =
    require("../controllers/unitAccount.controller");


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
 *   name: Unit Accounts
 *   description: Financial accounts for residential units
 */


// ======================================================
// Get All Unit Accounts
// ======================================================

/**
 * @swagger
 * /api/unit-accounts:
 *   get:
 *     summary: Get accessible unit accounts
 *     tags: [Unit Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unit accounts fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.getUnitAccounts
);


// ======================================================
// Create Unit Account
// ======================================================

/**
 * @swagger
 * /api/unit-accounts:
 *   post:
 *     summary: Create financial account for a unit
 *     tags: [Unit Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitId
 *               - code
 *             properties:
 *               unitId:
 *                 type: string
 *                 format: uuid
 *                 example: "c123effb-1917-40c3-95d0-dd35da78e6d0"
 *               code:
 *                 type: string
 *                 example: "UNIT-101-ACCOUNT"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 example: "حساب مالی واحد ۱۰۱"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Unit account created successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit not found
 *       409:
 *         description: Unit account already exists
 */

router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.createUnitAccount
);


// ======================================================
// Get Unit Account By Unit ID
// ======================================================

/**
 * @swagger
 * /api/unit-accounts/unit/{unitId}:
 *   get:
 *     summary: Get financial account by unit ID
 *     tags: [Unit Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: unitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit account fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit account not found
 */

router.get(
    "/unit/:unitId",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.getUnitAccountByUnitId
);


// ======================================================
// Get Unit Account By ID
// ======================================================

/**
 * @swagger
 * /api/unit-accounts/{id}:
 *   get:
 *     summary: Get unit account by ID
 *     tags: [Unit Accounts]
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
 *         description: Unit account fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit account not found
 */

router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.getUnitAccountById
);


// ======================================================
// Update Unit Account
// ======================================================

/**
 * @swagger
 * /api/unit-accounts/{id}:
 *   put:
 *     summary: Update unit account
 *     tags: [Unit Accounts]
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
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "UNIT-101-ACCOUNT"
 *               title:
 *                 type: string
 *                 nullable: true
 *                 example: "حساب مالی واحد ۱۰۱"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Unit account updated successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit account not found
 *       409:
 *         description: Duplicate account code
 */

router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.updateUnitAccount
);


// ======================================================
// Delete Unit Account
// ======================================================

/**
 * @swagger
 * /api/unit-accounts/{id}:
 *   delete:
 *     summary: Delete unit account
 *     tags: [Unit Accounts]
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
 *         description: Unit account deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit account not found
 *       409:
 *         description: Account contains financial transactions
 */

router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitAccountController.deleteUnitAccount
);


// ======================================================
// Export
// ======================================================

module.exports = router;