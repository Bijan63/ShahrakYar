const express = require("express");

const router = express.Router();

const ownershipController = require("../controllers/ownership.controller");

/**
 * @swagger
 * tags:
 *   name: Ownerships
 *   description: Property ownership management
 */

/**
 * @swagger
 * /api/ownerships:
 *   post:
 *     summary: Create ownership
 *     tags: [Ownerships]
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
 *             properties:
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 example: 810faaa4-e7c9-4a91-9fc3-eeb21ff197d0
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *               percentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-08-08T11:30:31.270Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *     responses:
 *       201:
 *         description: Ownership created successfully
 *       400:
 *         description: Invalid ownership data
 *       404:
 *         description: Property or person not found
 *       409:
 *         description: Person already has an active ownership
 */
router.post(
    "/",
    ownershipController.createOwnership
);

/**
 * @swagger
 * /api/ownerships:
 *   get:
 *     summary: Get all ownerships
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ownerships fetched successfully
 */
router.get(
    "/",
    ownershipController.getOwnerships
);

/**
 * @swagger
 * /api/ownerships/{id}:
 *   get:
 *     summary: Get ownership by ID
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 0317fa20-c69c-4c4a-81ed-b87d59f66cea
 *     responses:
 *       200:
 *         description: Ownership fetched successfully
 *       404:
 *         description: Ownership not found
 */
router.get(
    "/:id",
    ownershipController.getOwnershipById
);

/**
 * @swagger
 * /api/ownerships/{id}:
 *   put:
 *     summary: Update ownership
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 0317fa20-c69c-4c4a-81ed-b87d59f66cea
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
 *                 example: 810faaa4-e7c9-4a91-9fc3-eeb21ff197d0
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *               percentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 80
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-08-08T11:30:31.270Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: null
 *     responses:
 *       200:
 *         description: Ownership updated successfully
 *       400:
 *         description: Invalid ownership data or total ownership exceeds 100 percent
 *       404:
 *         description: Ownership, property, or person not found
 */
router.put(
    "/:id",
    ownershipController.updateOwnership
);

/**
 * @swagger
 * /api/ownerships/{id}:
 *   delete:
 *     summary: Delete ownership
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 0317fa20-c69c-4c4a-81ed-b87d59f66cea
 *     responses:
 *       200:
 *         description: Ownership deleted successfully
 *       404:
 *         description: Ownership not found
 */
router.delete(
    "/:id",
    ownershipController.deleteOwnership
);

module.exports = router;