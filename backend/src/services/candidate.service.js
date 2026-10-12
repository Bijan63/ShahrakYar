const AppError = require("../utils/AppError");

const prisma = require("../config/prisma");

const candidateRepository =
    require("../repositories/candidate.repository");

const electionRepository =
    require("../repositories/election.repository");

const personRepository =
    require("../repositories/person.repository");

const electionAccessService =
    require("./election-access.service");


class CandidateService {

    // Create Candidate
    async createCandidate(data, user) {
        const {
            personId,
            biography,
            electionId
        } = data;

        if (!personId || !electionId) {
            throw new AppError(
                "Person and election are required.",
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

        await electionAccessService.assertCanManageElection(
            user,
            election
        );

        if (election.status !== "DRAFT") {
            throw new AppError(
                "Candidates are frozen once the election is open.",
                409
            );
        }

        const person =
            await personRepository.getPersonById(personId);

        if (!person) {
            throw new AppError(
                "Person not found.",
                404
            );
        }

        const existingCandidate =
            await candidateRepository.findByElectionAndPerson(
                electionId,
                personId
            );

        if (existingCandidate) {
            throw new AppError(
                "This person is already a candidate in this election.",
                409
            );
        }

        return await candidateRepository.create({
            electionId,
            personId,
            biography
        });
    }


    // Get Candidates Of Election
    async getCandidates(electionId, user) {
        const election =
            await electionRepository.findById(electionId);

        if (!election) {
            throw new AppError(
                "Election not found.",
                404
            );
        }

        await electionAccessService.assertCanReadElection(
            user,
            election
        );

        return await candidateRepository.findAllByElection(
            electionId
        );
    }


    // Get Candidate
    async getCandidate(id, user) {
        const candidate =
            await candidateRepository.findById(id);

        if (!candidate) {
            throw new AppError(
                "Candidate not found.",
                404
            );
        }

        const election =
            await electionRepository.findById(
                candidate.electionId
            );

        await electionAccessService.assertCanReadElection(
            user,
            election
        );

        return candidate;
    }


    // Update Candidate
    async updateCandidate(id, data, user) {
        const candidate =
            await candidateRepository.findById(id);

        if (!candidate) {
            throw new AppError(
                "Candidate not found.",
                404
            );
        }

        const election =
            await electionRepository.findById(
                candidate.electionId
            );

        if (!election) {
            throw new AppError(
                "Election not found.",
                404
            );
        }

        await electionAccessService.assertCanManageElection(
            user,
            election
        );

        if (election.status !== "DRAFT") {
            throw new AppError(
                "Candidates are frozen once the election is open.",
                409
            );
        }

        const updateData = {};

        if (
            Object.prototype.hasOwnProperty.call(
                data,
                "biography"
            )
        ) {
            updateData.biography = data.biography;
        }

        if (Object.keys(updateData).length === 0) {
            throw new AppError(
                "At least one candidate field must be provided.",
                400
            );
        }

        return await candidateRepository.update(
            id,
            updateData
        );
    }


    // Delete Candidate
    async deleteCandidate(id, user) {
        const candidate =
            await candidateRepository.findById(id);

        if (!candidate) {
            throw new AppError(
                "Candidate not found.",
                404
            );
        }

        const election =
            await electionRepository.findById(
                candidate.electionId
            );

        if (!election) {
            throw new AppError(
                "Election not found.",
                404
            );
        }

        await electionAccessService.assertCanManageElection(
            user,
            election
        );

        const voteCount =
            await prisma.vote.count({
                where: {
                    candidateId: id
                }
            });

        if (voteCount > 0) {
            throw new AppError(
                "Candidate cannot be deleted because votes have already been cast for this candidate.",
                409
            );
        }

        if (election.status !== "DRAFT") {
            throw new AppError(
                "Candidates are frozen once the election is open.",
                409
            );
        }

        await candidateRepository.delete(id);

        return true;
    }

}


module.exports = new CandidateService();