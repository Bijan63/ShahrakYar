const prisma =
    require("../config/prisma");


class FundRepository {


    // ======================================================
    // Find all Funds
    // ======================================================

    async findAll() {

        return await prisma.fund.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Find Fund by ID
    // ======================================================

    async findById(id) {

        return await prisma.fund.findUnique({

            where: {
                id
            },

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Find Fund by Code
    // ======================================================

    async findByCode(code) {

        return await prisma.fund.findUnique({

            where: {
                code
            },

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Find Active Fund by Code
    // ======================================================

    async findActiveByCode(code) {

        return await prisma.fund.findFirst({

            where: {

                code,

                status: "ACTIVE"

            },

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Create Fund
    // ======================================================

    async create(data) {

        return await prisma.fund.create({

            data,

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Update Fund
    // ======================================================

    async update(id, data) {

        return await prisma.fund.update({

            where: {
                id
            },

            data,

            include: {

                fiscalPeriod: true,

                propertyAccounts: true,

                financialAccounts: true

            }

        });

    }


    // ======================================================
    // Delete Fund
    // ======================================================

    async delete(id) {

        return await prisma.fund.delete({

            where: {
                id
            }

        });

    }

}


module.exports =
    new FundRepository();