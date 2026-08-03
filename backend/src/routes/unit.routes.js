const express = require("express");

const router = express.Router();

const {
    createUnit,
    getUnits,
    getUnitById
} = require("../controllers/unit.controller");

const verifyToken = require("../middleware/auth.middleware");


/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Unit Management
 */


/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get all units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of units
 */
router.get(
    "/",
    verifyToken,
    getUnits
);


/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Create new unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 */
router.post(
    "/",
    verifyToken,
    createUnit
);


/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: Get unit by id
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/:id",
    verifyToken,
    getUnitById
);


module.exports = router;
