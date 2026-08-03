const express = require("express");

const router = express.Router();

const voteController = require("../controllers/vote.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Register Vote
router.post("/", authMiddleware, authorize("USER"), voteController.createVote);

module.exports = router;
