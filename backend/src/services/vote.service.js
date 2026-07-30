const AppError = require("../utils/AppError");

const voteRepository = require("../repositories/vote.repository");
const electionRepository = require("../repositories/election.repository");
const candidateRepository = require("../repositories/candidate.repository");
const residentRepository = require("../repositories/resident.repository");

class VoteService {
    async createVote(data) {
        const { residentId, candidateId, electionId } = data;

        if (!residentId || !candidateId || !electionId) {
            throw new AppError("All fields are required.", 400);
        }

        // بررسی Resident
        const resident = await residentRepository.findById(residentId);

        if (!resident) {
            throw new AppError("Resident not found.", 404);
        }

        // بررسی Election
        const election = await electionRepository.findById(electionId);

        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        // انتخابات باید باز باشد
        if (election.status !== "OPEN") {
            throw new AppError("Election is closed.", 400);
        }

        // بررسی Candidate
        const candidate = await candidateRepository.findById(candidateId);

        if (!candidate) {
            throw new AppError("Candidate not found.", 404);
        }

        // کاندیدا باید متعلق به همین انتخابات باشد
        if (candidate.electionId !== electionId) {
            throw new AppError(
                "Candidate does not belong to this election.",
                400
            );
        }

        // جلوگیری از رأی تکراری
        const existingVote = await voteRepository.findByResidentAndElection(
            residentId,
            electionId
        );

        if (existingVote) {
            throw new AppError("Resident has already voted.", 409);
        }

        return await voteRepository.create({
            residentId,

            candidateId,

            electionId
        });
    }
}

module.exports = new VoteService();
