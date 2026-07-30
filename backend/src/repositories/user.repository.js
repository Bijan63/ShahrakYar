const prisma = require("../config/prisma");

class UserRepository {
    async create(data) {
        return await prisma.user.create({
            data
        });
    }

    async findById(id) {
        return await prisma.user.findUnique({
            where: {
                id
            }
        });
    }

    async findByEmail(email) {
        return await prisma.user.findUnique({
            where: {
                email
            }
        });
    }

    async update(id, data) {
        return await prisma.user.update({
            where: {
                id
            },

            data
        });
    }

    async delete(id) {
        return await prisma.user.delete({
            where: {
                id
            }
        });
    }
}

module.exports = new UserRepository();
