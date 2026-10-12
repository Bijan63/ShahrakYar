const express = require("express");

const router = express.Router();

const unitController =
    require("../controllers/unit.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Unit management
 */


/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get accessible units
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Units fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitController.getUnits
);


/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Create unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - unitNumber
 *             properties:
 *               unitNumber:
 *                 type: string
 *                 example: "101"
 *               floor:
 *                 type: integer
 *                 example: 1
 *               area:
 *                 type: number
 *                 example: 120
 *               code:
 *                 type: string
 *                 nullable: true
 *                 example: "UNIT-101"
 *               buildingId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       400:
 *         description: Invalid unit data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Building or Property not found
 */
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitController.createUnit
);


/**
 * @swagger
 * /api/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit not found
 */
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitController.getUnitById
);


/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     summary: Update unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unitNumber:
 *                 type: string
 *                 example: "102"
 *
 *               floor:
 *                 type: integer
 *                 example: 2
 *
 *               area:
 *                 type: number
 *                 example: 130
 *
 *               code:
 *                 type: string
 *                 nullable: true
 *                 example: "UNIT-102-EDITED"
 *
 *               buildingId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "d0c8e606-03ed-458d-a8fe-c441f950f6c3"
 *
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *
 *       400:
 *         description: Invalid unit data
 *
 *       401:
 *         description: Unauthorized
 *
 *       403:
 *         description: Forbidden
 *
 *       404:
 *         description: Unit not found
 *
 *       409:
 *         description: Unit code already exists
 */
router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitController.updateUnit
);


/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: Delete unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Unit not found
 */
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    unitController.deleteUnit
);


module.exports = router;