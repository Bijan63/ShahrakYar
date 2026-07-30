const prisma = require("../config/prisma");

class UnitRepository {
    async create(data) {
        return await prisma.unit.create({
            data
        });
    }

    async findById(id) {
        return await prisma.unit.findUnique({
            where: {
                id
            }
        });
    }

    async findAll() {
        return await prisma.unit.findMany({
            include: {
                building: true
            },

            orderBy: {
                unitNumber: "asc"
            }
        });
    }

    async update(id, data) {
        return await prisma.unit.update({
            where: {
                id
            },

            data
        });
    }

    async delete(id) {
        return await prisma.unit.delete({
            where: {
                id
            }
        });
    }
}

module.exports = new UnitRepository();
