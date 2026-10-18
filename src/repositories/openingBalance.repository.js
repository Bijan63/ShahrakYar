const prisma =
    require("../config/prisma");


// ======================================================
// Opening Balance Repository
// ======================================================

class OpeningBalanceRepository {


    // ==================================================
    // Find All Opening Balances
    // ==================================================

    async findAll() {

        return await prisma.openingBalance.findMany({

            orderBy: {
                createdAt: "asc"
            },

            include: {

                fiscalPeriod: true,

                account: {

                    include: {

                        parent: true

                    }

                }

            }

        });

    }


    // ==================================================
    // Find Opening Balance by ID
    // ==================================================

    async findById(id) {

        return await prisma.openingBalance.findUnique({

            where: {
                id
            },

            include: {

                fiscalPeriod: true,

                account: {

                    include: {

                        parent: true,

                        children: true

                    }

                }

            }

        });

    }


    // ==================================================
    // Find by Fiscal Period ID
    // ==================================================

    async findByFiscalPeriodId(
        fiscalPeriodId
    ) {

        return await prisma.openingBalance.findMany({

            where: {
                fiscalPeriodId
            },

            orderBy: {

                account: {

                    code: "asc"

                }

            },

            include: {

                fiscalPeriod: true,

                account: true

            }

        });

    }


    // ==================================================
    // Find by Account ID
    // ==================================================

    async findByAccountId(
        accountId
    ) {

        return await prisma.openingBalance.findMany({

            where: {
                accountId
            },

            orderBy: {

                createdAt: "asc"

            },

            include: {

                fiscalPeriod: true,

                account: true

            }

        });

    }


    // ==================================================
    // Find by Fiscal Period + Account
    // ==================================================

    async findByFiscalPeriodAndAccount(
        fiscalPeriodId,
        accountId
    ) {

        return await prisma.openingBalance.findUnique({

            where: {

                fiscalPeriodId_accountId: {

                    fiscalPeriodId,

                    accountId

                }

            },

            include: {

                fiscalPeriod: true,

                account: true

            }

        });

    }


    // ==================================================
    // Create Opening Balance
    // ==================================================

    async create(data) {

        return await prisma.openingBalance.create({

            data,

            include: {

                fiscalPeriod: true,

                account: true

            }

        });

    }


    // ==================================================
    // Update Opening Balance
    // ==================================================

    async update(
        id,
        data
    ) {

        return await prisma.openingBalance.update({

            where: {
                id
            },

            data,

            include: {

                fiscalPeriod: true,

                account: true

            }

        });

    }


    // ==================================================
    // Delete Opening Balance
    // ==================================================

    async delete(id) {

        return await prisma.openingBalance.delete({

            where: {
                id
            }

        });

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new OpeningBalanceRepository();