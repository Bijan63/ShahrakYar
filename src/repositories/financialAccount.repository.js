const prisma =
    require("../config/prisma");


// ======================================================
// Financial Account Repository
// ======================================================

class FinancialAccountRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            fiscalPeriod: true,

            fund: true,

            account: true

        };

    }


    // ======================================================
    // Find All Financial Accounts
    // ======================================================

    async findAll() {

        return await prisma.financialAccount.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Financial Account by ID
    // ======================================================

    async findById(id) {

        return await prisma.financialAccount.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Financial Account by Code
    // ======================================================

    async findByCode(code) {

        return await prisma.financialAccount.findUnique({

            where: {
                code
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Active Financial Account by Code
    // ======================================================

    async findActiveByCode(code) {

        return await prisma.financialAccount.findFirst({

            where: {

                code,

                status: "ACTIVE"

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Financial Account by Account ID
    // ======================================================
    //
    // accountId is UNIQUE in FinancialAccount.
    //
    // Therefore findUnique() is used instead of findFirst().
    //
    // ======================================================

    async findByAccountId(accountId) {

        return await prisma.financialAccount.findUnique({

            where: {
                accountId
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Create Financial Account
    // ======================================================

    async create(data) {

        return await prisma.financialAccount.create({

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Update Financial Account
    // ======================================================

    async update(id, data) {

        return await prisma.financialAccount.update({

            where: {
                id
            },

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Delete Financial Account
    // ======================================================

    async delete(id) {

        return await prisma.financialAccount.delete({

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
    new FinancialAccountRepository();