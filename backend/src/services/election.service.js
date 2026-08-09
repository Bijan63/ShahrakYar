const AppError = require("../utils/AppError");

const electionRepository = require("../repositories/election.repository");


class ElectionService {

    // =====================
    // Create Election
    // =====================

    async createElection(data) {

        const {
            title,
            description,
            startDate,
            endDate
        } = data;


        if (!title || !startDate || !endDate) {

            throw new AppError(
                "Title, start date and end date are required.",
                400
            );

        }


        if (
            new Date(startDate) >=
            new Date(endDate)
        ) {

            throw new AppError(
                "End date must be after start date.",
                400
            );

        }


        return await electionRepository.create({

            title,

            description,

            startDate:
                new Date(startDate),

            endDate:
                new Date(endDate),

            status: "DRAFT"

        });

    }


    // =====================
    // Get Election By ID
    // =====================

    async getElection(id) {

        const election =
            await electionRepository.findById(id);


        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }


        return election;

    }


    // =====================
    // Get All Elections
    // =====================

    async getElections() {

        return await electionRepository.findAll();

    }


    // =====================
    // Open Election
    // =====================

    async openElection(id) {

        const election =
            await electionRepository.findById(id);


        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }


        if (election.status === "OPEN") {

            throw new AppError(
                "Election is already open.",
                409
            );

        }


        if (election.status === "CLOSED") {

            throw new AppError(
                "Closed election cannot be reopened.",
                409
            );

        }


        return await electionRepository.openElection(id);

    }


    // =====================
    // Close Election
    // =====================

    async closeElection(id) {

        const election =
            await electionRepository.findById(id);


        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }


        if (election.status === "CLOSED") {

            throw new AppError(
                "Election already closed.",
                409
            );

        }


        return await electionRepository.closeElection(id);

    }


    // =====================
    // Election Result
    // =====================

    async getResult(id) {

        const election =
            await electionRepository.getResult(id);


        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }


        const totalVotes =
            election.candidates.reduce(

                (sum, candidate) =>
                    sum + candidate.votes.length,

                0

            );


        const candidates =
            election.candidates.map(
                (candidate) => ({

                    id: candidate.id,

                    fullName:
                        candidate.fullName,

                    votes:
                        candidate.votes.length,

                    percent:

                        totalVotes === 0

                            ? 0

                            : Number(

                                (
                                    (
                                        candidate
                                            .votes
                                            .length
                                        *
                                        100
                                    )
                                    /
                                    totalVotes
                                ).toFixed(2)

                            )

                })
            );


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