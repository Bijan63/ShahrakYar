const openingBalanceRepository =
    require("../repositories/openingBalance.repository");

const prisma =
    require("../config/prisma");


// ======================================================
// Opening Balance Service
// ======================================================

class OpeningBalanceService {


    // ==================================================
    // Validate Fiscal Period
    // ==================================================

    async validateFiscalPeriod(
        fiscalPeriodId,
        options = {}
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


        // ------------------------------------------------
        // Closed Fiscal Period Protection
        // ------------------------------------------------

        if (
            options.requireEditable !== false &&
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                `Fiscal period is not active: ${fiscalPeriod.code}`
            );

        }


        return fiscalPeriod;

    }


    // ==================================================
    // Validate Leaf Account
    // ==================================================

    async validateLeafAccount(
        accountId,
        fiscalPeriodId
    ) {

        // ------------------------------------------------
        // Validate Account ID
        // ------------------------------------------------

        if (!accountId) {

            throw new Error(
                "accountId is required"
            );

        }


        // ------------------------------------------------
        // Find Account
        // ------------------------------------------------

        const account =
            await prisma.account.findUnique({

                where: {
                    id: accountId
                }

            });


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        // ------------------------------------------------
        // Account Active
        // ------------------------------------------------

        if (!account.isActive) {

            throw new Error(
                `Account is inactive: ${account.code}`
            );

        }


        // ------------------------------------------------
        // Fiscal Period Relation
        // ------------------------------------------------

        if (
            fiscalPeriodId &&
            account.fiscalPeriodId !== fiscalPeriodId
        ) {

            throw new Error(
                `Account ${account.code} does not belong to the selected fiscal period`
            );

        }


        // ------------------------------------------------
        // Find Children
        // ------------------------------------------------

        const childCount =
            await prisma.account.count({

                where: {

                    parentId: account.id

                }

            });


        // ------------------------------------------------
        // Leaf Account Validation
        // ------------------------------------------------

        if (childCount > 0) {

            throw new Error(
                `Opening balance can only be created for a leaf account: ${account.code}`
            );

        }


        return account;

    }


    // ==================================================
    // Validate Amounts
    // ==================================================

    validateAmounts(
        debit,
        credit
    ) {

        // ------------------------------------------------
        // Valid Numbers
        // ------------------------------------------------

        if (
            !Number.isFinite(debit) ||
            !Number.isFinite(credit)
        ) {

            throw new Error(
                "Debit and credit must be valid numbers"
            );

        }


        // ------------------------------------------------
        // Negative Protection
        // ------------------------------------------------

        if (
            debit < 0 ||
            credit < 0
        ) {

            throw new Error(
                "Debit and credit cannot be negative"
            );

        }


        // ------------------------------------------------
        // Both Debit and Credit
        // ------------------------------------------------

        if (
            debit > 0 &&
            credit > 0
        ) {

            throw new Error(
                "Opening balance cannot have both debit and credit"
            );

        }


        // ------------------------------------------------
        // Empty Balance
        // ------------------------------------------------

        if (
            debit === 0 &&
            credit === 0
        ) {

            throw new Error(
                "Opening balance must have debit or credit amount"
            );

        }


        return {
            debit,
            credit
        };

    }


    // ==================================================
    // Normalize Amount
    // ==================================================

    normalizeAmount(value) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return 0;

        }


        return Number(value);

    }


    // ==================================================
    // Get All Opening Balances
    // ==================================================

    async getAll() {

        return await openingBalanceRepository.findAll();

    }


    // ==================================================
    // Get Opening Balance by ID
    // ==================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const openingBalance =
            await openingBalanceRepository.findById(
                id
            );


        if (!openingBalance) {

            throw new Error(
                "Opening balance not found"
            );

        }


        return openingBalance;

    }


    // ==================================================
    // Get Opening Balances by Fiscal Period
    // ==================================================

    async getByFiscalPeriod(
        fiscalPeriodId
    ) {

        await this.validateFiscalPeriod(

            fiscalPeriodId,

            {
                requireEditable: false
            }

        );


        return await openingBalanceRepository
            .findByFiscalPeriodId(
                fiscalPeriodId
            );

    }


    // ==================================================
    // Get Opening Balances by Account
    // ==================================================

    async getByAccount(
        accountId
    ) {

        if (!accountId) {

            throw new Error(
                "accountId is required"
            );

        }


        const account =
            await prisma.account.findUnique({

                where: {
                    id: accountId
                }

            });


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        return await openingBalanceRepository
            .findByAccountId(
                accountId
            );

    }


    // ==================================================
    // Get Opening Balance by Fiscal Period + Account
    // ==================================================

    async getByFiscalPeriodAndAccount(
        fiscalPeriodId,
        accountId
    ) {

        // ------------------------------------------------
        // Validate Fiscal Period
        // ------------------------------------------------

        await this.validateFiscalPeriod(

            fiscalPeriodId,

            {
                requireEditable: false
            }

        );


        // ------------------------------------------------
        // Validate Account
        // ------------------------------------------------

        await this.validateLeafAccount(

            accountId,

            fiscalPeriodId

        );


        // ------------------------------------------------
        // Find Opening Balance
        // ------------------------------------------------

        const openingBalance =
            await openingBalanceRepository
                .findByFiscalPeriodAndAccount(

                    fiscalPeriodId,

                    accountId

                );


        if (!openingBalance) {

            throw new Error(
                "Opening balance not found"
            );

        }


        return openingBalance;

    }


    // ==================================================
    // Validate Opening Balances Balance
    // ==================================================

    async validateBalance(
        fiscalPeriodId
    ) {

        // ------------------------------------------------
        // Validate Fiscal Period ID
        // ------------------------------------------------

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        // ------------------------------------------------
        // Validate Fiscal Period
        // ------------------------------------------------

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


        // ------------------------------------------------
        // Get Active Opening Balances
        // ------------------------------------------------

        const openingBalances =
            await prisma.openingBalance.findMany({

                where: {

                    fiscalPeriodId,

                    status: "ACTIVE"

                },

                include: {

                    account: true

                },

                orderBy: {

                    account: {

                        code: "asc"

                    }

                }

            });


        // ------------------------------------------------
        // Calculate Totals
        // ------------------------------------------------

        let totalDebit = 0;

        let totalCredit = 0;


        for (
            const opening of openingBalances
        ) {

            totalDebit +=
                Number(
                    opening.debit || 0
                );

            totalCredit +=
                Number(
                    opening.credit || 0
                );

        }


        // ------------------------------------------------
        // Difference
        // ------------------------------------------------

        const difference =
            totalDebit -
            totalCredit;


        // ------------------------------------------------
        // Balanced Check
        // ------------------------------------------------

        const isBalanced =
            Math.abs(
                difference
            ) < 0.000001;


        // ------------------------------------------------
        // Return Validation Result
        // ------------------------------------------------

        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            openingBalanceCount:
                openingBalances.length,

            totalDebit,

            totalCredit,

            difference,

            isBalanced,

            accounts:
                openingBalances.map(
                    opening => ({

                        openingBalanceId:
                            opening.id,

                        accountId:
                            opening.accountId,

                        code:
                            opening.account.code,

                        name:
                            opening.account.name,

                        debit:
                            Number(
                                opening.debit || 0
                            ),

                        credit:
                            Number(
                                opening.credit || 0
                            )

                    })
                )

        };

    }


    // ==================================================
    // Check Financial History
    // ==================================================

    async hasFinancialHistory(
        fiscalPeriodId
    ) {

        const journalEntryCount =
            await prisma.journalEntry.count({

                where: {
                    fiscalPeriodId
                }

            });


        return journalEntryCount > 0;

    }


    // ==================================================
    // Create Opening Balance
    // ==================================================

    async create(data) {

        // ------------------------------------------------
        // Validate Request Body
        // ------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // ------------------------------------------------
        // Fiscal Period
        // ------------------------------------------------

        const fiscalPeriod =
            await this.validateFiscalPeriod(

                data.fiscalPeriodId

            );


        // ------------------------------------------------
        // Account
        // ------------------------------------------------

        if (!data.accountId) {

            throw new Error(
                "accountId is required"
            );

        }


        await this.validateLeafAccount(

            data.accountId,

            fiscalPeriod.id

        );


        // ------------------------------------------------
        // Amounts
        // ------------------------------------------------

        const debit =
            this.normalizeAmount(
                data.debit
            );


        const credit =
            this.normalizeAmount(
                data.credit
            );


        this.validateAmounts(

            debit,

            credit

        );


        // ------------------------------------------------
        // Duplicate Protection
        // ------------------------------------------------

        const existing =
            await openingBalanceRepository
                .findByFiscalPeriodAndAccount(

                    fiscalPeriod.id,

                    data.accountId

                );


        if (existing) {

            throw new Error(
                "Opening balance already exists for this account and fiscal period"
            );

        }


        // ------------------------------------------------
        // Status
        // ------------------------------------------------

        const status =
            data.status || "ACTIVE";


        const allowedStatuses = [

            "ACTIVE",

            "INACTIVE"

        ];


        if (
            !allowedStatuses.includes(
                status
            )
        ) {

            throw new Error(
                "Invalid opening balance status"
            );

        }


        // ------------------------------------------------
        // Prepare Data
        // ------------------------------------------------

        const createData = {

            fiscalPeriodId:
                fiscalPeriod.id,

            accountId:
                data.accountId,

            debit,

            credit,

            description:
                data.description !== undefined
                    ? data.description
                    : null,

            status

        };


        // ------------------------------------------------
        // Create
        // ------------------------------------------------

        return await openingBalanceRepository.create(

            createData

        );

    }


    // ==================================================
    // Update Opening Balance
    // ==================================================

    async update(
        id,
        data
    ) {

        // ------------------------------------------------
        // Validate ID
        // ------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // ------------------------------------------------
        // Validate Body
        // ------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // ------------------------------------------------
        // Existing Record
        // ------------------------------------------------

        const existing =
            await this.getById(id);


        // ------------------------------------------------
        // Existing Fiscal Period
        // ------------------------------------------------

        const existingFiscalPeriod =
            await this.validateFiscalPeriod(

                existing.fiscalPeriodId

            );


        // ------------------------------------------------
        // Financial History Protection
        // ------------------------------------------------

        const hasHistory =
            await this.hasFinancialHistory(

                existing.fiscalPeriodId

            );


        // ------------------------------------------------
        // Determine Requested Fiscal Period
        // ------------------------------------------------

        const fiscalPeriodId =
            data.fiscalPeriodId !== undefined

                ? data.fiscalPeriodId

                : existing.fiscalPeriodId;


        // ------------------------------------------------
        // Determine Requested Account
        // ------------------------------------------------

        const accountId =
            data.accountId !== undefined

                ? data.accountId

                : existing.accountId;


        // ------------------------------------------------
        // Lifecycle Protection
        // ------------------------------------------------

        if (hasHistory) {

            if (
                fiscalPeriodId !==
                existing.fiscalPeriodId
            ) {

                throw new Error(
                    "Fiscal period cannot be changed because the opening balance has financial history"
                );

            }


            if (
                accountId !==
                existing.accountId
            ) {

                throw new Error(
                    "Account cannot be changed because the opening balance has financial history"
                );

            }


            if (
                data.debit !== undefined ||
                data.credit !== undefined
            ) {

                throw new Error(
                    "Debit and credit cannot be changed because the opening balance has financial history"
                );

            }

        }


        // ------------------------------------------------
        // Validate Target Fiscal Period
        // ------------------------------------------------

        const fiscalPeriod =
            await this.validateFiscalPeriod(

                fiscalPeriodId

            );


        // ------------------------------------------------
        // Validate Target Account
        // ------------------------------------------------

        await this.validateLeafAccount(

            accountId,

            fiscalPeriod.id

        );


        // ------------------------------------------------
        // Amounts
        // ------------------------------------------------

        const debit =
            data.debit !== undefined

                ? this.normalizeAmount(
                    data.debit
                )

                : Number(
                    existing.debit || 0
                );


        const credit =
            data.credit !== undefined

                ? this.normalizeAmount(
                    data.credit
                )

                : Number(
                    existing.credit || 0
                );


        this.validateAmounts(

            debit,

            credit

        );


        // ------------------------------------------------
        // Duplicate Protection
        // ------------------------------------------------

        const accountChanged =
            accountId !== existing.accountId;


        const fiscalPeriodChanged =
            fiscalPeriod.id !==
            existing.fiscalPeriodId;


        if (
            accountChanged ||
            fiscalPeriodChanged
        ) {

            const duplicate =
                await openingBalanceRepository
                    .findByFiscalPeriodAndAccount(

                        fiscalPeriod.id,

                        accountId

                    );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Opening balance already exists for this account and fiscal period"
                );

            }

        }


        // ------------------------------------------------
        // Prepare Update Data
        // ------------------------------------------------

        const updateData = {

            accountId,

            fiscalPeriodId:
                fiscalPeriod.id,

            debit,

            credit

        };


        // ------------------------------------------------
        // Description
        // ------------------------------------------------

        if (
            data.description !== undefined
        ) {

            updateData.description =
                data.description;

        }


        // ------------------------------------------------
        // Status
        // ------------------------------------------------

        if (
            data.status !== undefined
        ) {

            const allowedStatuses = [

                "ACTIVE",

                "INACTIVE"

            ];


            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {

                throw new Error(
                    "Invalid opening balance status"
                );

            }


            updateData.status =
                data.status;

        }


        // ------------------------------------------------
        // Update
        // ------------------------------------------------

        return await openingBalanceRepository.update(

            id,

            updateData

        );

    }


    // ==================================================
    // Delete Opening Balance
    // ==================================================

    async delete(id) {

        // ------------------------------------------------
        // Validate ID
        // ------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // ------------------------------------------------
        // Existing Record
        // ------------------------------------------------

        const existing =
            await this.getById(id);


        // ------------------------------------------------
        // Validate Fiscal Period
        // ------------------------------------------------

        await this.validateFiscalPeriod(

            existing.fiscalPeriodId

        );


        // ------------------------------------------------
        // Financial History Protection
        // ------------------------------------------------

        const hasHistory =
            await this.hasFinancialHistory(

                existing.fiscalPeriodId

            );


        if (hasHistory) {

            throw new Error(
                "Opening balance cannot be deleted because the fiscal period has financial history"
            );

        }


        // ------------------------------------------------
        // Delete
        // ------------------------------------------------

        return await openingBalanceRepository.delete(

            id

        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new OpeningBalanceService();