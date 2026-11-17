const accountingConfigurationService =
    require("../services/accountingConfiguration.service");


// ======================================================
// Get All Accounting Configurations
// ======================================================

const getAccountingConfigurations =
    async (req, res, next) => {

        try {

            const configurations =
                await accountingConfigurationService.getAll();

            return res.status(200).json({

                success: true,

                message:
                    "Accounting configurations fetched successfully",

                data: configurations

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Get Accounting Configuration By ID
// ======================================================

const getAccountingConfigurationById =
    async (req, res, next) => {

        try {

            const configuration =
                await accountingConfigurationService.getById(
                    req.params.id
                );

            return res.status(200).json({

                success: true,

                message:
                    "Accounting configuration fetched successfully",

                data: configuration

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Get By Fiscal Period
// ======================================================

const getAccountingConfigurationByFiscalPeriod =
    async (req, res, next) => {

        try {

            const configuration =
                await accountingConfigurationService
                    .getByFiscalPeriodId(
                        req.params.fiscalPeriodId
                    );

            return res.status(200).json({

                success: true,

                message:
                    "Accounting configuration fetched successfully",

                data: configuration

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Create
// ======================================================

const createAccountingConfiguration =
    async (req, res, next) => {

        try {

            const configuration =
                await accountingConfigurationService
                    .create(req.body);

            return res.status(201).json({

                success: true,

                message:
                    "Accounting configuration created successfully",

                data: configuration

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Update
// ======================================================

const updateAccountingConfiguration =
    async (req, res, next) => {

        try {

            const configuration =
                await accountingConfigurationService.update(
                    req.params.id,
                    req.body
                );

            return res.status(200).json({

                success: true,

                message:
                    "Accounting configuration updated successfully",

                data: configuration

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Delete
// ======================================================

const deleteAccountingConfiguration =
    async (req, res, next) => {

        try {

            await accountingConfigurationService.delete(
                req.params.id
            );

            return res.status(200).json({

                success: true,

                message:
                    "Accounting configuration deleted successfully"

            });

        } catch (error) {

            next(error);

        }

    };


// ======================================================
// Export
// ======================================================

module.exports = {

    getAccountingConfigurations,

    getAccountingConfigurationById,

    getAccountingConfigurationByFiscalPeriod,

    createAccountingConfiguration,

    updateAccountingConfiguration,

    deleteAccountingConfiguration

};