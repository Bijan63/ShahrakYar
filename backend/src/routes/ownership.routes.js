const express = require("express");

const router = express.Router();

const ownershipController =
    require("../controllers/ownership.controller");

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Ownerships
 *   description: Property ownership management
 */


/**
 * All ownership endpoints require authentication
 * and ADMIN or MANAGER role.
 */
router.use(
    verifyToken,
    authorize("ADMIN", "MANAGER")
);


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
 *               personId:
 *                 type: string
 *                 format: uuid
 *               percentage:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 maximum: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Ownership created successfully
 *       400:
 *         description: Invalid ownership data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Property or person not found
 *       409:
 *         description: Ownership conflict
 */
router.post(
    "/",
    ownershipController.createOwnership
);


/**
 * @swagger
 * /api/ownerships:
 *   get:
 *     summary: Get accessible ownerships
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ownerships fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    ownershipController.getOwnerships
);


/**
 * @swagger
 * /api/ownerships/history:
 *   get:
 *     summary: Get ownership history by Jalali date range
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         example: 1405/05/01
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         example: 1405/05/31
 *     responses:
 *       200:
 *         description: Ownership history fetched successfully
 *       400:
 *         description: Invalid or missing date range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/history",
    ownershipController.getOwnershipHistory
);


/**
 * @swagger
 * /api/ownerships/changes:
 *   get:
 *     summary: Get ownership changes by Jalali date range
 *     tags: [Ownerships]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         example: 1405/05/01
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         example: 1405/05/31
 *     responses:
 *       200:
 *         description: Ownership changes fetched successfully
 *       400:
 *         description: Invalid Jalali date range
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/changes",
    ownershipController.getOwnershipChanges
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
 *     responses:
 *       200:
 *         description: Ownership fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Ownership updated successfully
 *       400:
 *         description: Invalid ownership data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ownership, property, or person not found
 *       409:
 *         description: Ownership conflict
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
 *     responses:
 *       200:
 *         description: Ownership deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ownership not found
 */
router.delete(
    "/:id",
    ownershipController.deleteOwnership
);


module.exports = router;