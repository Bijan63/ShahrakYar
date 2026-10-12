const express = require("express");

const router = express.Router();

const dashboardController =
    require("../controllers/dashboard.controller");

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard Statistics APIs
 */

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

router.get(
    "/",
    verifyToken,
    authorize("ADMIN", "MANAGER"),
    dashboardController.getDashboard
);

module.exports = router;
