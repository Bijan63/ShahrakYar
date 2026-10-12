const express = require("express");

const router = express.Router();

const voteController =
    require("../controllers/vote.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Votes
 *   description: Election voting management
 */


/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Register a vote
 *     description: Register a vote for a candidate in an open election. The voter is determined from the authenticated user's Person.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - electionId
 *               - candidateId
 *             properties:
 *               electionId:
 *                 type: string
 *                 format: uuid
 *                 description: Election UUID
 *                 example: "80b21098-13fb-4132-bcca-c5528dc5bd8d"
 *               candidateId:
 *                 type: string
 *                 format: uuid
 *                 description: Candidate UUID
 *                 example: "268ef94c-5af2-48c4-a4fc-9dc3ec5c950d"
 *               residentId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Optional Resident UUID
 *     responses:
 *       201:
 *         description: Vote registered successfully
 *       400:
 *         description: Invalid request or election is not open
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to vote
 *       404:
 *         description: Election, candidate, resident, or user not found
 *       409:
 *         description: Person has already voted in this election
 */
router.post(
    "/",
    authMiddleware,
    authorize("USER"),
    voteController.createVote
);


/**
 * @swagger
 * /api/votes/election/{electionId}/result:
 *   get:
 *     summary: Get election result
 *     description: Get the vote count for each candidate in an election. Only ADMIN and MANAGER users are authorized.
 *     tags: [Votes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: electionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Election UUID
 *         example: "80b21098-13fb-4132-bcca-c5528dc5bd8d"
 *     responses:
 *       200:
 *         description: Election result fetched successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Only ADMIN and MANAGER users can access election results
 *       404:
 *         description: Election not found
 */
router.get(
    "/election/:electionId/result",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    voteController.getElectionResult
);


module.exports = router;