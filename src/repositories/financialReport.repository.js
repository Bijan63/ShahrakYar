const prisma =
    require("../config/prisma");


// ======================================================
// Financial Report Repository
// ======================================================

class FinancialReportRepository {


    // ======================================================
    // Get Fiscal Period
    // ======================================================

    async getFiscalPeriod(
        fiscalPeriodId
    ) {

        return await prisma.fiscalPeriod.findUnique({

            where: {
                id: fiscalPeriodId
            }

        });

    }


    // ======================================================
    // Get Accounts for Trial Balance
    // ======================================================

    async getAccountsForTrialBalance(
        fiscalPeriodId
    ) {

        return await prisma.account.findMany({

            where: {

                fiscalPeriodId

            },

            orderBy: {

                code: "asc"

            },

            include: {

                // ------------------------------------------
                // Opening Balances
                // ------------------------------------------

                openingBalances: {

                    where: {

                        status: "ACTIVE",

                        fiscalPeriodId

                    },

                    select: {

                        id: true,

                        debit: true,

                        credit: true

                    }

                },


                // ------------------------------------------
                // Journal Entry Lines
                // ------------------------------------------

                journalEntryLines: {

                    where: {

                        journalEntry: {

                            status: "POSTED",

                            fiscalPeriodId

                        }

                    },

                    select: {

                        id: true,

                        debit: true,

                        credit: true,

                        journalEntry: {

                            select: {

                                id: true,

                                entryNumber: true,

                                entryDate: true,

                                status: true

                            }

                        }

                    }

                }

            }

        });

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FinancialReportRepository();