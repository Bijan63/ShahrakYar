const prisma = require("../config/prisma");

class UserRepository {
    async create(data) {
        return prisma.user.create({
            data
        });
    }

    async findAll(skip = 0, take = 20) {
        return prisma.user.findMany({
            skip,

            take,

            orderBy: {
                id: "asc"
            }
        });
    }

    async count() {
        return prisma.user.count();
    }

    async findById(id) {
        return prisma.user.findUnique({
            where: {
                id
            }
        });
    }

    async findByEmail(email) {
        return prisma.user.findUnique({
            where: {
                email
            }
        });
    }

    async exists(id) {
        const user = await prisma.user.findUnique({
            where: {
                id
            },

            select: {
                id: true
            }
        });

        return !!user;
    }

    async update(id, data) {
        return prisma.user.update({
            where: {
                id
            },

            data
        });
    }

    async delete(id) {
        return prisma.user.delete({
            where: {
                id
            }
        });
    }
}

module.exports = new UserRepository();
