
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

    async findAll(client = prisma) {

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

    async findById(id, client = prisma) {

        return await client.journalEntry.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }

    // ======================================================
    // Lock Journal Entry for Posting
    // ======================================================

    async lockById(id, client = prisma) {

        if (!id) {

            throw new Error(
                "Journal entry ID is required"
            );

        }

        const rows =
            await client.$queryRaw`

                SELECT "id"

                FROM "JournalEntry"

                WHERE "id" = ${id}

                FOR UPDATE

            `;

        return rows.length === 1;

    }

    // ======================================================
    // Find Journal Entry by Entry Number
    // ======================================================

    async findByEntryNumber(entryNumber, client = prisma) {

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

    async findByFiscalPeriodId(fiscalPeriodId, client = prisma) {

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

    async findByFundId(fundId, client = prisma) {

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

    async create(data, client = prisma) {

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
    //
    // Only DRAFT entries can be modified.
    //
    // The status condition is checked atomically
    // by the database, not only by the service.
    //
    // This protects against concurrent posting.
    //

    async update(id, data, client = prisma) {

        if (!id) {

            throw new Error(
                "Journal entry ID is required"
            );

        }


        const {
            lines,
            ...journalEntryData
        } = data;


        const executeUpdate = async (tx) => {

            // --------------------------------------------------
            // Atomic DRAFT Protection
            // --------------------------------------------------

            const result =
                await tx.journalEntry.updateMany({

                    where: {

                        id,

                        status: "DRAFT"

                    },

                    data: journalEntryData

                });


            if (result.count !== 1) {

                throw new Error(
                    "Only DRAFT journal entries can be modified"
                );

            }


            // --------------------------------------------------
            // Replace Lines When Supplied
            // --------------------------------------------------

            if (lines !== undefined) {

                await tx.journalEntryLine.deleteMany({

                    where: {
                        journalEntryId: id
                    }

                });


                if (lines.length > 0) {

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

                }

            }


            // --------------------------------------------------
            // Return Updated Entry
            // --------------------------------------------------

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

        if (client !== prisma) {

            return await executeUpdate(client);

        }


        // --------------------------------------------------
        // Internal Transaction
        // --------------------------------------------------

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
    // Only DRAFT entries can change status.
    //

    async updateStatus(id, status, client = prisma) {

        if (!id) {

            throw new Error(
                "Journal entry ID is required"
            );

        }


        if (!status) {

            throw new Error(
                "Journal entry status is required"
            );

        }


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


        if (result.count !== 1) {

            throw new Error(
                "Only DRAFT journal entries can be updated"
            );

        }


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
    //
    // Only DRAFT entries can be deleted.
    //
    // POSTED and CANCELLED entries are preserved.
    //
    // The condition is enforced atomically by the database.
    //

    async delete(id, client = prisma) {

        if (!id) {

            throw new Error(
                "Journal entry ID is required"
            );

        }


        const executeDelete = async (tx) => {

            // --------------------------------------------------
            // Find Existing Entry
            // --------------------------------------------------

            const existing =
                await tx.journalEntry.findUnique({

                    where: {
                        id
                    }

                });


            if (!existing) {

                throw new Error(
                    "Journal entry not found"
                );

            }


            // --------------------------------------------------
            // Atomic DRAFT-Only Deletion
            // --------------------------------------------------

            const result =
                await tx.journalEntry.deleteMany({

                    where: {

                        id,

                        status: "DRAFT"

                    }

                });


            if (result.count !== 1) {

                throw new Error(
                    "Only DRAFT journal entries can be deleted"
                );

            }


            return existing;

        };


        // --------------------------------------------------
        // External Transaction Client
        // --------------------------------------------------

        if (client !== prisma) {

            return await executeDelete(client);

        }


        // --------------------------------------------------
        // Internal Transaction
        // --------------------------------------------------

        return await prisma.$transaction(

            async (tx) => {

                return await executeDelete(tx);

            }

        );

    }

}


module.exports = new JournalEntryRepository();
