const prisma = require("../config/prisma");

class ComplexRepository {

    async create(data) {
        return prisma.complex.create({
            data
        });
    }


    async findAll() {
        return prisma.complex.findMany({
            orderBy: {
                id: "asc"
            },

            include: {
                buildings: true
            }
        });
    }


    async findById(id) {
        return prisma.complex.findUnique({
            where: {
                id
            },

            include: {
                buildings: {
                    include: {
                        units: true
                    }
                }
            }
        });
    }


    async update(id, data) {
        return prisma.complex.update({
            where: {
                id
            },

            data
        });
    }


    async delete(id) {
        return prisma.complex.delete({
            where: {
                id
            }
        });
    }

}


module.exports = new ComplexRepository();