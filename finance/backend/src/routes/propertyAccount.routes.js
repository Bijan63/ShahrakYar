const express = require("express");

const {
    getPropertyAccounts,
    getPropertyAccountById,
    getPropertyAccountByPropertyId,
    createPropertyAccount,
    updatePropertyAccount,
    deletePropertyAccount
} = require("../controllers/propertyAccount.controller");


const router = express.Router();


// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     PropertyAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         accountNumber:
 *           type: string
 *           example: PROP-VILLA-002
 *         propertyId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: حساب مالی ویلای شماره ۲
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fundId:
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
 *     CreatePropertyAccount:
 *       type: object
 *       required:
 *         - accountNumber
 *         - propertyId
 *         - name
 *       properties:
 *         accountNumber:
 *           type: string
 *           example: PROP-VILLA-002
 *         propertyId:
 *           type: string
 *           format: uuid
 *           example: a49850c8-42f1-4cfd-8006-23de8678e0b2
 *         name:
 *           type: string
 *           example: حساب مالی ویلای شماره ۲
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *
 *
 *     UpdatePropertyAccount:
 *       type: object
 *       properties:
 *         accountNumber:
 *           type: string
 *         name:
 *           type: string
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 */


// ======================================================
// Property Accounts
// ======================================================


/**
 * @swagger
 * /api/finance/property-accounts:
 *   get:
 *     summary: Get all property accounts
 *     tags:
 *       - Property Accounts
 *     responses:
 *       200:
 *         description: Property accounts fetched successfully
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
 *                     $ref: '#/components/schemas/PropertyAccount'
 */
router.get(
    "/",
    getPropertyAccounts
);


/**
 * @swagger
 * /api/finance/property-accounts/property/{propertyId}:
 *   get:
 *     summary: Get property account by property ID
 *     tags:
 *       - Property Accounts
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property account fetched successfully
 *       404:
 *         description: Property account not found
 */
router.get(
    "/property/:propertyId",
    getPropertyAccountByPropertyId
);

/**
 * @swagger
 * /api/finance/property-accounts/{id}:
 *   get:
 *     summary: Get property account by ID
 *     tags:
 *       - Property Accounts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property account fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyAccount'
 *       404:
 *         description: Property account not found
 */
router.get(
    "/:id",
    getPropertyAccountById
);

/**
 * @swagger
 * /api/finance/property-accounts:
 *   post:
 *     summary: Create property account
 *     tags:
 *       - Property Accounts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePropertyAccount'
 *     responses:
 *       201:
 *         description: Property account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyAccount'
 *       409:
 *         description: Property already has a finance account
 */
router.post(
    "/",
    createPropertyAccount
);


/**
 * @swagger
 * /api/finance/property-accounts/{id}:
 *   put:
 *     summary: Update property account
 *     tags:
 *       - Property Accounts
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
 *             $ref: '#/components/schemas/UpdatePropertyAccount'
 *     responses:
 *       200:
 *         description: Property account updated successfully
 *       404:
 *         description: Property account not found
 */
router.put(
    "/:id",
    updatePropertyAccount
);


/**
 * @swagger
 * /api/finance/property-accounts/{id}:
 *   delete:
 *     summary: Delete property account
 *     tags:
 *       - Property Accounts
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
 *         description: Property account deleted successfully
 *       404:
 *         description: Property account not found
 */
router.delete(
    "/:id",
    deletePropertyAccount
);


module.exports = router;