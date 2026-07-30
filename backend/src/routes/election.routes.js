const express = require("express");

const router = express.Router();

const electionController = require("../controllers/election.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ==============================
// Create Election
// Only ADMIN can create
// ==============================

router.post(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    electionController.createElection
);

// ==============================
// Get All Elections
// Any logged-in user
// ==============================

router.get("/", authMiddleware, electionController.getElections);

// ==============================
// Get Election Results
// Any logged-in user
// ==============================

router.get(
    "/:id/results",
    authMiddleware,
    electionController.getElectionResults
);

module.exports = router;
