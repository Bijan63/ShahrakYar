const prisma = require("../config/prisma");

class FiscalPeriodRepository {

    // ======================================================
    // Find All
    // ======================================================

    async findAll() {

        return await prisma.fiscalPeriod.findMany({

            orderBy: {
                startDate: "desc"
            }

        });

    }


    // ======================================================
    // Find By ID
    // ======================================================

    async findById(id) {

        return await prisma.fiscalPeriod.findUnique({

            where: {
                id
            }

        });

    }


    // ======================================================
    // Find By Code
    // ======================================================

    async findByCode(code) {

        return await prisma.fiscalPeriod.findUnique({

            where: {
                code
            }

        });

    }


    // ======================================================
    // Find Active Fiscal Period
    // ======================================================

    async findActive() {

        return await prisma.fiscalPeriod.findFirst({

            where: {
                status: "ACTIVE"
            },

            orderBy: {
                startDate: "desc"
            }

        });

    }


    // ======================================================
    // Create
    // ======================================================

    async create(data) {

        return await prisma.fiscalPeriod.create({

            data

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(id, data) {

        return await prisma.fiscalPeriod.update({

            where: {
                id
            },

            data

        });

    }


    // ======================================================
    // Delete
    // ======================================================

    async delete(id) {

        return await prisma.fiscalPeriod.delete({

            where: {
                id
            }

        });

    }


    // ======================================================
    // Get Usage Counts
    // ======================================================
    //
    // Used by FiscalPeriodService lifecycle rules.
    //
    // We check every model that has a relation to FiscalPeriod:
    //
    // 1. Account
    // 2. FinancialAccount
    // 3. Fund
    // 4. JournalEntry
    // 5. OpeningBalance
    // 6. PropertyAccount
    //
    // ======================================================

    async getUsageCounts(id) {

        const fiscalPeriod = await prisma.fiscalPeriod.findUnique({

            where: {
                id
            },

            select: {

                _count: {

                    select: {

                        accounts: true,

                        financialAccounts: true,

                        funds: true,

                        journalEntries: true,

                        openingBalances: true,

                        propertyAccounts: true

                    }

                }

            }

        });


        if (!fiscalPeriod) {

            return null;

        }


        return {

            accounts: fiscalPeriod._count.accounts,

            financialAccounts: fiscalPeriod._count.financialAccounts,

            funds: fiscalPeriod._count.funds,

            journalEntries: fiscalPeriod._count.journalEntries,

            openingBalances: fiscalPeriod._count.openingBalances,

            propertyAccounts: fiscalPeriod._count.propertyAccounts

        };

    }

}


module.exports = new FiscalPeriodRepository();