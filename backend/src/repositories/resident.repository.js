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
            },

            include: {
                user: true,
                unit: true
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

    async findByMobile(mobile) {

        return await prisma.resident.findFirst({

            where: {
                mobile
            }

        });

    }

    async findAll(skip = 0, take = 20) {

        return await prisma.resident.findMany({

            skip,

            take,

            include: {

                user: true,

                unit: true

            },

            orderBy: {

                fullName: "asc"

            }

        });

    }

    async count() {

        return await prisma.resident.count();

    }

    async exists(id) {

        const resident = await prisma.resident.findUnique({

            where: {
                id
            },

            select: {
                id: true
            }

        });

        return !!resident;

    }

    async search(keyword) {

        return await prisma.resident.findMany({

            where: {

                OR: [

                    {
                        fullName: {
                            contains: keyword,
                            mode: "insensitive"
                        }
                    },

                    {
                        mobile: {
                            contains: keyword
                        }
                    }

                ]

            },

            include: {

                user: true,

                unit: true

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