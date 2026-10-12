const express = require("express");

const router = express.Router();

const residencyController =
    require("../controllers/residency.controller");

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Residencies
 *   description: Property residency management
 */


/**
 * All residency endpoints require authentication
 * and ADMIN or MANAGER role.
 */
router.use(
    verifyToken,
    authorize("ADMIN", "MANAGER")
);


/**
 * @swagger
 * /api/residencies:
 *   post:
 *     summary: Create residency
 *     tags: [Residencies]
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
 *               - personId
 *               - type
 *             properties:
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               personId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [OWNER, TENANT, FAMILY]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Residency created
 *       400:
 *         description: Invalid residency data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property or person not found
 *       409:
 *         description: Residency conflict
 */
router.post(
    "/",
    residencyController.createResidency
);


/**
 * @swagger
 * /api/residencies:
 *   get:
 *     summary: Get accessible residencies
 *     tags: [Residencies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Residencies fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    residencyController.getResidencies
);


/**
 * @swagger
 * /api/residencies/property/{propertyId}/residents:
 *   get:
 *     summary: Get residents by property
 *     tags: [Residencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property residents fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found or inaccessible
 */
router.get(
    "/property/:propertyId/residents",
    residencyController.getResidentsByProperty
);


/**
 * @swagger
 * /api/residencies/{id}:
 *   get:
 *     summary: Get residency by ID
 *     tags: [Residencies]
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
 *         description: Residency fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Residency not found
 */
router.get(
    "/:id",
    residencyController.getResidencyById
);


/**
 * @swagger
 * /api/residencies/{id}:
 *   put:
 *     summary: Update residency
 *     tags: [Residencies]
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
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               personId:
 *                 type: string
 *                 format: uuid
 *               type:
 *                 type: string
 *                 enum: [OWNER, TENANT, FAMILY]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Residency updated successfully
 *       400:
 *         description: Invalid residency data or date range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Residency, property, or person not found
 *       409:
 *         description: Residency conflict
 */
router.put(
    "/:id",
    residencyController.updateResidency
);


/**
 * @swagger
 * /api/residencies/{id}:
 *   delete:
 *     summary: Delete residency
 *     tags: [Residencies]
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
 *         description: Residency deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Residency not found
 */
router.delete(
    "/:id",
    residencyController.deleteResidency
);


module.exports = router;
