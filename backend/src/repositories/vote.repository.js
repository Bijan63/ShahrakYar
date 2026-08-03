const prisma = require("../config/prisma");

class VoteRepository {
    async getElectionResult(electionId) {
        return prisma.candidate.findMany({
            where: {
                electionId
            },

            include: {
                resident: {
                    select: {
                        fullName: true
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
