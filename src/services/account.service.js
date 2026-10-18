const accountRepository =
    require("../repositories/account.repository");

const prisma =
    require("../config/prisma");


class AccountService {


    // ======================================================
    // Get All Accounts
    // ======================================================

    async getAll() {

        return await accountRepository.findAll();

    }


    // ======================================================
    // Get Account by ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const account =
            await accountRepository.findById(id);


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        return account;

    }


    // ======================================================
    // Get Account by Code
    // ======================================================

    async getByCode(
        code,
        fiscalPeriodId
    ) {

        if (!code) {

            throw new Error(
                "code is required"
            );

        }


        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const account =
            await accountRepository.findByCode(
                code,
                fiscalPeriodId
            );


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        return account;

    }


    // ======================================================
    // Get Active Account by Code
    // ======================================================

    async getActiveByCode(
        code,
        fiscalPeriodId
    ) {

        if (!code) {

            throw new Error(
                "code is required"
            );

        }


        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const account =
            await accountRepository.findActiveByCode(
                code,
                fiscalPeriodId
            );


        if (!account) {

            throw new Error(
                "Active account not found"
            );

        }


        return account;

    }


    // ======================================================
    // Get Accounts by Parent ID
    // ======================================================

    async getByParentId(parentId) {

        if (!parentId) {

            throw new Error(
                "parentId is required"
            );

        }


        const parent =
            await accountRepository.findById(
                parentId
            );


        if (!parent) {

            throw new Error(
                "Parent account not found"
            );

        }


        return await accountRepository.findByParentId(
            parentId
        );

    }


    // ======================================================
    // Get Root Accounts
    // ======================================================

    async getRootAccounts() {

        return await accountRepository.findRootAccounts();

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriod(
        fiscalPeriodId
    ) {

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const fiscalPeriod =
            await prisma.fiscalPeriod.findUnique({

                where: {
                    id: fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        return fiscalPeriod;

    }


    // ======================================================
    // Create Account
    // ======================================================

    async create(data) {


        // --------------------------------------------------
        // Validate Request Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Code
        // --------------------------------------------------

        if (!data.code) {

            throw new Error(
                "code is required"
            );

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (!data.name) {

            throw new Error(
                "name is required"
            );

        }


        // --------------------------------------------------
        // Type
        // --------------------------------------------------

        if (!data.type) {

            throw new Error(
                "type is required"
            );

        }


        const allowedTypes = [

            "ASSET",
            "LIABILITY",
            "EQUITY",
            "REVENUE",
            "EXPENSE"

        ];


        if (
            !allowedTypes.includes(
                data.type
            )
        ) {

            throw new Error(
                "Invalid account type"
            );

        }


        // --------------------------------------------------
        // Cash Flow Classification
        // --------------------------------------------------

        const allowedCashFlowClassifications = [

            "NONE",
            "OPERATING",
            "INVESTING",
            "FINANCING"

        ];


        if (
            data.cashFlowClassification !== undefined &&
            !allowedCashFlowClassifications.includes(
                data.cashFlowClassification
            )
        ) {

            throw new Error(
                "Invalid cash flow classification"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // REQUIRED
        // --------------------------------------------------

        if (
            !data.fiscalPeriodId
        ) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const fiscalPeriod =
            await this.validateFiscalPeriod(
                data.fiscalPeriodId
            );


        // --------------------------------------------------
        // Prevent Duplicate Code
        // --------------------------------------------------

        const existing =
            await accountRepository.findByCode(
                data.code,
                data.fiscalPeriodId
            );


        if (existing) {

            throw new Error(
                "Account code already exists in this fiscal period"
            );

        }


        // --------------------------------------------------
        // Validate Parent
        // --------------------------------------------------

        let parent = null;


        if (
            data.parentId !== undefined &&
            data.parentId !== null &&
            data.parentId !== ""
        ) {

            if (
                data.parentId === data.id
            ) {

                throw new Error(
                    "Account cannot be its own parent"
                );

            }


            parent =
                await accountRepository.findById(
                    data.parentId
                );


            if (!parent) {

                throw new Error(
                    "Parent account not found"
                );

            }


            // ----------------------------------------------
            // Parent must be active
            // ----------------------------------------------

            if (!parent.isActive) {

                throw new Error(
                    "Parent account is inactive"
                );

            }


            // ----------------------------------------------
            // Parent type
            // ----------------------------------------------

            if (
                parent.type !== data.type
            ) {

                throw new Error(
                    "Parent account type must match account type"
                );

            }


            // ----------------------------------------------
            // Parent Fiscal Period
            // ----------------------------------------------

            if (
                parent.fiscalPeriodId !==
                data.fiscalPeriodId
            ) {

                throw new Error(
                    "Parent account must belong to the same fiscal period"
                );

            }

        }


        // --------------------------------------------------
        // isActive
        // --------------------------------------------------

        if (
            data.isActive !== undefined &&
            typeof data.isActive !== "boolean"
        ) {

            throw new Error(
                "isActive must be a boolean"
            );

        }


        // --------------------------------------------------
        // Prepare Data
        // --------------------------------------------------

        const createData = {

            code:
                data.code,

            name:
                data.name,

            type:
                data.type,

            description:
                data.description || null,

            isActive:
                data.isActive !== undefined
                    ? data.isActive
                    : true,

            parentId:
                data.parentId || null,

            fiscalPeriodId:
                data.fiscalPeriodId,

            cashFlowClassification:
                data.cashFlowClassification !== undefined
                    ? data.cashFlowClassification
                    : "NONE"

        };


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await accountRepository.create(
            createData
        );

    }


    // ======================================================
    // Update Account
    // ======================================================

    async update(id, data) {


        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Validate Request Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Existing Account
        // --------------------------------------------------

        const existing =
            await this.getById(id);


        const updateData = {};


        // ==================================================
        // Protect Used Accounts
        // ==================================================

        const journalLineCount =
            await prisma.journalEntryLine.count({
                where: {
                    accountId: id
                }
            });


        const hasJournalEntries =
            journalLineCount > 0;


        // --------------------------------------------------
        // Prevent Type Change on Used Account
        // --------------------------------------------------

        if (
            hasJournalEntries &&
            data.type !== undefined &&
            data.type !== existing.type
        ) {

            throw new Error(
                "Account type cannot be changed because the account has journal entry lines"
            );

        }


        // --------------------------------------------------
        // Prevent Fiscal Period Change on Used Account
        // --------------------------------------------------

        if (
            hasJournalEntries &&
            data.fiscalPeriodId !== undefined &&
            data.fiscalPeriodId !== existing.fiscalPeriodId
        ) {

            throw new Error(
                "Fiscal period cannot be changed because the account has journal entry lines"
            );

        }


        // ==================================================
        // Code
        // ==================================================

        if (
            data.code !== undefined
        ) {

            if (!data.code) {

                throw new Error(
                    "code is required"
                );

            }


            const finalFiscalPeriodId =
                data.fiscalPeriodId !== undefined
                    ? data.fiscalPeriodId
                    : existing.fiscalPeriodId;


            const duplicate =
                await accountRepository.findByCode(
                    data.code,
                    finalFiscalPeriodId
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Account code already exists in this fiscal period"
                );

            }


            updateData.code =
                data.code;

        }


        // ==================================================
        // Name
        // ==================================================

        if (
            data.name !== undefined
        ) {

            if (!data.name) {

                throw new Error(
                    "name is required"
                );

            }


            updateData.name =
                data.name;

        }


        // ==================================================
        // Type
        // ==================================================

        if (
            data.type !== undefined
        ) {

            const allowedTypes = [

                "ASSET",
                "LIABILITY",
                "EQUITY",
                "REVENUE",
                "EXPENSE"

            ];


            if (
                !allowedTypes.includes(
                    data.type
                )
            ) {

                throw new Error(
                    "Invalid account type"
                );

            }


            updateData.type =
                data.type;

        }


        // ==================================================
        // Cash Flow Classification
        // ==================================================

        if (
            data.cashFlowClassification !== undefined
        ) {

            const allowedCashFlowClassifications = [

                "NONE",
                "OPERATING",
                "INVESTING",
                "FINANCING"

            ];


            if (
                !allowedCashFlowClassifications.includes(
                    data.cashFlowClassification
                )
            ) {

                throw new Error(
                    "Invalid cash flow classification"
                );

            }


            updateData.cashFlowClassification =
                data.cashFlowClassification;

        }


        // ==================================================
        // Description
        // ==================================================

        if (
            data.description !== undefined
        ) {

            updateData.description =
                data.description;

        }


        // ==================================================
        // isActive
        // ==================================================

        if (
            data.isActive !== undefined
        ) {

            if (
                typeof data.isActive !== "boolean"
            ) {

                throw new Error(
                    "isActive must be a boolean"
                );

            }


            updateData.isActive =
                data.isActive;

        }


        // ==================================================
        // Final Fiscal Period
        // ==================================================

        const finalFiscalPeriodId =
            data.fiscalPeriodId !== undefined
                ? data.fiscalPeriodId
                : existing.fiscalPeriodId;


        // --------------------------------------------------
        // Fiscal Period CANNOT be null
        // --------------------------------------------------

        if (
            !finalFiscalPeriodId
        ) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        await this.validateFiscalPeriod(
            finalFiscalPeriodId
        );


        // ==================================================
        // Parent Account
        // ==================================================

        let finalParentId =
            existing.parentId;


        if (
            data.parentId !== undefined
        ) {

            // ----------------------------------------------
            // Remove Parent
            // ----------------------------------------------

            if (
                data.parentId === null ||
                data.parentId === ""
            ) {

                updateData.parentId =
                    null;

                finalParentId =
                    null;

            }

            // ----------------------------------------------
            // Set Parent
            // ----------------------------------------------

            else {

                if (
                    data.parentId === id
                ) {

                    throw new Error(
                        "Account cannot be its own parent"
                    );

                }


                const parent =
                    await accountRepository.findById(
                        data.parentId
                    );


                if (!parent) {

                    throw new Error(
                        "Parent account not found"
                    );

                }


                if (!parent.isActive) {

                    throw new Error(
                        "Parent account is inactive"
                    );

                }


                const finalType =
                    updateData.type !== undefined
                        ? updateData.type
                        : existing.type;


                if (
                    parent.type !== finalType
                ) {

                    throw new Error(
                        "Parent account type must match account type"
                    );

                }


                if (
                    parent.fiscalPeriodId !==
                    finalFiscalPeriodId
                ) {

                    throw new Error(
                        "Parent account must belong to the same fiscal period"
                    );

                }


                // ------------------------------------------
                // Prevent Circular Hierarchy
                // ------------------------------------------

                let currentParent =
                    parent;


                while (
                    currentParent
                ) {

                    if (
                        currentParent.id === id
                    ) {

                        throw new Error(
                            "Circular account hierarchy detected"
                        );

                    }


                    if (
                        !currentParent.parentId
                    ) {

                        break;

                    }


                    currentParent =
                        await accountRepository.findById(
                            currentParent.parentId
                        );

                }


                updateData.parentId =
                    data.parentId;

                finalParentId =
                    data.parentId;

            }

        }


        // ==================================================
        // Validate Existing Parent after Fiscal Period Change
        // ==================================================

        if (finalParentId) {

            const finalParent =
                await accountRepository.findById(
                    finalParentId
                );


            if (!finalParent) {

                throw new Error(
                    "Parent account not found"
                );

            }


            if (
                finalParent.fiscalPeriodId !==
                finalFiscalPeriodId
            ) {

                throw new Error(
                    "Parent account must belong to the same fiscal period"
                );

            }

        }


        // ==================================================
        // Validate Children when Fiscal Period Changes
        // ==================================================

        if (
            data.fiscalPeriodId !== undefined &&
            data.fiscalPeriodId !==
                existing.fiscalPeriodId
        ) {

            const children =
                await accountRepository.findByParentId(
                    id
                );


            if (
                children &&
                children.length > 0
            ) {

                const invalidChild =
                    children.some(
                        child =>
                            child.fiscalPeriodId !==
                            finalFiscalPeriodId
                    );


                if (invalidChild) {

                    throw new Error(
                        "Fiscal period cannot be changed because child accounts belong to a different fiscal period"
                    );

                }

            }

        }


        // ==================================================
        // Validate Type Change Against Children
        // ==================================================

        if (
            updateData.type !== undefined &&
            updateData.type !== existing.type
        ) {

            const children =
                await accountRepository.findByParentId(
                    id
                );


            if (
                children &&
                children.length > 0
            ) {

                const hasInvalidChild =
                    children.some(
                        child =>
                            child.type !==
                            updateData.type
                    );


                if (hasInvalidChild) {

                    throw new Error(
                        "Account type cannot be changed because child accounts have a different type"
                    );

                }

            }

        }


        // ==================================================
        // Set Fiscal Period
        // ==================================================

        if (
            data.fiscalPeriodId !== undefined
        ) {

            updateData.fiscalPeriodId =
                finalFiscalPeriodId;

        }


        // ==================================================
        // Update
        // ==================================================

        return await accountRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Delete Account
    // ======================================================

    async delete(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const account =
            await this.getById(id);


        // --------------------------------------------------
        // Prevent Delete if Children Exist
        // --------------------------------------------------

        if (
            account.children &&
            account.children.length > 0
        ) {

            throw new Error(
                "Cannot delete account with child accounts"
            );

        }


        // --------------------------------------------------
        // Prevent Delete if Financial Accounts Exist
        // --------------------------------------------------

        const financialAccount =
            await prisma.financialAccount.findFirst({

                where: {
                    accountId: id
                }

            });


        if (financialAccount) {

            throw new Error(
                "Cannot delete account linked to a financial account"
            );

        }


        // --------------------------------------------------
        // Prevent Delete if Opening Balances Exist
        // --------------------------------------------------

        const openingBalance =
            await prisma.openingBalance.findFirst({

                where: {
                    accountId: id
                }

            });


        if (openingBalance) {

            throw new Error(
                "Cannot delete account with opening balances"
            );

        }


        // --------------------------------------------------
        // Prevent Delete if Journal Entry Lines Exist
        // --------------------------------------------------

        const journalLine =
            await prisma.journalEntryLine.findFirst({

                where: {
                    accountId: id
                }

            });


        if (journalLine) {

            throw new Error(
                "Cannot delete account with journal entry lines"
            );

        }


        // --------------------------------------------------
        // Delete
        // --------------------------------------------------

        return await accountRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new AccountService();