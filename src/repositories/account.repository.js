const prisma =
    require("../config/prisma");


class AccountRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            fiscalPeriod: true,

            parent: true,

            children: true

        };

    }


    // ======================================================
    // Find All Accounts
    // ======================================================

    async findAll() {

        return await prisma.account.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Account by ID
    // ======================================================

    async findById(id) {

        return await prisma.account.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Account by Code + Fiscal Period
    // ======================================================

    async findByCode(code, fiscalPeriodId) {

        return await prisma.account.findUnique({

            where: {

                fiscalPeriodId_code: {

                    fiscalPeriodId,

                    code

                }

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Active Account by Code + Fiscal Period
    // ======================================================

    async findActiveByCode(code, fiscalPeriodId) {

        return await prisma.account.findFirst({

            where: {

                code,

                fiscalPeriodId,

                isActive: true

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Accounts by Parent ID
    // ======================================================

    async findByParentId(parentId) {

        return await prisma.account.findMany({

            where: {
                parentId
            },

            orderBy: {
                code: "asc"
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find Root Accounts
    // ======================================================

    async findRootAccounts() {

        return await prisma.account.findMany({

            where: {
                parentId: null
            },

            orderBy: {
                code: "asc"
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Create Account
    // ======================================================

    async create(data) {

        return await prisma.account.create({

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Update Account
    // ======================================================

    async update(id, data) {

        return await prisma.account.update({

            where: {
                id
            },

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Delete Account
    // ======================================================

    async delete(id) {

        return await prisma.account.delete({

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
    new AccountRepository();