"use strict";

const prisma =
    require("../config/prisma");


const propertyAccountRelations = {

    fiscalPeriod: true,

    fund: true

};


class PropertyAccountRepository {


    // ======================================================
    // Find All Property Accounts
    // ======================================================

    async findAll() {

        return await prisma.propertyAccount.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: propertyAccountRelations

        });

    }


    // ======================================================
    // Find Property Account by ID
    // ======================================================

    async findById(id) {

        return await prisma.propertyAccount.findUnique({

            where: {
                id
            },

            include: propertyAccountRelations

        });

    }


    // ======================================================
    // Find Property Account by Property ID
    // ======================================================

    async findByPropertyId(propertyId) {

        return await prisma.propertyAccount.findUnique({

            where: {
                propertyId
            },

            include: propertyAccountRelations

        });

    }


    // ======================================================
    // Find Property Account by Account Number
    // ======================================================

    async findByAccountNumber(accountNumber) {

        return await prisma.propertyAccount.findUnique({

            where: {
                accountNumber
            }

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
    // Find Fund by ID
    // ======================================================

    async findFundById(id) {

        return await prisma.fund.findUnique({

            where: {
                id
            },

            select: {

                id: true,

                code: true,

                name: true,

                status: true,

                fiscalPeriodId: true

            }

        });

    }


    // ======================================================
    // Get Property Account Usage Counts
    // ======================================================

    async getUsageCounts(id) {

        // Assumption:
        // ChargePayment.unitAccountId stores PropertyAccount.id.

        const chargePayments =
            await prisma.chargePayment.count({

                where: {
                    unitAccountId: id
                }

            });


        return {

            chargePayments

        };

    }


    // ======================================================
    // Create Property Account
    // ======================================================

    async create(data) {

        return await prisma.propertyAccount.create({

            data,

            include: propertyAccountRelations

        });

    }


    // ======================================================
    // Update Property Account
    // ======================================================

    async update(id, data) {

        return await prisma.propertyAccount.update({

            where: {
                id
            },

            data,

            include: propertyAccountRelations

        });

    }


    // ======================================================
    // Delete Property Account
    // ======================================================

    async delete(id) {

        return await prisma.propertyAccount.delete({

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
    new PropertyAccountRepository();