const express = require("express");

const router = express.Router();

const propertyController =
    require("../controllers/property.controller");

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management
 */


/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - propertyType
 *               - complexId
 *             properties:
 *               code:
 *                 type: string
 *                 example: VILLA-002
 *               propertyType:
 *                 type: string
 *                 enum:
 *                   - LAND
 *                   - VILLA
 *                   - APARTMENT
 *                   - COMMERCIAL
 *                 example: VILLA
 *               status:
 *                 type: string
 *                 enum:
 *                   - VACANT
 *                   - BUILT
 *                   - UNDER_CONSTRUCTION
 *                   - INACTIVE
 *                 example: BUILT
 *               landArea:
 *                 type: number
 *                 example: 500
 *               builtArea:
 *                 type: number
 *                 example: 200
 *               description:
 *                 type: string
 *                 example: ویلای شماره ۲
 *               registryNumber:
 *                 type: string
 *                 nullable: true
 *                 example: "12345"
 *               complexId:
 *                 type: string
 *                 format: uuid
 *                 example: d9964424-e8c2-41fe-ba81-218aa9cd80f4
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.createProperty
);


/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get accessible properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.getProperties
);


/**
 * @swagger
 * /api/properties/search:
 *   get:
 *     summary: Search accessible properties
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: VILLA-001
 *     responses:
 *       200:
 *         description: Properties searched successfully
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/search",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.searchProperties
);


/**
 * @swagger
 * /api/properties/detail/{id}:
 *   get:
 *     summary: Get property full detail
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     responses:
 *       200:
 *         description: Property detail fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.get(
    "/detail/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.getPropertyDetail
);


/**
 * @swagger
 * /api/properties/{id}/owners:
 *   get:
 *     summary: Get property owners
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     responses:
 *       200:
 *         description: Property owners fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.get(
    "/:id/owners",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.getPropertyOwners
);


/**
 * @swagger
 * /api/properties/{id}/residents:
 *   get:
 *     summary: Get property residents
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     responses:
 *       200:
 *         description: Property residents fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.get(
    "/:id/residents",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.getPropertyResidents
);


/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     responses:
 *       200:
 *         description: Property fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.get(
    "/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.getPropertyById
);


/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: VILLA-001
 *               propertyType:
 *                 type: string
 *                 enum:
 *                   - LAND
 *                   - VILLA
 *                   - APARTMENT
 *                   - COMMERCIAL
 *               status:
 *                 type: string
 *                 enum:
 *                   - VACANT
 *                   - BUILT
 *                   - UNDER_CONSTRUCTION
 *                   - INACTIVE
 *               landArea:
 *                 type: number
 *                 example: 500
 *               builtArea:
 *                 type: number
 *                 example: 200
 *               description:
 *                 type: string
 *               registryNumber:
 *                 type: string
 *                 nullable: true
 *               complexId:
 *                 type: string
 *                 format: uuid
 *                 description: Target Complex UUID
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.put(
    "/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.updateProperty
);


/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property UUID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    propertyController.deleteProperty
);


module.exports = router;