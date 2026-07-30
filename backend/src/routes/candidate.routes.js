const express = require("express");

const router = express.Router();

const candidateController = require("../controllers/candidate.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Create Candidate
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    candidateController.createCandidate
);

// Get All Candidates
router.get(
    "/",
    authMiddleware,
    candidateController.getCandidates
);

// Get Candidate By Id
router.get(
    "/:id",
    authMiddleware,
    candidateController.getCandidate
);

// Update Candidate
router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    candidateController.updateCandidate
);

// Delete Candidate
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    candidateController.deleteCandidate
);

module.exports = router;