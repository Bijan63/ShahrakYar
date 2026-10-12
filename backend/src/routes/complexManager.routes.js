const express = require("express");

const router = express.Router();

const verifyToken =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");

const complexManagerController =
    require("../controllers/complexManager.controller");


/**
 * @swagger
 * tags:
 *   name: Complex Managers
 *   description: Assign and manage managers for complexes
 */


/**
 * @swagger
 * /api/complex-managers:
 *   post:
 *     summary: Assign a manager to a complex
 *     tags: [Complex Managers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - complexId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User UUID. The user must have MANAGER role.
 *               complexId:
 *                 type: string
 *                 format: uuid
 *                 description: Complex UUID.
 *     responses:
 *       201:
 *         description: Manager assigned successfully
 *       400:
 *         description: Invalid user or manager
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or complex not found
 *       409:
 *         description: Manager is already assigned to this complex
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.assignManager
);


/**
 * @swagger
 * /api/complex-managers:
 *   get:
 *     summary: Get all manager assignments
 *     tags: [Complex Managers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager assignments returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    "/",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.getAssignments
);


/**
 * @swagger
 * /api/complex-managers/{id}:
 *   get:
 *     summary: Get manager assignment by ID
 *     tags: [Complex Managers]
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
 *         description: Assignment returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.get(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.getAssignmentById
);


/**
 * @swagger
 * /api/complex-managers/manager/{userId}:
 *   get:
 *     summary: Get complexes assigned to a manager
 *     tags: [Complex Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Manager complexes returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.get(
    "/manager/:userId",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.getManagerComplexes
);


/**
 * @swagger
 * /api/complex-managers/complex/{complexId}:
 *   get:
 *     summary: Get managers assigned to a complex
 *     tags: [Complex Managers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complexId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Complex managers returned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Complex not found
 */
router.get(
    "/complex/:complexId",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.getComplexManagers
);


/**
 * @swagger
 * /api/complex-managers/{id}:
 *   delete:
 *     summary: Remove a manager from a complex
 *     tags: [Complex Managers]
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
 *         description: Manager removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    complexManagerController.removeAssignment
);


module.exports = router;