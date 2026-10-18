const prisma =
    require("../config/prisma");


// ======================================================
// Accounting Configuration Repository
// ======================================================

class AccountingConfigurationRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            fiscalPeriod: true,

            chargeReceivableAccount: true,

            chargeRevenueAccount: true

        };

    }


    // ======================================================
    // Find All
    // ======================================================

    async findAll(client = prisma) {

        return await client.accountingConfiguration.findMany({

            include: this.getInclude(),

            orderBy: {
                createdAt: "desc"
            }

        });

    }


    // ======================================================
    // Find By ID
    // ======================================================

    async findById(
        id,
        client = prisma
    ) {

        return await client.accountingConfiguration.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find By Fiscal Period
    // ======================================================

    async findByFiscalPeriodId(
        fiscalPeriodId,
        client = prisma
    ) {

        return await client.accountingConfiguration.findUnique({

            where: {
                fiscalPeriodId
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Create
    // ======================================================

    async create(
        data,
        client = prisma
    ) {

        return await client.accountingConfiguration.create({

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(
        id,
        data,
        client = prisma
    ) {

        return await client.accountingConfiguration.update({

            where: {
                id
            },

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Delete
    // ======================================================

    async delete(
        id,
        client = prisma
    ) {

        return await client.accountingConfiguration.delete({

            where: {
                id
            }

        });

    }

}


module.exports =
    new AccountingConfigurationRepository();