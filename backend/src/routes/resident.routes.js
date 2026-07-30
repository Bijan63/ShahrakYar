const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const {

    createResident,

    getResident,

    getResidents,

    searchResidents,

    updateResident,

    deleteResident

} = require("../controllers/resident.controller");

router.post(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    createResident
);

router.get(
    "/",
    verifyToken,
    getResidents
);

router.get(
    "/search",
    verifyToken,
    searchResidents
);

router.get(
    "/:id",
    verifyToken,
    getResident
);

router.put(
    "/:id",
    verifyToken,
    updateResident
);

router.delete(
    "/:id",
    verifyToken,
    deleteResident
);

module.exports = router;