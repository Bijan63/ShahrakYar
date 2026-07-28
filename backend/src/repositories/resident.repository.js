const prisma = require("../config/prisma");

class ResidentRepository {

    async create(data) {

        return await prisma.resident.create({
            data
        });

    }

    async findById(id) {

        return await prisma.resident.findUnique({

            where: {
                id
            }

        });

    }

    async findByUserId(userId) {

        return await prisma.resident.findUnique({

            where: {
                userId
            }

        });

    }

    async findAll() {

        return await prisma.resident.findMany({

            include: {

                unit: true,

                user: true

            },

            orderBy: {

                fullName: "asc"

            }

        });

    }

    async update(id, data) {

        return await prisma.resident.update({

            where: {
                id
            },

            data

        });

    }

    async delete(id) {

        return await prisma.resident.delete({

            where: {
                id
            }

        });

    }

}

module.exports = new ResidentRepository();
