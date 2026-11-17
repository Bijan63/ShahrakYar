const express =
    require("express");


const {
    getAccountingConfigurations,
    getAccountingConfigurationById,
    getAccountingConfigurationByFiscalPeriod,
    createAccountingConfiguration,
    updateAccountingConfiguration,
    deleteAccountingConfiguration
} =
    require("../controllers/accountingConfiguration.controller");


const router =
    express.Router();


// ======================================================
// Accounting Configurations
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations:
 *   get:
 *     summary: Get all accounting configurations
 *     tags:
 *       - Accounting Configurations
 *     responses:
 *       200:
 *         description: Accounting configurations fetched successfully
 */
router.get(
    "/",
    getAccountingConfigurations
);


// ======================================================
// Get by Fiscal Period
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations/fiscal-period/{fiscalPeriodId}:
 *   get:
 *     summary: Get accounting configuration by fiscal period
 *     tags:
 *       - Accounting Configurations
 *     parameters:
 *       - in: path
 *         name: fiscalPeriodId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Accounting configuration fetched successfully
 *       404:
 *         description: Accounting configuration not found
 */
router.get(
    "/fiscal-period/:fiscalPeriodId",
    getAccountingConfigurationByFiscalPeriod
);


// ======================================================
// Get by ID
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations/{id}:
 *   get:
 *     summary: Get accounting configuration by ID
 *     tags:
 *       - Accounting Configurations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Accounting configuration fetched successfully
 *       404:
 *         description: Accounting configuration not found
 */
router.get(
    "/:id",
    getAccountingConfigurationById
);


// ======================================================
// Create
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations:
 *   post:
 *     summary: Create accounting configuration
 *     tags:
 *       - Accounting Configurations
 *     responses:
 *       201:
 *         description: Accounting configuration created successfully
 */
router.post(
    "/",
    createAccountingConfiguration
);


// ======================================================
// Update
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations/{id}:
 *   put:
 *     summary: Update accounting configuration
 *     tags:
 *       - Accounting Configurations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Accounting configuration updated successfully
 *       404:
 *         description: Accounting configuration not found
 */
router.put(
    "/:id",
    updateAccountingConfiguration
);


// ======================================================
// Delete
// ======================================================


/**
 * @swagger
 * /api/finance/accounting-configurations/{id}:
 *   delete:
 *     summary: Delete accounting configuration
 *     tags:
 *       - Accounting Configurations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Accounting configuration deleted successfully
 *       404:
 *         description: Accounting configuration not found
 */
router.delete(
    "/:id",
    deleteAccountingConfiguration
);


module.exports =
    router;