const AppError = require("../utils/AppError");

const candidateRepository = require("../repositories/candidate.repository");
const electionRepository = require("../repositories/election.repository");

class CandidateService {

    async createCandidate(data) {

        const { fullName, biography, electionId } = data;

        if (!fullName || !electionId) {

            throw new AppError(
                "Full name and election are required.",
                400
            );

        }

        const election = await electionRepository.findById(electionId);

        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }

        return await candidateRepository.create({

            fullName,

            biography,

            electionId

        });

    }

    async getCandidates(electionId) {

        const election = await electionRepository.findById(electionId);

        if (!election) {

            throw new AppError(
                "Election not found.",
                404
            );

        }

        return await candidateRepository.findAllByElection(electionId);

    }

    async getCandidate(id) {

        const candidate = await candidateRepository.findById(id);

        if (!candidate) {

            throw new AppError(
                "Candidate not found.",
                404
            );

        }

        return candidate;

    }

    async updateCandidate(id, data) {

        const candidate = await candidateRepository.findById(id);

        if (!candidate) {

            throw new AppError(
                "Candidate not found.",
                404
            );

        }

        return await candidateRepository.update(
            id,
            data
        );

    }

    async deleteCandidate(id) {

        const candidate = await candidateRepository.findById(id);

        if (!candidate) {

            throw new AppError(
                "Candidate not found.",
                404
            );

        }

        await candidateRepository.delete(id);

        return true;

    }

}

module.exports = new CandidateService();