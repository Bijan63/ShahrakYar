const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

const {
    createResident,
    getResident,
    getResidents,
    searchResidents,
    updateResident,
    deleteResident
} = require("../controllers/resident.controller");

/**
 * @swagger
 * tags:
 *   name: Residents
 *   description: Resident Management APIs
 */

/**
 * @swagger
 * /api/residents:
 *   get:
 *     summary: Get all residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Residents list
 */
router.get("/", verifyToken, getResidents);

/**
 * @swagger
 * /api/residents/search:
 *   get:
 *     summary: Search residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or mobile
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search result
 */
router.get("/search", verifyToken, searchResidents);

/**
 * @swagger
 * /api/residents/{id}:
 *   get:
 *     summary: Get resident by id
 *     tags: [Residents]
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
 *         description: Resident details
 */
router.get("/:id", verifyToken, getResident);

/**
 * @swagger
 * /api/residents:
 *   post:
 *     summary: Create resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - mobile
 *               - residentType
 *               - userId
 *               - unitId
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Ali Hoss
 *               mobile:
 *                 type: string
 *                 example: "09121234567"
 *               residentType:
 *                 type: string
 *                 enum:
 *                   - OWNER
 *                   - TENANT
 *                 example: OWNER
 *               userId:
 *                 type: integer
 *                 example: 2
 *               unitId:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       201:
 *         description: Resident created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Resident already exists
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    createResident
);

/**
 * @swagger
 * /api/residents/{id}:
 *   patch:
 *     summary: Update resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               mobile:
 *                 type: string
 *               residentType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resident updated successfully
 */
router.patch(
    "/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    updateResident
);

/**
 * @swagger
 * /api/residents/{id}:
 *   delete:
 *     summary: Delete resident
 *     tags: [Residents]
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
 *         description: Resident deleted successfully
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    deleteResident
);

module.exports = router;
