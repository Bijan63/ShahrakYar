const express = require("express");

const router = express.Router();


const verifyToken = require("../middleware/auth.middleware");

const authorize = require("../middleware/role.middleware");


const complexController = require("../controllers/complex.controller");



/**
 * @swagger
 * tags:
 *   name: Complexes
 *   description: Complex Management
 */



/**
 * @swagger
 * /api/complexes:
 *   post:
 *     summary: Create a new complex
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Complex created
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    complexController.createComplex
);



/**
 * @swagger
 * /api/complexes:
 *   get:
 *     summary: Get all complexes
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complex list
 */
router.get(
    "/",
    verifyToken,
    complexController.getComplexes
);



/**
 * @swagger
 * /api/complexes/{id}:
 *   get:
 *     summary: Get complex by id
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 */
router.get(
    "/:id",
    verifyToken,
    complexController.getComplexById
);



/**
 * @swagger
 * /api/complexes/{id}:
 *   patch:
 *     summary: Update complex
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexController.updateComplex
);


/**
 * @swagger
 * /api/complexes:
 *   post:
 *     summary: Create a new complex
 *     tags: [Complexes]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: شهرک رضوی
 *               address:
 *                 type: string
 *                 example: شمال کشور
 *               description:
 *                 type: string
 *                 example: مجتمع مسکونی
 *     responses:
 *       201:
 *         description: Complex created
 *       400:
 *         description: Invalid data
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexController.deleteComplex
);



module.exports = router;