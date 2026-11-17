"use strict";

const prisma =
    require("../config/prisma");


const fundRelations = {

    fiscalPeriod: true,

    propertyAccounts: true,

    financialAccounts: true

};


class FundRepository {


    // ======================================================
    // Find All Funds
    // ======================================================

    async findAll() {

        return await prisma.fund.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: fundRelations

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

            include: fundRelations

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

            include: fundRelations

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

            include: fundRelations

        });

    }


    // ======================================================
    // Find Fiscal Period by ID
    // ======================================================

    async findFiscalPeriodById(id) {

        return await prisma.fiscalPeriod.findUnique({

            where: {
                id
            },

            select: {

                id: true,

                code: true,

                name: true,

                status: true

            }

        });

    }


    // ======================================================
    // Get Fund Usage Counts
    // ======================================================

    async getUsageCounts(id) {

        return await prisma.fund.findUnique({

            where: {
                id
            },

            select: {

                _count: {

                    select: {

                        propertyAccounts: true,

                        financialAccounts: true,

                        journalEntries: true

                    }

                }

            }

        });

    }


    // ======================================================
    // Create Fund
    // ======================================================

    async create(data) {

        return await prisma.fund.create({

            data,

            include: fundRelations

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

            include: fundRelations

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


// ======================================================
// Export
// ======================================================

module.exports =
    new FundRepository();