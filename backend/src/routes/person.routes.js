const express = require("express");

const router = express.Router();

const personController = require("../controllers/person.controller");

// Create
router.post("/", personController.createPerson);


// Get All
router.get("/", personController.getPersons);



// Get Residencies Of One Person
router.get(
    "/:id/residencies",
    personController.getPersonResidencies
);

// Get Properties Of One Person
router.get(
    "/:id/properties",
    personController.getPersonProperties
);

// Get By ID
router.get(
    "/:id",
    personController.getPersonById
);


// Update
router.put(
    "/:id",
    personController.updatePerson
);


// Delete
router.delete(
    "/:id",
    personController.deletePerson
);

module.exports = router;