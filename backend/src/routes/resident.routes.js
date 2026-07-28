const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");

const {
    createResident
} = require("../controllers/resident.controller");

router.post("/", verifyToken, createResident);

module.exports = router;