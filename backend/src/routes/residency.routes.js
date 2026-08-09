const express = require("express");

const router = express.Router();

const residencyController = require("../controllers/residency.controller");

/**
 * @swagger
 * tags:
 *   name: Residencies
 *   description: Property residency management
 */

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
 *                 example: "810faaa4-e7c9-4a91-9fc3-eeb21ff197d0"
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 example: "069602eb-d987-418d-bb2f-9cf9f67d1adb"
 *               type:
 *                 type: string
 *                 enum:
 *                   - OWNER
 *                   - TENANT
 *                   - RESIDENT
 *                 example: OWNER
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
 */
router.post(
    "/",
    residencyController.createResidency
);

/**
 * @swagger
 * /api/residencies:
 *   get:
 *     summary: Get all residencies
 *     tags: [Residencies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Residency list
 */
router.get(
    "/",
    residencyController.getResidencies
);

/**
 * @swagger
 * /api/residencies/{id}:
 *   get:
 *     summary: Get residency by id
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
 *         description: Residency found
 */
router.get(
    "/:id",
    residencyController.getResidencyById
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
 *         description: Residents list
 */
router.get(
    "/property/:propertyId/residents",
    residencyController.getResidentsByProperty
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
 *               type:
 *                 type: string
 *                 enum:
 *                   - OWNER
 *                   - TENANT
 *                   - RESIDENT
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Residency updated
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
 *         description: Residency deleted
 */
router.delete(
    "/:id",
    residencyController.deleteResidency
);

module.exports = router;