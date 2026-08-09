const prisma = require("../config/prisma");

class UserRepository {

    // =====================
    // Create
    // =====================

    async create(data) {

        return prisma.user.create({
            data
        });

    }


    // =====================
    // Get All Users
    // بدون password
    // =====================

    async findAll(skip = 0, take = 20) {

        return prisma.user.findMany({

            skip,

            take,

            orderBy: {
                id: "asc"
            },

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

        });

    }


    // =====================
    // Count
    // =====================

    async count() {

        return prisma.user.count();

    }


    // =====================
    // Find By ID
    // بدون password
    // =====================

    async findById(id) {

        return prisma.user.findUnique({

            where: {
                id
            },

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

        });

    }


    // =====================
    // Find By Email
    // password لازم است
    // =====================

    async findByEmail(email) {

        return prisma.user.findUnique({

            where: {
                email
            }

        });

    }


    // =====================
    // Exists
    // =====================

    async exists(id) {

        const user =
            await prisma.user.findUnique({

                where: {
                    id
                },

                select: {
                    id: true
                }

            });

        return !!user;

    }


    // =====================
    // Update
    // =====================

    async update(id, data) {

        return prisma.user.update({

            where: {
                id
            },

            data,

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

        });

    }


    // =====================
    // Delete
    // =====================

    async delete(id) {

        return prisma.user.delete({

            where: {
                id
            },

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

        });

    }

}


module.exports = new UserRepository();
