const express = require("express");

const router = express.Router();

const ownershipController = require("../controllers/ownership.controller");


// Create Ownership
router.post(
    "/",
    ownershipController.createOwnership
);


// Get All Ownerships
router.get(
    "/",
    ownershipController.getOwnerships
);


// Get Ownership By ID
router.get(
    "/:id",
    ownershipController.getOwnershipById
);


// Update Ownership
router.put(
    "/:id",
    ownershipController.updateOwnership
);


// Delete Ownership
router.delete(
    "/:id",
    ownershipController.deleteOwnership
);


module.exports = router;