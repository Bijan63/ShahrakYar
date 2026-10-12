const prisma = require("../config/prisma");


class JournalEntryRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            fiscalPeriod: true,

            fund: true,

            lines: {

                orderBy: {
                    createdAt: "asc"
                },

                include: {

                    account: true

                }

            }

        };

    }


    // ======================================================
    // Find All Journal Entries
    // ======================================================

    async findAll(
        client = prisma
    ) {

        return await client.journalEntry.findMany({

            orderBy: {

                entryDate: "desc"

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Journal Entry by ID
    // ======================================================

    async findById(
        id,
        client = prisma
    ) {

        return await client.journalEntry.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Journal Entry by Entry Number
    // ======================================================

    async findByEntryNumber(
        entryNumber,
        client = prisma
    ) {

        return await client.journalEntry.findUnique({

            where: {
                entryNumber
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Journal Entries by Fiscal Period
    // ======================================================

    async findByFiscalPeriodId(
        fiscalPeriodId,
        client = prisma
    ) {

        return await client.journalEntry.findMany({

            where: {
                fiscalPeriodId
            },

            orderBy: {

                entryDate: "desc"

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Journal Entries by Fund
    // ======================================================

    async findByFundId(
        fundId,
        client = prisma
    ) {

        return await client.journalEntry.findMany({

            where: {
                fundId
            },

            orderBy: {

                entryDate: "desc"

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Create Journal Entry
    // ======================================================

    async create(
        data,
        client = prisma
    ) {

        const {
            lines,
            ...journalEntryData
        } = data;


        return await client.journalEntry.create({

            data: {

                ...journalEntryData,

                lines: {

                    create: lines

                }

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Update Journal Entry
    // ======================================================

    async update(
        id,
        data,
        client = prisma
    ) {

        const {
            lines,
            ...journalEntryData
        } = data;


        // --------------------------------------------------
        // Update without Lines
        // --------------------------------------------------

        if (lines === undefined) {

            return await client.journalEntry.update({

                where: {
                    id
                },

                data: journalEntryData,

                include: this.getInclude()

            });

        }


        // --------------------------------------------------
        // Update with Lines
        // --------------------------------------------------

        const executeUpdate = async (tx) => {

            await tx.journalEntry.update({

                where: {
                    id
                },

                data: journalEntryData

            });


            await tx.journalEntryLine.deleteMany({

                where: {
                    journalEntryId: id
                }

            });


            await tx.journalEntryLine.createMany({

                data: lines.map(line => ({

                    journalEntryId: id,

                    accountId: line.accountId,

                    description:
                        line.description ?? null,

                    debit:
                        line.debit ?? 0,

                    credit:
                        line.credit ?? 0

                }))

            });


            return await tx.journalEntry.findUnique({

                where: {
                    id
                },

                include: this.getInclude()

            });

        };


        // --------------------------------------------------
        // External Transaction Client
        // --------------------------------------------------
        //
        // If caller already provided tx, do NOT create
        // another transaction.
        //

        if (client !== prisma) {

            return await executeUpdate(client);

        }


        // --------------------------------------------------
        // Normal Operation
        // --------------------------------------------------
        //
        // When no external transaction exists, create
        // an internal transaction.
        //

        return await prisma.$transaction(

            async (tx) => {

                return await executeUpdate(tx);

            }

        );

    }


    // ======================================================
    // Atomic Update Journal Entry Status
    // ======================================================
    //
    // Only a DRAFT entry can be transitioned.
    //
    // This prevents concurrent requests from posting
    // the same Journal Entry more than once.
    //

    async updateStatus(
        id,
        status,
        client = prisma
    ) {

        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "Journal entry ID is required"
            );

        }


        // --------------------------------------------------
        // Validate Status
        // --------------------------------------------------

        if (!status) {

            throw new Error(
                "Journal entry status is required"
            );

        }


        // --------------------------------------------------
        // Atomic Status Transition
        // --------------------------------------------------
        //
        // Important:
        //
        // status: "DRAFT"
        //
        // is part of the UPDATE condition.
        //
        // Therefore only one concurrent request can
        // successfully change the status.
        //

        const result =
            await client.journalEntry.updateMany({

                where: {

                    id,

                    status: "DRAFT"

                },

                data: {

                    status

                }

            });


        // --------------------------------------------------
        // No Row Updated
        // --------------------------------------------------

        if (result.count !== 1) {

            throw new Error(
                "Only DRAFT journal entries can be updated"
            );

        }


        // --------------------------------------------------
        // Return Updated Journal Entry
        // --------------------------------------------------

        return await client.journalEntry.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Delete Journal Entry
    // ======================================================

    async delete(
        id,
        client = prisma
    ) {

        return await client.journalEntry.delete({

            where: {
                id
            }

        });

    }

}


module.exports = new JournalEntryRepository();