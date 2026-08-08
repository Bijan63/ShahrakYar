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


// Search Properties
router.get(
    "/search",
    propertyController.searchProperties
);

// Get Property Full Detail
router.get(
    "/detail/:id",
    propertyController.getPropertyDetail
);

router.get(
    "/:id/owners",
    propertyController.getPropertyOwners
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