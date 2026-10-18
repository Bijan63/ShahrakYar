const prisma =
    require("../config/prisma");


// ======================================================
// Account Ledger Repository
// ======================================================

class AccountLedgerRepository {


    // ======================================================
    // Find Account Ledger
    // ======================================================

    async findByAccountId(
        accountId,
        fiscalPeriodId = null
    ) {

        const where = {

            accountId,

            journalEntry: {

                status: "POSTED"

            }

        };


        // --------------------------------------------------
        // Optional Fiscal Period Filter
        // --------------------------------------------------

        if (fiscalPeriodId) {

            where.journalEntry.fiscalPeriodId =
                fiscalPeriodId;

        }


        // --------------------------------------------------
        // Find Ledger Lines
        // --------------------------------------------------

        return await prisma.journalEntryLine.findMany({

            where,

            orderBy: [

                {
                    journalEntry: {
                        entryDate: "asc"
                    }
                },

                {
                    createdAt: "asc"
                }

            ],

            include: {

                account: true,

                journalEntry: {

                    include: {

                        fiscalPeriod: true

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
    new AccountLedgerRepository();