const express = require("express");

const router = express.Router();

const { register, login } = require("../controllers/auth.controller");

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Authentication APIs
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
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
 *                 example: Ali Hoss
 *               email:
 *                 type: string
 *                 example: ali@test.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid data
 */

router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ali@test.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: JWT Token returned
 *       401:
 *         description: Invalid credentials
 */

router.post("/login", login);

module.exports = router;
