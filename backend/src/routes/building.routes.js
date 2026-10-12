const express = require("express");

const router = express.Router();

const buildingController =
    require("../controllers/building.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");


/**
 * @swagger
 * tags:
 *   name: Buildings
 *   description: Building management
 */


/**
 * @swagger
 * /api/buildings:
 *   post:
 *     summary: Create building
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - complexId
 *             properties:
 *               name:
 *                 type: string
 *                 example: ساختمان شماره ۱
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: شهرک رضوی
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: ساختمان تستی پروژه شهرک یار
 *               complexId:
 *                 type: string
 *                 format: uuid
 *                 example: d9964424-e8c2-41fe-ba81-218aa9cd80f4
 *     responses:
 *       201:
 *         description: Building created successfully
 *       400:
 *         description: Invalid building data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    buildingController.createBuilding
);


/**
 * @swagger
 * /api/buildings:
 *   get:
 *     summary: Get accessible buildings
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Buildings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    buildingController.getBuildings
);


/**
 * @swagger
 * /api/buildings/{id}:
 *   get:
 *     summary: Get building by ID
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Building UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Building fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Building not found
 */
router.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    buildingController.getBuilding
);


/**
 * @swagger
 * /api/buildings/{id}:
 *   put:
 *     summary: Update building
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Building UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               complexId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Building updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Building not found
 */
router.put(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    buildingController.updateBuilding
);


/**
 * @swagger
 * /api/buildings/{id}:
 *   delete:
 *     summary: Delete building
 *     tags: [Buildings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Building UUID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Building deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Building not found
 */
router.delete(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "MANAGER"),
    buildingController.deleteBuilding
);


module.exports = router;