const express = require("express");

const {
    getProperties,
} = require("../controllers/financeProperty.controller");


const router = express.Router();


// ======================================================
// Finance Properties
// ======================================================

router.get(
    "/properties",
    getProperties
);


module.exports = router;