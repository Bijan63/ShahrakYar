const express = require("express");

const router = express.Router();

const buildingController = require("../controllers/building.controller");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// Create Building
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN"),
    buildingController.createBuilding
);

// Get All Buildings
router.get("/", authMiddleware, buildingController.getBuildings);

// Get Building By Id
router.get("/:id", authMiddleware, buildingController.getBuilding);

// Update Building
router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    buildingController.updateBuilding
);

// Delete Building
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN"),
    buildingController.deleteBuilding
);

module.exports = router;
