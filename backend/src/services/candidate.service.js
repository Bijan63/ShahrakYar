const AppError = require("../utils/AppError");
const candidateRepository = require("../repositories/candidate.repository");
const electionRepository = require("../repositories/election.repository");

class CandidateService {

    async createCandidate(data) {

        const {
            fullName,
            biography,
            electionId
        } = data;

        if (!fullName || !electionId) {

            throw new AppError(
                "Full name and election are required.",
                400
            );

        }

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

        const candidate =
    await candidateRepository.create({

        fullName,

        biography,

        electionId

    });

        return candidate;

    }

    async getCandidates(electionId) {

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

    return await candidateRepository.findAllByElection(
        electionId
    );

}

}

module.exports = new CandidateService();
