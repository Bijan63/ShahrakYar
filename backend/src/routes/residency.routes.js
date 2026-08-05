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
 *                 type: integer
 *                 example: 1
 *               personId:
 *                 type: integer
 *                 example: 1
 *               type:
 *                 type: string
 *                 example: OWNER
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
 *           type: integer
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
 * /api/residencies/{id}:
 *   put:
 *     summary: Update residency
 *     tags: [Residencies]
 *     security:
 *       - bearerAuth: []
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
 *     security: [bearerAuth: []]
 */
router.delete(
    "/:id",
    residencyController.deleteResidency
);



module.exports = router;