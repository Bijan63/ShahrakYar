const AppError = require("../utils/AppError");
const electionRepository = require("../repositories/election.repository");

class ElectionService {

    async createElection(data) {

        const {
            title,
            description,
            startDate,
            endDate
        } = data;

        if (!title || !startDate || !endDate) {

            throw new AppError(
                "Required fields are missing.",
                400
            );

        }

        return await electionRepository.create({

            title,

            description,

            startDate: new Date(startDate),

            endDate: new Date(endDate)

        });

    }

    async getElections() {

        return await electionRepository.findAll();

    }

    async getElectionResults(electionId) {

        const election =
            await electionRepository.findByIdWithCandidates(
                electionId
            );

        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }

        const results = election.candidates.map(candidate => ({

            id: candidate.id,

            fullName: candidate.fullName,

            biography: candidate.biography,

            votes: candidate.votes.length

        }));

        results.sort((a, b) => b.votes - a.votes);

        return {

            success: true,

            election: {

                id: election.id,

                title: election.title,

                status: election.status

            },

            totalVotes:
                results.reduce(
                    (sum, c) => sum + c.votes,
                    0
                ),

            results

        };

    }

}

module.exports = new ElectionService();