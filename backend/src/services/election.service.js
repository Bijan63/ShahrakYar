const AppError = require("../utils/AppError");

const electionRepository = require("../repositories/election.repository");

class ElectionService {
    async createElection(data) {
        const { title, description, startDate, endDate } = data;

        if (!title || !startDate || !endDate) {
            throw new AppError(
                "Title, start date and end date are required.",
                400
            );
        }

        if (new Date(startDate) >= new Date(endDate)) {
            throw new AppError("End date must be after start date.", 400);
        }

        return await electionRepository.create({
            title,

            description,

            startDate: new Date(startDate),

            endDate: new Date(endDate),

            status: "DRAFT"
        });
    }

    async getElection(id) {
        const election = await electionRepository.findById(Number(id));

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        return election;
    }

    async getElections() {
        return await electionRepository.findAll();
    }

    async openElection(id) {
        const election = await electionRepository.findById(Number(id));

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        if (election.status === "OPEN") {
            throw new AppError("Election is already open.", 409);
        }

        if (election.status === "CLOSED") {
            throw new AppError("Closed election cannot be reopened.", 409);
        }

        return await electionRepository.openElection(Number(id));
    }

    async closeElection(id) {
        const election = await electionRepository.findById(Number(id));

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        if (election.status === "CLOSED") {
            throw new AppError("Election already closed.", 409);
        }

        return await electionRepository.closeElection(Number(id));
    }

    async getResult(id) {
        const election = await electionRepository.getResult(Number(id));

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        const totalVotes = election.candidates.reduce(
            (sum, candidate) => sum + candidate.votes.length,

            0
        );

        const candidates = election.candidates.map((candidate) => ({
            id: candidate.id,

            fullName: candidate.fullName,

            votes: candidate.votes.length,

            percent:
                totalVotes === 0
                    ? 0
                    : Number(
                          ((candidate.votes.length * 100) / totalVotes).toFixed(
                              2
                          )
                      )
        }));

        return {
            election: {
                id: election.id,

                title: election.title,

                status: election.status
            },

            totalVotes,

            candidates
        };
    }
}

module.exports = new ElectionService();
