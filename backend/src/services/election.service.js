const AppError = require("../utils/AppError");

const electionRepository =
    require("../repositories/election.repository");

const complexRepository =
    require("../repositories/complex.repository");

const electionAccessService =
    require("./election-access.service");


class ElectionService {

    async createElection(data, user) {
        const {
            title,
            description,
            startDate,
            endDate,
            complexId
        } = data;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            !startDate ||
            !endDate ||
            typeof complexId !== "string" ||
            !complexId.trim()
        ) {
            throw new AppError(
                "Title, start date, end date and complexId are required.",
                400
            );
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (Number.isNaN(parsedStartDate.getTime())) {
            throw new AppError("Invalid start date.", 400);
        }

        if (Number.isNaN(parsedEndDate.getTime())) {
            throw new AppError("Invalid end date.", 400);
        }

        if (parsedStartDate >= parsedEndDate) {
            throw new AppError(
                "End date must be after start date.",
                400
            );
        }

        const complex =
            await complexRepository.findById(complexId);

        if (!complex) {
            throw new AppError("Complex not found.", 404);
        }

        // Verify that this user may manage elections for this complex.
        await electionAccessService.assertCanManageElection(
            user,
            { complexId }
        );

        return await electionRepository.create({
            title: title.trim(),
            description,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            complexId,
            status: "DRAFT"
        });
    }


    // An election can only be read by a user
    // who has access to its complex.
    async getElection(id, user) {
        const election =
            await electionRepository.findById(id);

        await electionAccessService.assertCanReadElection(
            user,
            election
        );

        return election;
    }


    // ADMIN: all elections.
    // MANAGER: elections in assigned complexes.
    // USER: elections in complexes with active ownership.
    async getElections(user) {
        const elections =
            await electionRepository.findAll();

        const complexIds =
            await electionAccessService.getReadableComplexIds(user);

        // null means global ADMIN access.
        if (complexIds === null) {
            return elections;
        }

        const allowedComplexIds = new Set(complexIds);

        return elections.filter(
            (election) =>
                election.complexId &&
                allowedComplexIds.has(election.complexId)
        );
    }


    async openElection(id) {
        const election =
            await electionRepository.findById(id);

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        if (!election.complexId) {
            throw new AppError(
                "Election must be assigned to a Complex before it can be opened.",
                409
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

        if (election.status !== "DRAFT") {
            throw new AppError(
                `Election cannot be opened from status ${election.status}.`,
                409
            );
        }

        return await electionRepository.openElection(id);
    }


    async closeElection(id) {
        const election =
            await electionRepository.findById(id);

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        if (election.status === "CLOSED") {
            throw new AppError(
                "Election already closed.",
                409
            );
        }

        if (election.status !== "OPEN") {
            throw new AppError(
                `Election cannot be closed from status ${election.status}.`,
                409
            );
        }

        return await electionRepository.closeElection(id);
    }


    async getResult(id, user) {
        const election =
            await electionRepository.getResult(id);

        await electionAccessService.assertCanReadElection(
            user,
            election
        );

        const totalVotes =
            election.candidates.reduce(
                (sum, candidate) =>
                    sum + candidate.votes.length,
                0
            );

        const candidates =
            election.candidates.map((candidate) => ({
                id: candidate.id,
                fullName: candidate.fullName,
                votes: candidate.votes.length,
                percent:
                    totalVotes === 0
                        ? 0
                        : Number(
                            (
                                candidate.votes.length *
                                100 /
                                totalVotes
                            ).toFixed(2)
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
