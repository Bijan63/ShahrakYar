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
 *                 type: integer
 *                 example: 1
 *               personId:
 *                 type: integer
 *                 example: 1
 *               percentage:
 *                 type: number
 *                 example: 100
 *     responses:
 *       201:
 *         description: Ownership created
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
 *         description: Ownership list
 */
router.get(
    "/",
    ownershipController.getOwnerships
);


module.exports = router;