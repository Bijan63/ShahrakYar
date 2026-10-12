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
 *         description: Complex created successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
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
 *       401:
 *         description: Unauthorized
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
 *     summary: Get complex by ID
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complex UUID
 *     responses:
 *       200:
 *         description: Complex found successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Complex not found
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complex UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: شهرک رضوی جدید
 *               address:
 *                 type: string
 *                 example: شمال کشور - مازندران
 *               description:
 *                 type: string
 *                 example: مجتمع مسکونی بروزرسانی شده
 *     responses:
 *       200:
 *         description: Complex updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Complex not found
 */
router.patch(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexController.updateComplex
);


/**
 * @swagger
 * /api/complexes/{id}:
 *   delete:
 *     summary: Delete complex
 *     tags: [Complexes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complex UUID
 *     responses:
 *       200:
 *         description: Complex deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Complex not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexController.deleteComplex
);


module.exports = router;
