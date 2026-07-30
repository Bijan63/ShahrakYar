
const prisma = require("../config/prisma");

class CandidateRepository {
    async create(data) {
        return await prisma.candidate.create({
            data
        });
    }

    async findById(id) {
        return await prisma.candidate.findUnique({
            where: {
                id
            }
        });
    }

    async findAllByElection(electionId) {
        return await prisma.candidate.findMany({
            where: {
                electionId
            },

            orderBy: {
                fullName: "asc"
            }
        });
    }

    async update(id, data) {
        return await prisma.candidate.update({
            where: {
                id
            },

            data
        });
    }

    async delete(id) {
        return await prisma.candidate.delete({
            where: {
                id
            }
        });
    }
}

module.exports = new CandidateRepository();