const AppError = require("../utils/AppError");
const { getIO } = require("../socket/socket");

const prisma =
    require("../config/prisma");

const voteRepository =
    require("../repositories/vote.repository");

const electionRepository =
    require("../repositories/election.repository");

const electionAccessService =
    require("./election-access.service");

const candidateRepository =
    require("../repositories/candidate.repository");

const userRepository =
    require("../repositories/user.repository");

const residentRepository =
    require("../repositories/resident.repository");


class VoteService {

    // ==================================================
    // Create Vote
    // ==================================================

    async createVote(userId, data) {

        const {
            candidateId,
            electionId,
            residentId
        } = data;


        // ==================================================
        // Validate authenticated user
        // ==================================================

        if (!userId) {

            throw new AppError(
                "Authenticated user is required.",
                401
            );

        }


        // ==================================================
        // Validate required fields
        // ==================================================

        if (!candidateId || !electionId) {

            throw new AppError(
                "candidateId and electionId are required.",
                400
            );

        }


        // ==================================================
        // Find User + Person
        // ==================================================

        const user =
            await userRepository.findByIdWithPerson(userId);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        // ==================================================
        // User must be ACTIVE
        // ==================================================

        if (user.status !== "ACTIVE") {

            throw new AppError(
                "User is not active and cannot vote.",
                403
            );

        }


        // ==================================================
        // User must be linked to a Person
        // ==================================================

        if (!user.person) {

            throw new AppError(
                "This user is not linked to a Person and cannot vote.",
                400
            );

        }


        // ==================================================
        // Person must be ACTIVE
        // ==================================================

        if (user.person.status !== "ACTIVE") {

            throw new AppError(
                "Person is not active and cannot vote.",
                403
            );

        }


        const voterId =
            user.person.id;


        // ==================================================
        // Check Election
        // ==================================================

        const election =
            await electionRepository.findById(
                electionId
            );


        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }


        // ==================================================
        // Election must be OPEN
        // ==================================================

        if (election.status !== "OPEN") {

            throw new AppError(
                "Election is not open for voting.",
                400
            );

        }


        // ==================================================
        // Election must belong to a Complex
        // ==================================================

        if (!election.complexId) {

            throw new AppError(
                "Election is not assigned to a Complex and cannot accept votes.",
                409
            );

        }


        // ==================================================
        // Voting date must be inside Election period
        // ==================================================

        const now =
            new Date();


        const electionStart =
            new Date(
                election.startDate
            );

        const electionEnd =
            new Date(
                election.endDate
            );


        if (
            Number.isNaN(
                electionStart.getTime()
            ) ||
            Number.isNaN(
                electionEnd.getTime()
            )
        ) {

            throw new AppError(
                "Election has invalid voting dates.",
                500
            );

        }


        if (
            now < electionStart ||
            now > electionEnd
        ) {

            throw new AppError(
                "Voting is not currently open by date.",
                400
            );

        }


        // ==================================================
        // Voter must have ACTIVE OWNERSHIP
        // in the Election Complex
        // ==================================================

        const activeOwnership =
            await prisma.ownership.findFirst({

                where: {

                    personId:
                        voterId,

                    percentage: {
                        gt: 0
                    },

                    startDate: {
                        lte: now
                    },

                    OR: [

                        {
                            endDate: null
                        },

                        {
                            endDate: {
                                gt: now
                            }
                        }

                    ],

                    property: {

                        complexId:
                            election.complexId

                    }

                },

                select: {

                    id: true,

                    percentage: true,

                    startDate: true,

                    endDate: true,

                    property: {

                        select: {

                            id: true,

                            code: true,

                            complexId: true

                        }

                    }

                }

            });


        if (!activeOwnership) {

            throw new AppError(
                "You do not have an active ownership in this complex and cannot vote.",
                403
            );

        }


        // ==================================================
        // Check Candidate
        // ==================================================

        const candidate =
            await candidateRepository.findById(
                candidateId
            );


        if (!candidate) {

            throw new AppError(
                "Candidate not found.",
                404
            );

        }


        // ==================================================
        // Candidate must belong to this Election
        // ==================================================

        if (
            candidate.electionId !==
            electionId
        ) {

            throw new AppError(
                "Candidate does not belong to this election.",
                400
            );

        }


        // ==================================================
        // Optional Resident validation
        // ==================================================

        if (residentId) {

            const resident =
                await residentRepository.findById(
                    residentId
                );


            if (!resident) {

                throw new AppError(
                    "Resident not found.",
                    404
                );

            }


            // Resident must belong to voter Person
            if (
                resident.personId !==
                voterId
            ) {

                throw new AppError(
                    "Resident does not belong to this voter.",
                    400
                );

            }

        }


        // ==================================================
        // Prevent duplicate vote
        // ==================================================

        const existingVote =
            await voteRepository.findByVoterAndElection(
                voterId,
                electionId
            );


        if (existingVote) {

            throw new AppError(
                "Person has already voted in this election.",
                409
            );

        }


        // ==================================================
        // Create Vote
        // ==================================================

        const voteData = {

            electionId,

            voterId,

            candidateId

        };


        if (residentId) {

            voteData.residentId =
                residentId;

        }


        let vote;


        try {

            vote =
                await voteRepository.create(
                    voteData
                );

        } catch (error) {

            // PostgreSQL unique constraint:
            // @@unique([electionId, voterId])

            if (
                error &&
                error.code === "P2002"
            ) {

                throw new AppError(
                    "Person has already voted in this election.",
                    409
                );

            }

            throw error;

        }


        // ==================================================
        // Emit real-time event
        // Socket failure must not invalidate
        // a successfully stored vote
        // ==================================================

        try {

            const io =
                getIO();


            io.emit(
                "vote-created",
                {

                    electionId,

                    candidateId,

                    voterId,

                    residentId:
                        residentId || null

                }
            );

        } catch (socketError) {

            console.error(
                "Vote created but real-time event could not be emitted:",
                socketError
            );

        }


        // ==================================================
        // Return created vote
        // ==================================================

        return vote;

    }


    // ==================================================
    // Get Election Result
    // ==================================================

    async getElectionResult(electionId, user) {
        if (!electionId) {
            throw new AppError(
                "Election ID is required.",
                400
            );
        }

        const election =
            await electionRepository.findById(electionId);

        if (!election) {
            throw new AppError(
                "Election not found.",
                404
            );
        }

        // Ensure the caller can access this election's complex.
        await electionAccessService.assertCanReadElection(
            user,
            election
        );

        return await voteRepository.getElectionResult(
            electionId
        );
    }

}


module.exports = new VoteService();