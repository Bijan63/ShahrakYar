const prisma =
    require("../config/prisma");


class ChargePaymentRepository {


    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            // --------------------------------------------------
            // Unit Account
            // --------------------------------------------------

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


            // --------------------------------------------------
            // Charge
            // --------------------------------------------------

            charge: true,


            // --------------------------------------------------
            // Resident
            // --------------------------------------------------

            resident: {

                include: {

                    person: true

                }

            },


            // --------------------------------------------------
            // Financial Account
            // --------------------------------------------------

            financialAccount: {

                include: {

                    account: true,

                    fiscalPeriod: true,

                    fund: true

                }

            },


            // --------------------------------------------------
            // Journal Entry
            // --------------------------------------------------

            journalEntry: {

                include: {

                    fiscalPeriod: true,

                    fund: true,

                    lines: {

                        orderBy: {

                            createdAt:
                                "asc"

                        },

                        include: {

                            account: true

                        }

                    }

                }

            }

        };

    }


    // ======================================================
    // Create
    // ======================================================

    async create(data) {

        return await prisma.chargePayment.create({

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Find By ID
    // ======================================================

    async findById(id) {

        return await prisma.chargePayment.findUnique({

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

        return await prisma.chargePayment.findMany({

            where: {

                unitAccountId

            },

            include:
                this.getInclude(),

            orderBy: [

                {

                    paymentDate:
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
    // Find By Charge
    // ======================================================

    async findByChargeId(
        chargeId
    ) {

        return await prisma.chargePayment.findMany({

            where: {

                chargeId

            },

            include:
                this.getInclude(),

            orderBy: [

                {

                    paymentDate:
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

        return await prisma.chargePayment.findMany({

            include:
                this.getInclude(),

            orderBy: [

                {

                    paymentDate:
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
    // Create With Transaction Client
    // ======================================================

    async createWithClient(
        client,
        data
    ) {

        return await client.chargePayment.create({

            data,

            include:
                this.getInclude()

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(
        id,
        data
    ) {

        return await prisma.chargePayment.update({

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

        return await prisma.chargePayment.delete({

            where: {

                id

            }

        });

    }

}


module.exports =
    new ChargePaymentRepository();