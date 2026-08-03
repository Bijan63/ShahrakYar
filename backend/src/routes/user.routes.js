const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");

const userController = require("../controllers/user.controller");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User Management
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User list
 */
router.get("/", verifyToken, authorize("ADMIN"), userController.getUsers);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get("/profile", verifyToken, userController.profile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User returned
 */
router.get("/:id", verifyToken, authorize("ADMIN"), userController.getUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    userController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    userController.deleteUser
);

module.exports = router;
