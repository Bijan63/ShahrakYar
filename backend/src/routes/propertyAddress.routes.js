const express = require("express");

const router = express.Router();

const propertyAddressController =
    require("../controllers/propertyAddress.controller");

const verifyToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Property Addresses
 *   description: Property address management
 */


/**
 * @swagger
 * /api/property-addresses:
 *   post:
 *     summary: Create property address
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *             properties:
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 example: "0c09f529-3ca9-4b00-88a0-cb8cbfd4c612"
 *               mainStreet:
 *                 type: string
 *                 example: "بلوار اصلی شهرک"
 *               subStreet:
 *                 type: string
 *                 example: "خیابان دوم"
 *               alley:
 *                 type: string
 *                 example: "کوچه ۳"
 *               number:
 *                 type: string
 *                 example: "۱۲"
 *               description:
 *                 type: string
 *                 example: "آدرس اصلی ویلا"
 *     responses:
 *       201:
 *         description: Property address created successfully
 *       400:
 *         description: Invalid address data
 *       404:
 *         description: Property not found
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.createPropertyAddress
);


/**
 * @swagger
 * /api/property-addresses:
 *   get:
 *     summary: Get all property addresses
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Property addresses fetched successfully
 */
router.get(
    "/",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.getPropertyAddresses
);


/**
 * @swagger
 * /api/property-addresses/property/{propertyId}:
 *   get:
 *     summary: Get addresses by property
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "0c09f529-3ca9-4b00-88a0-cb8cbfd4c612"
 *     responses:
 *       200:
 *         description: Property addresses fetched successfully
 *       404:
 *         description: Property not found
 */
router.get(
    "/property/:propertyId",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.getAddressesByProperty
);


/**
 * @swagger
 * /api/property-addresses/{id}:
 *   get:
 *     summary: Get property address by ID
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "00000000-0000-0000-0000-000000000000"
 *     responses:
 *       200:
 *         description: Property address fetched successfully
 *       404:
 *         description: Property address not found
 */
router.get(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.getPropertyAddressById
);


/**
 * @swagger
 * /api/property-addresses/{id}:
 *   put:
 *     summary: Update property address
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "00000000-0000-0000-0000-000000000000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               mainStreet:
 *                 type: string
 *               subStreet:
 *                 type: string
 *               alley:
 *                 type: string
 *               number:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property address updated successfully
 *       400:
 *         description: Invalid address data
 *       404:
 *         description: Property address or property not found
 */
router.put(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.updatePropertyAddress
);


/**
 * @swagger
 * /api/property-addresses/{id}:
 *   delete:
 *     summary: Delete property address
 *     tags: [Property Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "00000000-0000-0000-0000-000000000000"
 *     responses:
 *       200:
 *         description: Property address deleted successfully
 *       404:
 *         description: Property address not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    propertyAddressController.deletePropertyAddress
);


module.exports = router;