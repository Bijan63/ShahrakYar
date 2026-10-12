const express = require("express");

const router = express.Router();

const candidateController =
    require("../controllers/candidate.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Candidates
 *   description: Election candidates management
 */


/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create a candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - personId
 *               - electionId
 *             properties:
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 description: Person UUID
 *               electionId:
 *                 type: string
 *                 format: uuid
 *                 description: Election UUID
 *               biography:
 *                 type: string
 *                 nullable: true
 *                 description: Candidate biography
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Person or election not found
 *       409:
 *         description: Person is already a candidate
 */
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    candidateController.createCandidate
);


/**
 * @swagger
 * /api/candidates/election/{electionId}:
 *   get:
 *     summary: Get candidates of an election
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Candidates fetched successfully
 *       404:
 *         description: Election not found
 */
router.get(
    "/election/:electionId",
    authMiddleware,
    candidateController.getCandidates
);


/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Candidates]
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
 *         description: Candidate fetched successfully
 *       404:
 *         description: Candidate not found
 */
router.get(
    "/:id",
    authMiddleware,
    candidateController.getCandidate
);


/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate
 *     tags: [Candidates]
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
 *               biography:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *       404:
 *         description: Candidate not found
 */
router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    candidateController.updateCandidate
);


/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate
 *     tags: [Candidates]
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
 *         description: Candidate deleted successfully
 *       404:
 *         description: Candidate not found
 */
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    candidateController.deleteCandidate
);


module.exports = router;
