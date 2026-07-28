const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");

const {
    createCandidate,
    getCandidates
} = require("../controllers/candidate.controller");

router.post("/", verifyToken, createCandidate);

router.get(
    "/election/:electionId",
    verifyToken,
    getCandidates
);

module.exports = router;
