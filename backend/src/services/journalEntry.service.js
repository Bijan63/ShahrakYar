const journalEntryRepository =
    require("../repositories/journalEntry.repository");

const prisma =
    require("../config/prisma");


// ======================================================
// Journal Entry Service
// ======================================================

class JournalEntryService {


    // ======================================================
    // Validate Posting Account
    // ======================================================

    async validatePostingAccount(
        accountId,
        fiscalPeriodId,
        client = prisma
    ) {

        const account =
            await client.account.findUnique({

                where: {
                    id: accountId
                },

                include: {

                    children: {

                        select: {
                            id: true
                        }

                    }

                }

            });


        if (!account) {

            throw new Error(
                `Account not found: ${accountId}`
            );

        }


        // --------------------------------------------------
        // Account must be Active
        // --------------------------------------------------

        if (!account.isActive) {

            throw new Error(
                `Account is inactive: ${account.code}`
            );

        }


        // --------------------------------------------------
        // Account must belong to Fiscal Period
        // --------------------------------------------------

        if (
            account.fiscalPeriodId !==
            fiscalPeriodId
        ) {

            throw new Error(
                `Account ${account.code} does not belong to the journal entry fiscal period`
            );

        }


        // --------------------------------------------------
        // Account must be Leaf
        // --------------------------------------------------

        if (
            account.children &&
            account.children.length > 0
        ) {

            throw new Error(
                `Journal entry can only be posted to a leaf account: ${account.code}`
            );

        }


        return account;

    }


    // ======================================================
    // Get All Journal Entries
    // ======================================================

    async getAll() {

        return await journalEntryRepository.findAll();

    }


    // ======================================================
    // Get Journal Entry by ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const journalEntry =
            await journalEntryRepository.findById(
                id
            );


        if (!journalEntry) {

            throw new Error(
                "Journal entry not found"
            );

        }


        return journalEntry;

    }


    // ======================================================
    // Get Journal Entry by Entry Number
    // ======================================================

    async getByEntryNumber(entryNumber) {

        if (!entryNumber) {

            throw new Error(
                "entryNumber is required"
            );

        }


        const journalEntry =
            await journalEntryRepository.findByEntryNumber(
                entryNumber
            );


        if (!journalEntry) {

            throw new Error(
                "Journal entry not found"
            );

        }


        return journalEntry;

    }


    // ======================================================
    // Get Journal Entries by Fiscal Period
    // ======================================================

    async getByFiscalPeriod(
        fiscalPeriodId
    ) {

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        return await journalEntryRepository.findByFiscalPeriodId(
            fiscalPeriodId
        );

    }


    // ======================================================
    // Get Journal Entries by Fund
    // ======================================================

    async getByFund(fundId) {

        if (!fundId) {

            throw new Error(
                "fundId is required"
            );

        }


        return await journalEntryRepository.findByFundId(
            fundId
        );

    }


    // ======================================================
    // Create Journal Entry
    // ======================================================
    //
    // Normal operation.
    //
    // Delegates to createWithClient() so that both normal
    // and transactional creation use exactly the same
    // validation rules.
    //

    async create(data) {

        return await this.createWithClient(
            data,
            prisma
        );

    }


    // ======================================================
    // Create Journal Entry with Transaction Client
    // ======================================================
    //
    // This method is used when JournalEntry creation is part
    // of a larger transaction, such as ChargePayment.
    //
    // IMPORTANT:
    //
    // Every database read and write in this method uses
    // the supplied client.
    //
    // Therefore when client === tx, all operations belong
    // to the caller's transaction.
    //

    async createWithClient(
        data,
        client = prisma
    ) {


        // --------------------------------------------------
        // Validate Request Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Entry Number
        // --------------------------------------------------

        if (!data.entryNumber) {

            throw new Error(
                "entryNumber is required"
            );

        }


        // --------------------------------------------------
        // Entry Date
        // --------------------------------------------------

        if (!data.entryDate) {

            throw new Error(
                "entryDate is required"
            );

        }


        const entryDate =
            new Date(data.entryDate);


        if (
            Number.isNaN(
                entryDate.getTime()
            )
        ) {

            throw new Error(
                "Invalid entryDate"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (!data.fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: data.fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be created in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Entry Date vs Fiscal Period
        // --------------------------------------------------

        if (
            entryDate < fiscalPeriod.startDate ||
            entryDate > fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        if (
            data.fundId !== undefined &&
            data.fundId !== null &&
            data.fundId !== ""
        ) {

            const fund =
                await client.fund.findUnique({

                    where: {
                        id: data.fundId
                    }

                });


            if (!fund) {

                throw new Error(
                    "Fund not found"
                );

            }


            if (
                fund.fiscalPeriodId &&
                fund.fiscalPeriodId !==
                data.fiscalPeriodId
            ) {

                throw new Error(
                    "Fund does not belong to the selected fiscal period"
                );

            }

        }


        // --------------------------------------------------
        // Duplicate Entry Number
        // --------------------------------------------------

        const existing =
            await journalEntryRepository.findByEntryNumber(
                data.entryNumber,
                client
            );


        if (existing) {

            throw new Error(
                "Entry number already exists"
            );

        }


        // --------------------------------------------------
        // Lines
        // --------------------------------------------------

        if (
            !Array.isArray(data.lines) ||
            data.lines.length < 2
        ) {

            throw new Error(
                "Journal entry must have at least two lines"
            );

        }


        let totalDebit = 0;
        let totalCredit = 0;


        // --------------------------------------------------
        // Validate Lines
        // --------------------------------------------------

        for (
            const line of data.lines
        ) {

            if (!line) {

                throw new Error(
                    "Invalid journal entry line"
                );

            }


            // ----------------------------------------------
            // Account
            // ----------------------------------------------

            if (!line.accountId) {

                throw new Error(
                    "accountId is required for every journal entry line"
                );

            }


            await this.validatePostingAccount(

                line.accountId,

                data.fiscalPeriodId,

                client

            );


            // ----------------------------------------------
            // Debit
            // ----------------------------------------------

            const debit =
                line.debit !== undefined &&
                line.debit !== null
                    ? Number(line.debit)
                    : 0;


            // ----------------------------------------------
            // Credit
            // ----------------------------------------------

            const credit =
                line.credit !== undefined &&
                line.credit !== null
                    ? Number(line.credit)
                    : 0;


            // ----------------------------------------------
            // Number Validation
            // ----------------------------------------------

            if (
                !Number.isFinite(debit) ||
                !Number.isFinite(credit)
            ) {

                throw new Error(
                    "Debit and credit must be valid numbers"
                );

            }


            // ----------------------------------------------
            // Negative Validation
            // ----------------------------------------------

            if (
                debit < 0 ||
                credit < 0
            ) {

                throw new Error(
                    "Debit and credit cannot be negative"
                );

            }


            // ----------------------------------------------
            // Debit + Credit
            // ----------------------------------------------

            if (
                debit > 0 &&
                credit > 0
            ) {

                throw new Error(
                    "A journal entry line cannot have both debit and credit"
                );

            }


            // ----------------------------------------------
            // Empty Line
            // ----------------------------------------------

            if (
                debit === 0 &&
                credit === 0
            ) {

                throw new Error(
                    "A journal entry line must have debit or credit amount"
                );

            }


            totalDebit += debit;
            totalCredit += credit;

        }


        // --------------------------------------------------
        // Validate Balance
        // --------------------------------------------------

        const difference =
            Math.abs(
                totalDebit -
                totalCredit
            );


        if (
            difference > 0.000001
        ) {

            throw new Error(
                `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );

        }


        // --------------------------------------------------
        // Prepare Lines
        // --------------------------------------------------

        const lines =
            data.lines.map(
                (line) => ({

                    accountId:
                        line.accountId,

                    description:
                        line.description || null,

                    debit:
                        line.debit !== undefined &&
                        line.debit !== null
                            ? line.debit
                            : 0,

                    credit:
                        line.credit !== undefined &&
                        line.credit !== null
                            ? line.credit
                            : 0

                })
            );


        // --------------------------------------------------
        // Prepare Journal Entry
        // --------------------------------------------------

        const createData = {

            entryNumber:
                data.entryNumber,

            entryDate,

            description:
                data.description || null,

            status:
                "DRAFT",

            fiscalPeriodId:
                data.fiscalPeriodId,

            fundId:
                data.fundId || null,

            lines

        };


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await journalEntryRepository.create(
            createData,
            client
        );

    }


    // ======================================================
    // Update Journal Entry
    // ======================================================

    async update(
        id,
        data
    ) {


        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Validate Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Existing Journal Entry
        // --------------------------------------------------

        const existing =
            await this.getById(id);


        // --------------------------------------------------
        // Journal Entry Status Protection
        // --------------------------------------------------

        if (
            existing.status !== "DRAFT"
        ) {

            throw new Error(
                "Only DRAFT journal entries can be modified"
            );

        }


        const updateData = {};


        // --------------------------------------------------
        // Entry Number
        // --------------------------------------------------

        if (
            data.entryNumber !== undefined
        ) {

            if (!data.entryNumber) {

                throw new Error(
                    "entryNumber is required"
                );

            }


            const duplicate =
                await journalEntryRepository.findByEntryNumber(
                    data.entryNumber
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Entry number already exists"
                );

            }


            updateData.entryNumber =
                data.entryNumber;

        }


        // --------------------------------------------------
        // Entry Date
        // --------------------------------------------------

        let newEntryDate =
            existing.entryDate;


        if (
            data.entryDate !== undefined
        ) {

            newEntryDate =
                new Date(data.entryDate);


            if (
                Number.isNaN(
                    newEntryDate.getTime()
                )
            ) {

                throw new Error(
                    "Invalid entryDate"
                );

            }


            updateData.entryDate =
                newEntryDate;

        }


        // --------------------------------------------------
        // Description
        // --------------------------------------------------

        if (
            data.description !== undefined
        ) {

            updateData.description =
                data.description;

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (
            data.status !== undefined
        ) {

            if (
                data.status === "POSTED"
            ) {

                throw new Error(
                    "Journal entry must be posted using the post operation"
                );

            }


            const allowedStatuses = [

                "DRAFT",

                "CANCELLED"

            ];


            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {

                throw new Error(
                    "Invalid journal entry status"
                );

            }


            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        const fiscalPeriodId =
            existing.fiscalPeriodId;


        // --------------------------------------------------
        // Prevent Fiscal Period Change
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined &&
            data.fiscalPeriodId !==
            existing.fiscalPeriodId
        ) {

            throw new Error(
                "Journal entry fiscal period cannot be changed"
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

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


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be modified in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Entry Date vs Fiscal Period
        // --------------------------------------------------

        if (
            newEntryDate < fiscalPeriod.startDate ||
            newEntryDate > fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        if (
            data.fundId !== undefined
        ) {

            if (
                data.fundId === null ||
                data.fundId === ""
            ) {

                updateData.fundId =
                    null;

            }
            else {

                const fund =
                    await prisma.fund.findUnique({

                        where: {
                            id: data.fundId
                        }

                    });


                if (!fund) {

                    throw new Error(
                        "Fund not found"
                    );

                }


                if (
                    fund.fiscalPeriodId &&
                    fund.fiscalPeriodId !==
                    fiscalPeriodId
                ) {

                    throw new Error(
                        "Fund does not belong to the selected fiscal period"
                    );

                }


                updateData.fundId =
                    data.fundId;

            }

        }


        // --------------------------------------------------
        // Lines
        // --------------------------------------------------

        if (
            data.lines !== undefined
        ) {

            if (
                !Array.isArray(data.lines) ||
                data.lines.length < 2
            ) {

                throw new Error(
                    "Journal entry must have at least two lines"
                );

            }


            let totalDebit = 0;
            let totalCredit = 0;


            // ------------------------------------------------
            // Validate Lines
            // ------------------------------------------------

            for (
                const line of data.lines
            ) {

                if (!line) {

                    throw new Error(
                        "Invalid journal entry line"
                    );

                }


                if (!line.accountId) {

                    throw new Error(
                        "accountId is required for every journal entry line"
                    );

                }


                await this.validatePostingAccount(

                    line.accountId,

                    fiscalPeriodId

                );


                const debit =
                    line.debit !== undefined &&
                    line.debit !== null
                        ? Number(line.debit)
                        : 0;


                const credit =
                    line.credit !== undefined &&
                    line.credit !== null
                        ? Number(line.credit)
                        : 0;


                if (
                    !Number.isFinite(debit) ||
                    !Number.isFinite(credit)
                ) {

                    throw new Error(
                        "Debit and credit must be valid numbers"
                    );

                }


                if (
                    debit < 0 ||
                    credit < 0
                ) {

                    throw new Error(
                        "Debit and credit cannot be negative"
                    );

                }


                if (
                    debit > 0 &&
                    credit > 0
                ) {

                    throw new Error(
                        "A journal entry line cannot have both debit and credit"
                    );

                }


                if (
                    debit === 0 &&
                    credit === 0
                ) {

                    throw new Error(
                        "A journal entry line must have debit or credit amount"
                    );

                }


                totalDebit += debit;
                totalCredit += credit;

            }


            // ------------------------------------------------
            // Validate Balance
            // ------------------------------------------------

            const difference =
                Math.abs(
                    totalDebit -
                    totalCredit
                );


            if (
                difference > 0.000001
            ) {

                throw new Error(
                    `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
                );

            }


            // ------------------------------------------------
            // Prepare Lines
            // ------------------------------------------------

            updateData.lines =
                data.lines.map(
                    (line) => ({

                        accountId:
                            line.accountId,

                        description:
                            line.description || null,

                        debit:
                            line.debit !== undefined &&
                            line.debit !== null
                                ? line.debit
                                : 0,

                        credit:
                            line.credit !== undefined &&
                            line.credit !== null
                                ? line.credit
                                : 0

                    })
                );

        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        return await journalEntryRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Post Journal Entry
    // ======================================================

    async post(id) {

        return await this.postWithClient(
            id,
            prisma
        );

    }


    // ======================================================
    // Post Journal Entry with Transaction Client
    // ======================================================

    async postWithClient(
        id,
        client = prisma
    ) {


        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Find Journal Entry
        // --------------------------------------------------

        const existing =
            await journalEntryRepository.findById(
                id,
                client
            );


        if (!existing) {

            throw new Error(
                "Journal entry not found"
            );

        }


        // --------------------------------------------------
        // Journal Entry must be DRAFT
        // --------------------------------------------------

        if (
            existing.status !== "DRAFT"
        ) {

            throw new Error(
                "Only DRAFT journal entries can be posted"
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: existing.fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be posted in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Validate Entry Date
        // --------------------------------------------------

        if (
            existing.entryDate <
            fiscalPeriod.startDate ||
            existing.entryDate >
            fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }


        // --------------------------------------------------
        // Validate Lines
        // --------------------------------------------------

        if (
            !Array.isArray(existing.lines) ||
            existing.lines.length < 2
        ) {

            throw new Error(
                "Journal entry must have at least two lines"
            );

        }


        let totalDebit = 0;
        let totalCredit = 0;


        // --------------------------------------------------
        // Validate Each Line
        // --------------------------------------------------

        for (
            const line of existing.lines
        ) {

            if (!line.accountId) {

                throw new Error(
                    "accountId is required for every journal entry line"
                );

            }


            await this.validatePostingAccount(

                line.accountId,

                existing.fiscalPeriodId,

                client

            );


            const debit =
                Number(line.debit || 0);


            const credit =
                Number(line.credit || 0);


            if (
                !Number.isFinite(debit) ||
                !Number.isFinite(credit)
            ) {

                throw new Error(
                    "Debit and credit must be valid numbers"
                );

            }


            if (
                debit < 0 ||
                credit < 0
            ) {

                throw new Error(
                    "Debit and credit cannot be negative"
                );

            }


            if (
                debit > 0 &&
                credit > 0
            ) {

                throw new Error(
                    "A journal entry line cannot have both debit and credit"
                );

            }


            if (
                debit === 0 &&
                credit === 0
            ) {

                throw new Error(
                    "A journal entry line must have debit or credit amount"
                );

            }


            totalDebit += debit;
            totalCredit += credit;

        }


        // --------------------------------------------------
        // Validate Balance
        // --------------------------------------------------

        const difference =
            Math.abs(
                totalDebit -
                totalCredit
            );


        if (
            difference > 0.000001
        ) {

            throw new Error(
                `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );

        }


        // --------------------------------------------------
        // Post Journal Entry
        // --------------------------------------------------

        return await journalEntryRepository.updateStatus(

            id,

            "POSTED",

            client

        );

    }


    // ======================================================
    // Delete Journal Entry
    // ======================================================

    async delete(id) {


        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const existing =
            await this.getById(id);


        // --------------------------------------------------
        // Posted Protection
        // --------------------------------------------------

        if (
            existing.status === "POSTED"
        ) {

            throw new Error(
                "Posted journal entry cannot be deleted"
            );

        }


        return await journalEntryRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new JournalEntryService();