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
 *           type: string
 *           format: uuid
 *         description: Election UUID
 *     responses:
 *       200:
 *         description: Election found
 *       404:
 *         description: Election not found
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
 *           type: string
 *           format: uuid
 *         description: Election UUID
 *     responses:
 *       200:
 *         description: Election result
 *       404:
 *         description: Election not found
 */
router.get("/:id/result", verifyToken, authorize("ADMIN", "MANAGER"), electionController.getResult);

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
 *                 example: "انتخابات هیئت مدیره شهرک رضوی"
 *               description:
 *                 type: string
 *                 example: "انتخابات اعضای هیئت مدیره شهرک رضوی"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-15T16:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-08-22T16:00:00.000Z"
 *     responses:
 *       201:
 *         description: Election created
 *       400:
 *         description: Invalid election data
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
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
 *           type: string
 *           format: uuid
 *         description: Election UUID
 *         example: "80b21098-13fb-4132-bcca-c5528dc5bd8d"
 *     responses:
 *       200:
 *         description: Election opened successfully
 *       400:
 *         description: Election cannot be opened
 *       404:
 *         description: Election not found
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
 *           type: string
 *           format: uuid
 *         description: Election UUID
 *     responses:
 *       200:
 *         description: Election closed successfully
 *       400:
 *         description: Election cannot be closed
 *       404:
 *         description: Election not found
 */
router.patch(
    "/:id/close",
    verifyToken,
    authorize("ADMIN"),
    electionController.closeElection
);

module.exports = router;