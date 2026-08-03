const prisma = require("../config/prisma");

class ElectionRepository {
    async create(data) {
        return await prisma.election.create({
            data
        });
    }

    async findById(id) {
        return await prisma.election.findUnique({
            where: {
                id
            },
            include: {
                candidates: true
            }
        });
    }

    async findAll() {
        return await prisma.election.findMany({
            orderBy: {
                startDate: "desc"
            }
        });
    }

    async update(id, data) {
        return await prisma.election.update({
            where: {
                id
            },
            data
        });
    }

    async delete(id) {
        return await prisma.election.delete({
            where: {
                id
            }
        });
    }

    async openElection(id) {
        return await prisma.election.update({
            where: {
                id
            },
            data: {
                status: "OPEN"
            }
        });
    }

    async closeElection(id) {
        return await prisma.election.update({
            where: {
                id
            },
            data: {
                status: "CLOSED"
            }
        });
    }

    async getResult(id) {
        const election = await prisma.election.findUnique({
            where: {
                id
            },

            include: {
                candidates: {
                    include: {
                        votes: true
                    }
                }
            }
        });

        return election;
    }
}

module.exports = new ElectionRepository();
