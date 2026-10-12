const prisma = require("../config/prisma");

class UnitRepository {

    // =========================
    // Include
    // =========================

    getInclude() {

        return {

            building: true,

            property: true,

            residents: {

                include: {

                    person: true,

                    user: true

                },

                orderBy: {

                    fullName: "asc"

                }

            }

        };

    }


    // =========================
    // Create Unit
    // =========================

    async create(data) {

        return await prisma.unit.create({

            data,

            include: this.getInclude()

        });

    }


    // =========================
    // Get Unit By ID
    // =========================

    async findById(id) {

        return await prisma.unit.findUnique({

            where: {

                id

            },

            include: this.getInclude()

        });

    }


    // =========================
    // Get All Units
    // =========================

    async findAll() {

        return await prisma.unit.findMany({

            include: this.getInclude(),

            orderBy: [

                {

                    unitNumber: "asc"

                },

                {

                    createdAt: "asc"

                }

            ]

        });

    }


    // =========================
    // Update Unit
    // =========================

    async update(id, data) {

        return await prisma.unit.update({

            where: {

                id

            },

            data,

            include: this.getInclude()

        });

    }


    // =========================
    // Delete Unit
    // =========================

    async delete(id) {

        return await prisma.unit.delete({

            where: {

                id

            },

            include: {

                building: true,

                property: true

            }

        });

    }

}


module.exports = new UnitRepository();