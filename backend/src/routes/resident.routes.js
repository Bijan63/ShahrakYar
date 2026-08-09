
const express = require("express");

const router = express.Router();

const residentController = require("../controllers/resident.controller");

const verifyToken = require("../middleware/auth.middleware");

// ======================================================
// RESIDENT ROUTES
// ======================================================

/**
 * @swagger
 * tags:
 *   name: Residents
 *   description: Resident Management
 */

// ======================================================
// Create Resident
// ======================================================

/**
 * @swagger
 * /api/residents:
 *   post:
 *     summary: Create resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    "/",
    verifyToken,
    residentController.createResident
);

// ======================================================
// Get All Residents
// ======================================================

/**
 * @swagger
 * /api/residents:
 *   get:
 *     summary: Get all residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/",
    verifyToken,
    residentController.getResidents
);

// ======================================================
// Search Residents
// ======================================================

/**
 * @swagger
 * /api/residents/search:
 *   get:
 *     summary: Search residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/search",
    verifyToken,
    residentController.searchResidents
);

// ======================================================
// Get Resident By ID
// ======================================================

/**
 * @swagger
 * /api/residents/{id}:
 *   get:
 *     summary: Get resident by id
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/:id",
    verifyToken,
    residentController.getResident
);

// ======================================================
// Update Resident
// ======================================================

/**
 * @swagger
 * /api/residents/{id}:
 *   put:
 *     summary: Update resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.put(
    "/:id",
    verifyToken,
    residentController.updateResident
);

// ======================================================
// Delete Resident
// ======================================================

/**
 * @swagger
 * /api/residents/{id}:
 *   delete:
 *     summary: Delete resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    "/:id",
    verifyToken,
    residentController.deleteResident
);
/**
 * @swagger
 * /api/residents/{id}:
 * patch:
 *   summary: Update resident
 *   tags: [Residents]
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *   requestBody:
 *     required: true
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             mobile:
 *               type: string
 *             residentType:
 *               type: string
 *             userId:
 *               type: string
 *               format: uuid
 *             unitId:
 *               type: string
 *               format: uuid
 *             personId:
 *               type: string
 *               format: uuid
 *   responses:
 *     200:
 *       description: Resident updated successfully
 */

router.patch(
    "/:id",
    verifyToken,
    residentController.updateResident
);

module.exports = router;