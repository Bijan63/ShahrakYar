const prisma = require("../config/prisma");

class VoteRepository {

    // Create vote
    async create(data) {
        return prisma.vote.create({
            data
        });
    }


    // Find an existing vote by voter and election
    async findByVoterAndElection(voterId, electionId) {
        return prisma.vote.findUnique({
            where: {
                electionId_voterId: {
                    electionId,
                    voterId
                }
            }
        });
    }


    // Get election result
    async getElectionResult(electionId) {
        return prisma.candidate.findMany({
            where: {
                electionId
            },

            include: {
                person: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },

                _count: {
                    select: {
                        votes: true
                    }
                }
            },

            orderBy: {
                votes: {
                    _count: "desc"
                }
            }
        });
    }
}

module.exports = new VoteRepository();