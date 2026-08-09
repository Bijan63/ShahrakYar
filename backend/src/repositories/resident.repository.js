const prisma = require("../config/prisma");

class ResidentRepository {
    async create(data) {
        return prisma.resident.create({
            data
        });
    }

    async findById(id) {
        return prisma.resident.findUnique({
            where: {
                id
            },
            include: {
                user: true,
                unit: {
                    include: {
                        building: true
                    }
                }
            }
        });
    }

    async findByUserId(userId) {
        return prisma.resident.findUnique({
            where: {
                userId
            }
        });
    }

    async findByMobile(mobile) {
        return prisma.resident.findFirst({
            where: {
                mobile
            }
        });
    }

    async findByPersonId(personId) {

    return prisma.resident.findUnique({

        where: {

            personId

        }

    });

}

    async findAll(skip = 0, take = 20) {
        return prisma.resident.findMany({
            skip,
            take,
            include: {
                user: true,
                unit: {
                    include: {
                        building: true
                    }
                }
            },
            orderBy: {
                fullName: "asc"
            }
        });
    }

    async search({ skip, take, where, orderBy }) {
        return prisma.resident.findMany({
            skip,
            take,
            where,
            include: {
                user: true,
                unit: {
                    include: {
                        building: true
                    }
                }
            },
            orderBy
        });
    }

    async count() {
        return prisma.resident.count();
    }

    async countSearch(where) {
        return prisma.resident.count({
            where
        });
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

    async update(id, data) {
        return prisma.resident.update({
            where: {
                id
            },
            data
        });
    }

    async delete(id) {
        return prisma.resident.delete({
            where: {
                id
            }
        });
    }
}

module.exports = new ResidentRepository();
