const express = require("express");

const router = express.Router();

const electionController = require("../controllers/election.controller");

const verifyToken = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Elections
 *   description: Election Management
 */

/**
 * @swagger
 * /api/elections:
 *   get:
 *     summary: Get all elections
 *     tags: [Elections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of elections
 */
router.get("/", verifyToken, electionController.getElections);

/**
 * @swagger
 * /api/elections/{id}:
 *   get:
 *     summary: Get election by ID
 *     tags: [Elections]
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
 *         description: Election found
 */
router.get("/:id", verifyToken, electionController.getElection);

/**
 * @swagger
 * /api/elections/{id}/result:
 *   get:
 *     summary: Get election result
 *     tags: [Elections]
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
 *         description: Election result
 */
router.get("/:id/result", verifyToken, electionController.getResult);

/**
 * @swagger
 * /api/elections:
 *   post:
 *     summary: Create new election
 *     tags: [Elections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Election created
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    electionController.createElection
);

/**
 * @swagger
 * /api/elections/{id}/open:
 *   patch:
 *     summary: Open election
 *     tags: [Elections]
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
 *         description: Election opened
 */
router.patch(
    "/:id/open",
    verifyToken,
    authorize("ADMIN"),
    electionController.openElection
);

/**
 * @swagger
 * /api/elections/{id}/close:
 *   patch:
 *     summary: Close election
 *     tags: [Elections]
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
 *         description: Election closed
 */
router.patch(
    "/:id/close",
    verifyToken,
    authorize("ADMIN"),
    electionController.closeElection
);

module.exports = router;
