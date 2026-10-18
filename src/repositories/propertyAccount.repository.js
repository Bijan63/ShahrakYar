const prisma =
    require("../config/prisma");


class PropertyAccountRepository {

    // ======================================================
    // Find All Property Accounts
    // ======================================================

    async findAll() {

        return await prisma.propertyAccount.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: {

                fiscalPeriod: true,

                fund: true

            }

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

            include: {

                fiscalPeriod: true,

                fund: true

            }

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

            include: {

                fiscalPeriod: true,

                fund: true

            }

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
    // Create Property Account
    // ======================================================

    async create(data) {

        return await prisma.propertyAccount.create({

            data,

            include: {

                fiscalPeriod: true,

                fund: true

            }

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

            include: {

                fiscalPeriod: true,

                fund: true

            }

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