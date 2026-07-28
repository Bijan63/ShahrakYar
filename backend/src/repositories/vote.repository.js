const prisma = require("../config/prisma");

class VoteRepository {

    async create(data) {

        return prisma.vote.create({

            data

        });

    }

    async findByResidentAndElection(
        residentId,
        electionId
    ) {

        return prisma.vote.findFirst({

            where: {

                residentId,

                electionId

            }

        });

    }

    async countVotes(candidateId) {

        return prisma.vote.count({

            where: {

                candidateId

            }

        });

    }

    async findAllByElection(electionId) {

        return prisma.vote.findMany({

            where: {

                electionId

            },

            include: {

                resident: true,

                candidate: true

            }

        });

    }

    async delete(id) {

        return prisma.vote.delete({

            where: {

                id

            }

        });

    }

}

module.exports = new VoteRepository();