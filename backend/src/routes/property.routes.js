const express = require("express");

const router = express.Router();

const propertyController = require("../controllers/property.controller");


// Create Property
router.post(
    "/",
    propertyController.createProperty
);


// Get All Properties
router.get(
    "/",
    propertyController.getProperties
);


// Get Property By ID
router.get(
    "/:id",
    propertyController.getPropertyById
);


// Update Property
router.put(
    "/:id",
    propertyController.updateProperty
);


// Delete Property
router.delete(
    "/:id",
    propertyController.deleteProperty
);


module.exports = router;