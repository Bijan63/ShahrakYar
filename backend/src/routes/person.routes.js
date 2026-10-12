const express = require("express");

const router = express.Router();

const personController = require("../controllers/person.controller");
const verifyToken = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Persons
 *   description: Person management
 */

/**
 * @swagger
 * /api/persons:
 *   post:
 *     summary: Create person
 *     tags: [Persons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - mobile
 *               - nationalId
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: محمد
 *               lastName:
 *                 type: string
 *                 example: محمدی
 *               mobile:
 *                 type: string
 *                 example: "09123333333"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               nationalId:
 *                 type: string
 *                 example: "3333333333"
 *     responses:
 *       201:
 *         description: Person created successfully
 *       400:
 *         description: Invalid person data
 */
router.post(
    "/",
    verifyToken,
    authorize("ADMIN"),
    personController.createPerson
);

/**
 * @swagger
 * /api/persons:
 *   get:
 *     summary: Get all persons
 *     tags: [Persons]
 *     responses:
 *       200:
 *         description: Persons fetched successfully
 */
router.get(
    "/",
    verifyToken,
    authorize("ADMIN"),
    personController.getPersons
);

/**
 * @swagger
 * /api/persons/{id}/residencies:
 *   get:
 *     summary: Get residencies of one person
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *     responses:
 *       200:
 *         description: Person residencies fetched successfully
 *       404:
 *         description: Person not found
 */
router.get(
    "/:id/residencies",
    verifyToken,
    authorize("ADMIN"),
    personController.getPersonResidencies
);

/**
 * @swagger
 * /api/persons/{id}/properties:
 *   get:
 *     summary: Get properties of one person
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *     responses:
 *       200:
 *         description: Person properties fetched successfully
 *       404:
 *         description: Person not found
 */
router.get(
    "/:id/properties",
    verifyToken,
    authorize("ADMIN"),
    personController.getPersonProperties
);

/**
 * @swagger
 * /api/persons/{id}:
 *   get:
 *     summary: Get person by ID
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *     responses:
 *       200:
 *         description: Person fetched successfully
 *       404:
 *         description: Person not found
 */
router.get(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    personController.getPersonById
);

/**
 * @swagger
 * /api/persons/{id}:
 *   put:
 *     summary: Update person
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: محمد
 *               lastName:
 *                 type: string
 *                 example: محمدی
 *               mobile:
 *                 type: string
 *                 example: "09123333333"
 *               email:
 *                 type: string
 *                 nullable: true
 *                 example: null
 *               nationalId:
 *                 type: string
 *                 example: "3333333333"
 *     responses:
 *       200:
 *         description: Person updated successfully
 *       404:
 *         description: Person not found
 */
router.put(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    personController.updatePerson
);

/**
 * @swagger
 * /api/persons/{id}:
 *   delete:
 *     summary: Delete person
 *     tags: [Persons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         example: 069602eb-d987-418d-bb2f-9cf9f67d1adb
 *     responses:
 *       200:
 *         description: Person deleted successfully
 *       404:
 *         description: Person not found
 */
router.delete(
    "/:id",
    verifyToken,
    authorize("ADMIN"),
    personController.deletePerson
);

module.exports = router;