const prisma = require("../config/prisma");

class CandidateRepository {

    // =========================
    // Create Candidate
    // =========================

    async create(data) {

        return await prisma.candidate.create({

            data,

            include: {

                person: true,

                election: true

            }

        });

    }


    // =========================
    // Find Candidate By ID
    // =========================

    async findById(id) {

        return await prisma.candidate.findUnique({

            where: {
                id
            },

            include: {

                person: true,

                election: true

            }

        });

    }


    // =========================
    // Find All Candidates
    // Of One Election
    // =========================

    async findAllByElection(electionId) {

        return await prisma.candidate.findMany({

            where: {
                electionId
            },

            include: {

                person: true

            },

            orderBy: [

                {
                    person: {
                        firstName: "asc"
                    }
                },

                {
                    person: {
                        lastName: "asc"
                    }
                }

            ]

        });

    }


    // =========================
    // Find Candidate
    // By Election + Person
    // =========================

    async findByElectionAndPerson(
        electionId,
        personId
    ) {

        return await prisma.candidate.findUnique({

            where: {

                electionId_personId: {

                    electionId,

                    personId

                }

            }

        });

    }


    // =========================
    // Update Candidate
    // =========================

    async update(id, data) {

        return await prisma.candidate.update({

            where: {
                id
            },

            data,

            include: {

                person: true,

                election: true

            }

        });

    }


    // =========================
    // Delete Candidate
    // =========================

    async delete(id) {

        return await prisma.candidate.delete({

            where: {
                id
            }

        });

    }

}


module.exports = new CandidateRepository();
