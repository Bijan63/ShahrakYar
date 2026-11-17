const prisma =
    require("../config/prisma");

const accountingConfigurationRepository =
    require("../repositories/accountingConfiguration.repository");


// ======================================================
// Accounting Configuration Service
// ======================================================

class AccountingConfigurationService {


    // ======================================================
    // Validate UUID
    // ======================================================

    validateId(
        id,
        fieldName = "id"
    ) {

        if (!id) {

            throw new Error(
                `${fieldName} is required`
            );

        }


        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


        if (!uuidRegex.test(id)) {

            throw new Error(
                `${fieldName} must be a valid UUID`
            );

        }


        return id;

    }


    // ======================================================
    // Get All
    // ======================================================

    async getAll() {

        return await accountingConfigurationRepository
            .findAll();

    }


    // ======================================================
    // Get By ID
    // ======================================================

    async getById(id) {

        this.validateId(
            id,
            "Accounting configuration id"
        );


        const configuration =
            await accountingConfigurationRepository
                .findById(id);


        if (!configuration) {

            throw new Error(
                "Accounting configuration not found"
            );

        }


        return configuration;

    }


    // ======================================================
    // Get By Fiscal Period
    // ======================================================

    async getByFiscalPeriodId(
        fiscalPeriodId
    ) {

        this.validateId(
            fiscalPeriodId,
            "Fiscal period id"
        );


        const configuration =
            await accountingConfigurationRepository
                .findByFiscalPeriodId(
                    fiscalPeriodId
                );


        if (!configuration) {

            throw new Error(
                "Accounting configuration not found for this fiscal period"
            );

        }


        return configuration;

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriod(
        fiscalPeriodId,
        client = prisma
    ) {

        this.validateId(
            fiscalPeriodId,
            "Fiscal period id"
        );


        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        if (
            fiscalPeriod.status !==
            "ACTIVE"
        ) {

            throw new Error(
                "Fiscal period must be ACTIVE"
            );

        }


        return fiscalPeriod;

    }


    // ======================================================
    // Validate Account
    // ======================================================

    async validateAccount(
        accountId,
        fiscalPeriodId,
        expectedType,
        fieldName,
        client = prisma
    ) {

        this.validateId(
            accountId,
            fieldName
        );


        const account =
            await client.account.findUnique({

                where: {
                    id: accountId
                }

            });


        if (!account) {

            throw new Error(
                `${fieldName} not found`
            );

        }


        if (!account.isActive) {

            throw new Error(
                `${fieldName} is not active`
            );

        }


        if (
            account.fiscalPeriodId !==
            fiscalPeriodId
        ) {

            throw new Error(
                `${fieldName} does not belong to the selected fiscal period`
            );

        }


        if (
            account.type !==
            expectedType
        ) {

            throw new Error(
                `${fieldName} must be of type ${expectedType}`
            );

        }


        return account;

    }


    // ======================================================
    // Validate Different Accounts
    // ======================================================

    validateDifferentAccounts(
        receivableAccountId,
        revenueAccountId
    ) {

        if (
            receivableAccountId ===
            revenueAccountId
        ) {

            throw new Error(
                "Charge receivable account and charge revenue account must be different"
            );

        }

    }


    // ======================================================
    // Create
    // ======================================================

    async create(data) {

        if (
            !data ||
            typeof data !== "object"
        ) {

            throw new Error(
                "Request data is required"
            );

        }


        const {
            fiscalPeriodId,
            chargeReceivableAccountId,
            chargeRevenueAccountId
        } = data;


        // --------------------------------------------------
        // Validate IDs
        // --------------------------------------------------

        this.validateId(
            fiscalPeriodId,
            "Fiscal period id"
        );


        this.validateId(
            chargeReceivableAccountId,
            "Charge receivable account id"
        );


        this.validateId(
            chargeRevenueAccountId,
            "Charge revenue account id"
        );


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        await this.validateFiscalPeriod(
            fiscalPeriodId
        );


        // --------------------------------------------------
        // Check Existing Configuration
        // --------------------------------------------------

        const existing =
            await accountingConfigurationRepository
                .findByFiscalPeriodId(
                    fiscalPeriodId
                );


        if (existing) {

            throw new Error(
                "Accounting configuration already exists for this fiscal period"
            );

        }


        // --------------------------------------------------
        // Accounts Must Be Different
        // --------------------------------------------------

        this.validateDifferentAccounts(
            chargeReceivableAccountId,
            chargeRevenueAccountId
        );


        // --------------------------------------------------
        // Validate Receivable Account
        // --------------------------------------------------

        await this.validateAccount(

            chargeReceivableAccountId,

            fiscalPeriodId,

            "ASSET",

            "Charge receivable account"

        );


        // --------------------------------------------------
        // Validate Revenue Account
        // --------------------------------------------------

        await this.validateAccount(

            chargeRevenueAccountId,

            fiscalPeriodId,

            "REVENUE",

            "Charge revenue account"

        );


        // --------------------------------------------------
        // Create Configuration
        // --------------------------------------------------

        return await accountingConfigurationRepository.create({

            fiscalPeriodId,

            chargeReceivableAccountId,

            chargeRevenueAccountId

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(
        id,
        data
    ) {

        this.validateId(
            id,
            "Accounting configuration id"
        );


        if (
            !data ||
            typeof data !== "object"
        ) {

            throw new Error(
                "Request data is required"
            );

        }


        // --------------------------------------------------
        // Find Existing Configuration
        // --------------------------------------------------

        const existing =
            await accountingConfigurationRepository
                .findById(id);


        if (!existing) {

            throw new Error(
                "Accounting configuration not found"
            );

        }


        // --------------------------------------------------
        // Resolve Final Values
        // --------------------------------------------------

        const fiscalPeriodId =
            data.fiscalPeriodId ||
            existing.fiscalPeriodId;


        const chargeReceivableAccountId =
            data.chargeReceivableAccountId ||
            existing.chargeReceivableAccountId;


        const chargeRevenueAccountId =
            data.chargeRevenueAccountId ||
            existing.chargeRevenueAccountId;


        // --------------------------------------------------
        // Validate IDs
        // --------------------------------------------------

        this.validateId(
            fiscalPeriodId,
            "Fiscal period id"
        );


        this.validateId(
            chargeReceivableAccountId,
            "Charge receivable account id"
        );


        this.validateId(
            chargeRevenueAccountId,
            "Charge revenue account id"
        );


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        await this.validateFiscalPeriod(
            fiscalPeriodId
        );


        // --------------------------------------------------
        // Fiscal Period Uniqueness
        // --------------------------------------------------

        if (
            fiscalPeriodId !==
            existing.fiscalPeriodId
        ) {

            const duplicate =
                await accountingConfigurationRepository
                    .findByFiscalPeriodId(
                        fiscalPeriodId
                    );


            if (duplicate) {

                throw new Error(
                    "Accounting configuration already exists for this fiscal period"
                );

            }

        }


        // --------------------------------------------------
        // Accounts Must Be Different
        // --------------------------------------------------

        this.validateDifferentAccounts(
            chargeReceivableAccountId,
            chargeRevenueAccountId
        );


        // --------------------------------------------------
        // Validate Receivable Account
        // --------------------------------------------------

        await this.validateAccount(

            chargeReceivableAccountId,

            fiscalPeriodId,

            "ASSET",

            "Charge receivable account"

        );


        // --------------------------------------------------
        // Validate Revenue Account
        // --------------------------------------------------

        await this.validateAccount(

            chargeRevenueAccountId,

            fiscalPeriodId,

            "REVENUE",

            "Charge revenue account"

        );


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        return await accountingConfigurationRepository.update(

            id,

            {

                fiscalPeriodId,

                chargeReceivableAccountId,

                chargeRevenueAccountId

            }

        );

    }


    // ======================================================
    // Delete
    // ======================================================

    async delete(id) {

        this.validateId(
            id,
            "Accounting configuration id"
        );


        const existing =
            await accountingConfigurationRepository
                .findById(id);


        if (!existing) {

            throw new Error(
                "Accounting configuration not found"
            );

        }


        return await accountingConfigurationRepository
            .delete(id);

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new AccountingConfigurationService();