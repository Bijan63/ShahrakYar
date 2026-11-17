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
    // Counts configuration dependencies and financial history.
    //
    // Configuration dependencies:
    // - Account
    // - FinancialAccount
    // - Fund
    // - PropertyAccount
    //
    // Financial history:
    // - JournalEntry (all statuses)
    // - OpeningBalance (all statuses)
    // - ChargePayment records linked to this period's
    //   FinancialAccounts
    // - Non-zero FinancialAccount.openingBalance values
    //
    // Configuration-only records do not block changing dates,
    // but they continue to block deleting the fiscal period.
    //
    // ======================================================

    async getUsageCounts(id) {

        const [fiscalPeriod, financialAccounts] =
            await Promise.all([

                prisma.fiscalPeriod.findUnique({

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

                }),

                prisma.financialAccount.findMany({

                    where: {
                        fiscalPeriodId: id
                    },

                    select: {

                        openingBalance: true,

                        _count: {

                            select: {
                                chargePayments: true
                            }

                        }

                    }

                })

            ]);


        if (!fiscalPeriod) {

            return null;

        }


        const chargePayments =
            financialAccounts.reduce(
                (total, financialAccount) =>
                    total + financialAccount._count.chargePayments,
                0
            );


        const nonZeroFinancialAccountOpeningBalances =
            financialAccounts.filter(
                financialAccount =>
                    financialAccount.openingBalance !== null &&
                    financialAccount.openingBalance !== undefined &&
                    Number(financialAccount.openingBalance) !== 0
            ).length;


        return {

            accounts:
                fiscalPeriod._count.accounts,

            financialAccounts:
                fiscalPeriod._count.financialAccounts,

            funds:
                fiscalPeriod._count.funds,

            journalEntries:
                fiscalPeriod._count.journalEntries,

            openingBalances:
                fiscalPeriod._count.openingBalances,

            propertyAccounts:
                fiscalPeriod._count.propertyAccounts,

            chargePayments,

            nonZeroFinancialAccountOpeningBalances

        };

    }

}


module.exports =
    new FiscalPeriodRepository();
