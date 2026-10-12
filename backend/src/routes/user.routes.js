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
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "سارا احمدی"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sara.new@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Test@123456"
 *               role:
 *                 type: string
 *                 enum:
 *                   - ADMIN
 *                   - MANAGER
 *                   - USER
 *                 default: USER
 *                 example: USER
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - INACTIVE
 *                   - BLOCKED
 *                 default: ACTIVE
 *                 example: ACTIVE
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Person UUID to connect with this user
 *                 example: "395e638b-4279-42c0-8ffd-4dcf5d963282"
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid user data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Person not found
 *       409:
 *         description: Email or Person already exists
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    userController.createUser
);


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
router.get(
    "/",
    verifyToken,
    authorize("ADMIN"),
    userController.getUsers
);


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
router.get(
    "/profile",
    verifyToken,
    userController.profile
);


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
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "1f33441a-bfe9-45be-b841-bfe6cd59ec43"
 *     responses:
 *       200:
 *         description: User returned
 *       404:
 *         description: User not found
 */
router.get(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    userController.getUser
);


/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "1f33441a-bfe9-45be-b841-bfe6cd59ec43"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "رضا احمدی"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "reza.user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "REPLACE_WITH_A_STRONG_PASSWORD"
 *               role:
 *                 type: string
 *                 enum:
 *                   - ADMIN
 *                   - MANAGER
 *                   - USER
 *                 example: USER
 *               status:
 *                 type: string
 *                 enum:
 *                   - ACTIVE
 *                   - INACTIVE
 *                   - BLOCKED
 *                 example: ACTIVE
 *               personId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Person UUID to connect with this user
 *                 example: "5ed60053-ad9c-487d-a088-3f8b82f990d4"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User UUID
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "1f33441a-bfe9-45be-b841-bfe6cd59ec43"
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    userController.deleteUser
);


module.exports = router;