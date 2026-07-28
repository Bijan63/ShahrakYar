const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const { profile } = require("../controllers/user.controller");

// Protected Route
router.get("/profile", verifyToken, profile);

module.exports = router;