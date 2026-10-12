const prisma =
    require("../config/prisma");

class UnitAccountRepository {

    // ======================================================
    // Include
    // ======================================================

    getInclude() {

        return {

            unit: {

                include: {

                    building: true,

                    property: true,

                    residents: {

                        include: {

                            person: true,

                            user: {

                                select: {

                                    id: true,
                                    fullName: true,
                                    email: true,
                                    role: true,
                                    status: true,
                                    personId: true,
                                    createdAt: true,
                                    updatedAt: true

                                }

                            }

                        }

                    }

                }

            },

            charges: {

                orderBy: {

                    issueDate: "desc"

                }

            },

            payments: {

                include: {

                    resident: true,

                    charge: true

                },

                orderBy: {

                    paymentDate: "desc"

                }

            }

        };

    }


    // ======================================================
    // Create
    // ======================================================

    async create(data) {

        return await prisma.unitAccount.create({

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find By ID
    // ======================================================

    async findById(id) {

        return await prisma.unitAccount.findUnique({

            where: {

                id

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find By Unit ID
    // ======================================================

    async findByUnitId(unitId) {

        return await prisma.unitAccount.findUnique({

            where: {

                unitId

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find By Code
    // ======================================================

    async findByCode(code) {

        return await prisma.unitAccount.findUnique({

            where: {

                code

            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Find All
    // ======================================================

    async findAll() {

        return await prisma.unitAccount.findMany({

            include: this.getInclude(),

            orderBy: [

                {

                    code: "asc"

                },

                {

                    createdAt: "asc"

                }

            ]

        });

    }


    // ======================================================
    // Update
    // ======================================================

    async update(id, data) {

        return await prisma.unitAccount.update({

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

    async delete(id) {

        return await prisma.unitAccount.delete({

            where: {

                id

            },

            include: {

                unit: true

            }

        });

    }

}


module.exports = new UnitAccountRepository();