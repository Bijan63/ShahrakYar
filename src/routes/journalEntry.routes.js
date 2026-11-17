const express =
    require("express");


const {
    getJournalEntries,
    getJournalEntryById,
    getJournalEntryByEntryNumber,
    getJournalEntriesByFiscalPeriod,
    getJournalEntriesByFund,
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    postJournalEntry
} =
    require("../controllers/journalEntry.controller");

const router =
    express.Router();


// ======================================================
// Swagger Schemas
// ======================================================

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     JournalEntryLine:
 *       type: object
 *       required:
 *         - accountId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         accountId:
 *           type: string
 *           format: uuid
 *         description:
 *           type: string
 *           nullable: true
 *         debit:
 *           type: number
 *           format: double
 *           example: 1000000
 *         credit:
 *           type: number
 *           format: double
 *           example: 0
 *
 *
 *     JournalEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         entryNumber:
 *           type: string
 *           example: JV-1405-001
 *         entryDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum:
 *             - DRAFT
 *             - POSTED
 *             - CANCELLED
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         lines:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JournalEntryLine'
 *
 *
 *     CreateJournalEntry:
 *       type: object
 *       required:
 *         - entryNumber
 *         - entryDate
 *         - fiscalPeriodId
 *         - lines
 *       properties:
 *         entryNumber:
 *           type: string
 *           example: JV-1405-001
 *         entryDate:
 *           type: string
 *           format: date-time
 *           example: 2026-08-27T10:00:00.000Z
 *         description:
 *           type: string
 *           example: دریافت وجه از مالک
 *         status:
 *           type: string
 *           enum:
 *             - DRAFT
 *             - POSTED
 *             - CANCELLED
 *           default: DRAFT
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         lines:
 *           type: array
 *           minItems: 2
 *           items:
 *             $ref: '#/components/schemas/JournalEntryLine'
 *
 *
 *     UpdateJournalEntry:
 *       type: object
 *       properties:
 *         entryNumber:
 *           type: string
 *         entryDate:
 *           type: string
 *           format: date-time
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum:
 *             - DRAFT
 *             - POSTED
 *             - CANCELLED
 *         fiscalPeriodId:
 *           type: string
 *           format: uuid
 *         fundId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         lines:
 *           type: array
 *           minItems: 2
 *           items:
 *             $ref: '#/components/schemas/JournalEntryLine'
 */


// ======================================================
// Journal Entries
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries:
 *   get:
 *     summary: Get all journal entries
 *     tags:
 *       - Journal Entries
 *     responses:
 *       200:
 *         description: Journal entries fetched successfully
 */
router.get(
    "/",
    getJournalEntries
);


// ======================================================
// Get by Entry Number
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/number/{entryNumber}:
 *   get:
 *     summary: Get journal entry by entry number
 *     tags:
 *       - Journal Entries
 *     parameters:
 *       - in: path
 *         name: entryNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Journal entry fetched successfully
 *       404:
 *         description: Journal entry not found
 */
router.get(
    "/number/:entryNumber",
    getJournalEntryByEntryNumber
);


// ======================================================
// Get by Fiscal Period
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/fiscal-period/{fiscalPeriodId}:
 *   get:
 *     summary: Get journal entries by fiscal period
 *     tags:
 *       - Journal Entries
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Journal entries fetched successfully
 */
router.get(
    "/fiscal-period/:fiscalPeriodId",
    getJournalEntriesByFiscalPeriod
);


// ======================================================
// Get by Fund
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/fund/{fundId}:
 *   get:
 *     summary: Get journal entries by fund
 *     tags:
 *       - Journal Entries
 *     parameters:
 *       - in: path
 *         name: fundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Journal entries fetched successfully
 */
router.get(
    "/fund/:fundId",
    getJournalEntriesByFund
);

// ======================================================
// Post Journal Entry
// ======================================================

/**
 * @swagger
 * /api/finance/journal-entries/{id}/post:
 *   post:
 *     summary: Post journal entry
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *

 *     responses:
 *       200:
 *         description: Journal entry posted successfully
 *       400:
 *         description: Invalid journal entry data or validation failure
 *       404:
 *         description: Journal entry, fiscal period or related record not found
 *       409:
 *         description: Journal entry is not in DRAFT status or fiscal period is inactive
 *       500:
 *         description: Internal server error

 */
router.post(
    "/:id/post",
    postJournalEntry
);

// ======================================================
// Get by ID
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/{id}:
 *   get:
 *     summary: Get journal entry by ID
 *     tags:
 *       - Journal Entries
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Journal entry fetched successfully
 *       404:
 *         description: Journal entry not found
 */
router.get(
    "/:id",
    getJournalEntryById
);


// ======================================================
// Create
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries:
 *   post:
 *     summary: Create journal entry
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateJournalEntry'
 *     responses:
 *       201:
 *         description: Journal entry created successfully
 *       400:
 *         description: Invalid journal entry
 *       409:
 *         description: Entry number already exists
 */
router.post(
    "/",
    createJournalEntry
);


// ======================================================
// Update
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/{id}:
 *   put:
 *     summary: Update journal entry
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateJournalEntry'
 *     responses:
 *       200:
 *         description: Journal entry updated successfully
 *       400:
 *         description: Invalid journal entry data
 *       404:
 *         description: Journal entry or related record not found
 *       409:
 *         description: Journal entry cannot be modified because of its current status or a data conflict
 *       500:
 *         description: Internal server error
 */
router.put(
    "/:id",
    updateJournalEntry
);


// ======================================================
// Delete
// ======================================================


/**
 * @swagger
 * /api/finance/journal-entries/{id}:
 *   delete:
 *     summary: Delete journal entry
 *     tags:
 *       - Journal Entries
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
 *         description: Journal entry deleted successfully
 *       404:
 *         description: Journal entry not found
 *       409:
 *         description: Only DRAFT journal entries can be deleted
 *       500:
 *         description: Internal server error
 */
router.delete(
    "/:id",
    deleteJournalEntry
);

// ======================================================
// Journal Entry Error Handler
// ======================================================

router.use(
    require("../middleware/journalEntryError.middleware")
);


// ======================================================
// Export
// ======================================================

module.exports =
    router;
