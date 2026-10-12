const prisma =
    require("../config/prisma");


class ChargeRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            unitAccount: {

                include: {

                    unit: {

                        include: {

                            building: true,

                            property: true

                        }

                    }

                }

            },

            payments: {

                include: {

                    resident: true

                },

                orderBy: {

                    paymentDate:
                        "desc"

                }

            }

        };

    }


    // ======================================================
    // Create
    // ======================================================

    async create(data) {

        return await prisma.charge.create({

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Create With Transaction Client
    // ======================================================

    async createWithClient(
        client,
        data
    ) {

        return await client.charge.create({

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Find By ID
    // ======================================================

    async findById(id) {

        return await prisma.charge.findUnique({

            where: {
                id
            },

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Find By Unit Account
    // ======================================================

    async findByUnitAccountId(
        unitAccountId
    ) {

        return await prisma.charge.findMany({

            where: {

                unitAccountId

            },

            include:
                this.getInclude(),

            orderBy: [

                {

                    issueDate:
                        "desc"

                },

                {

                    createdAt:
                        "desc"

                }

            ]

        });

    }


    // ======================================================
    // Find All
    // ======================================================

    async findAll() {

        return await prisma.charge.findMany({

            include:
                this.getInclude(),

            orderBy: [

                {

                    issueDate:
                        "desc"

                },

                {

                    createdAt:
                        "desc"

                }

            ]

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(
        id,
        data
    ) {

        return await prisma.charge.update({

            where: {

                id

            },

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Update With Transaction Client
    // ======================================================

    async updateWithClient(
        client,
        id,
        data
    ) {

        return await client.charge.update({

            where: {

                id

            },

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Delete
    // ======================================================

    async delete(id) {

        return await prisma.charge.delete({

            where: {

                id

            }

        });

    }

}


module.exports =
    new ChargeRepository();