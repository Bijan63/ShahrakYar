const express = require("express");

const router = express.Router();

const residentController =
    require("../controllers/resident.controller");

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Residents
 *   description: Resident Management
 */


/**
 * @swagger
 * /api/residents:
 *   get:
 *     summary: Get all residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *
 *     responses:
 *
 *       200:
 *         description: Residents fetched successfully
 *
 *       401:
 *         description: Unauthorized
 */

router.get(
    "/",
    verifyToken,
    residentController.getResidents
);


/**
 * @swagger
 * /api/residents/search:
 *   get:
 *     summary: Search residents
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by resident name or mobile
 *
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by unit
 *
 *       - in: query
 *         name: buildingId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by building
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum:
 *             - fullName
 *             - mobile
 *             - createdAt
 *           default: fullName
 *
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *           default: asc
 *
 *     responses:
 *
 *       200:
 *         description: Residents searched successfully
 *
 *       401:
 *         description: Unauthorized
 */

router.get(
    "/search",
    verifyToken,
    residentController.searchResidents
);


/**
 * @swagger
 * /api/residents/{id}:
 *   get:
 *     summary: Get resident by ID
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *
 *       200:
 *         description: Resident fetched successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       404:
 *         description: Resident not found
 */

router.get(
    "/:id",
    verifyToken,
    residentController.getResident
);


/**
 * @swagger
 * /api/residents:
 *   post:
 *     summary: Create resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - fullName
 *               - mobile
 *               - userId
 *               - unitId
 *
 *             properties:
 *
 *               fullName:
 *                 type: string
 *                 example: "رضا احمدی"
 *
 *               mobile:
 *                 type: string
 *                 example: "09129876543"
 *
 *               userId:
 *                 type: string
 *                 format: uuid
 *
 *               unitId:
 *                 type: string
 *                 format: uuid
 *
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *
 *     responses:
 *
 *       201:
 *         description: Resident created successfully
 *
 *       400:
 *         description: Invalid resident data
 *
 *       404:
 *         description: User, Person or Unit not found
 *
 *       409:
 *         description: Duplicate resident information
 */

router.post(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    residentController.createResident
);


/**
 * @swagger
 * /api/residents/{id}:
 *   patch:
 *     summary: Update resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *
 *               fullName:
 *                 type: string
 *                 example: "رضا احمدی"
 *
 *               mobile:
 *                 type: string
 *                 example: "09129876543"
 *
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *
 *               unitId:
 *                 type: string
 *                 format: uuid
 *
 *     responses:
 *
 *       200:
 *         description: Resident updated successfully
 *
 *       400:
 *         description: Invalid resident data
 *
 *       404:
 *         description: Resident, Person or Unit not found
 *
 *       409:
 *         description: Duplicate mobile or person
 */

router.patch(
    "/:id",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    residentController.updateResident
);


/**
 * @swagger
 * /api/residents/{id}:
 *   delete:
 *     summary: Delete resident
 *     tags: [Residents]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     responses:
 *
 *       200:
 *         description: Resident deleted successfully
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Resident not found
 */

router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    residentController.deleteResident
);


module.exports = router;