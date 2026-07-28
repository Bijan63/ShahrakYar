const express = require("express");
const router = express.Router();

const {
    createUnit,
    getUnitById
} = require("../controllers/unit.controller");

const verifyToken = require("../middleware/auth.middleware");

router.post("/", verifyToken, createUnit);
router.get("/:id", verifyToken, getUnitById);

module.exports = router;