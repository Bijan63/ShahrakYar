const express = require("express");

const router = express.Router();

const {
    createBuilding,
    getBuildings,
    getBuildingById
} = require("../controllers/building.controller");

const verifyToken = require("../middleware/auth.middleware");

/**
 * @swagger
 * tags:
 *   - name: Buildings
 *     description: Building Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Building:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Building A
 *         address:
 *           type: string
 *           example: Tehran, Sample Street
 *         floors:
 *           type: integer
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateBuilding:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - floors
 *       properties:
 *         name:
 *           type: string
 *           example: Building A
 *         address:
 *           type: string
 *           example: Tehran, Sample Street
 *         floors:
 *           type: integer
 *           example: 5
 */

/**
 * @swagger
 * /api/buildings:
 *   post:
 *     summary: Create a new building
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBuilding'
 *     responses:
 *       201:
 *         description: Building created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/", verifyToken, createBuilding);

/**
 * @swagger
 * /api/buildings:
 *   get:
 *     summary: Get all buildings
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of buildings
 *       401:
 *         description: Unauthorized
 */
router.get("/", verifyToken, getBuildings);

/**
 * @swagger
 * /api/buildings/{id}:
 *   get:
 *     summary: Get building by ID
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Building details
 *       404:
 *         description: Building not found
 *       401:
 *         description: Unauthorized
 */
router.get("/:id", verifyToken, getBuildingById);

module.exports = router;