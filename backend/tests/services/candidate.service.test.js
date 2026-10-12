jest.mock("../../src/config/prisma", () => ({
    vote: {
        count: jest.fn(),
    },
}));

jest.mock("../../src/repositories/candidate.repository", () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findAllByElection: jest.fn(),
    findByElectionAndPerson: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
}));

jest.mock("../../src/repositories/election.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/repositories/person.repository", () => ({
    getPersonById: jest.fn(),
}));

jest.mock("../../src/services/election-access.service", () => ({
    assertCanManageElection: jest.fn(),
    assertCanReadElection: jest.fn(),
}));

const AppError = require("../../src/utils/AppError");
const prisma = require("../../src/config/prisma");
const candidateRepository =
    require("../../src/repositories/candidate.repository");
const electionRepository =
    require("../../src/repositories/election.repository");
const personRepository =
    require("../../src/repositories/person.repository");
const electionAccessService =
    require("../../src/services/election-access.service");
const candidateService =
    require("../../src/services/candidate.service");

const admin = {
    id: "admin-1",
    role: "ADMIN",
};

const manager = {
    id: "manager-1",
    role: "MANAGER",
};

const makeElection = (overrides = {}) => ({
    id: "election-1",
    status: "DRAFT",
    title: "Board Election",
    ...overrides,
});

const makeCandidate = (overrides = {}) => ({
    id: "candidate-1",
    electionId: "election-1",
    personId: "person-1",
    biography: "Candidate biography",
    ...overrides,
});

describe("CandidateService", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        candidateRepository.create.mockResolvedValue(
            makeCandidate()
        );
        candidateRepository.findById.mockResolvedValue(null);
        candidateRepository.findAllByElection.mockResolvedValue([]);
        candidateRepository.findByElectionAndPerson.mockResolvedValue(null);
        candidateRepository.update.mockResolvedValue(makeCandidate());
        candidateRepository.delete.mockResolvedValue(makeCandidate());

        electionRepository.findById.mockResolvedValue(null);
        personRepository.getPersonById.mockResolvedValue(null);

        electionAccessService.assertCanManageElection.mockResolvedValue(
            undefined
        );
        electionAccessService.assertCanReadElection.mockResolvedValue(
            undefined
        );

        prisma.vote.count.mockResolvedValue(0);
    });

    describe("createCandidate", () => {
        test("rejects when personId is missing", async () => {
            await expect(
                candidateService.createCandidate(
                    { electionId: "election-1" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Person and election are required.",
            });

            expect(electionRepository.findById).not.toHaveBeenCalled();
        });

        test("rejects when electionId is missing", async () => {
            await expect(
                candidateService.createCandidate(
                    { personId: "person-1" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Person and election are required.",
            });

            expect(electionRepository.findById).not.toHaveBeenCalled();
        });

        test("returns 404 when the election does not exist", async () => {
            await expect(
                candidateService.createCandidate(
                    {
                        personId: "person-1",
                        electionId: "missing-election",
                    },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });
        });

        test("propagates election management access denial", async () => {
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);

            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanManageElection
                .mockRejectedValue(error);

            await expect(
                candidateService.createCandidate(
                    {
                        personId: "person-1",
                        electionId: election.id,
                    },
                    manager
                )
            ).rejects.toBe(error);

            expect(personRepository.getPersonById).not.toHaveBeenCalled();
        });

        test("rejects candidate creation when the election is not in DRAFT", async () => {
            const election = makeElection({ status: "OPEN" });

            electionRepository.findById.mockResolvedValue(election);

            await expect(
                candidateService.createCandidate(
                    {
                        personId: "person-1",
                        electionId: election.id,
                    },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Candidates are frozen once the election is open.",
            });

            expect(personRepository.getPersonById).not.toHaveBeenCalled();
        });

        test("returns 404 when the person does not exist", async () => {
            const election = makeElection();

            electionRepository.findById.mockResolvedValue(election);
            personRepository.getPersonById.mockResolvedValue(null);

            await expect(
                candidateService.createCandidate(
                    {
                        personId: "missing-person",
                        electionId: election.id,
                    },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Person not found.",
            });

            expect(
                electionAccessService.assertCanManageElection
            ).toHaveBeenCalledWith(admin, election);
        });

        test("rejects a person who is already a candidate in the election", async () => {
            const election = makeElection();
            const person = { id: "person-1" };

            electionRepository.findById.mockResolvedValue(election);
            personRepository.getPersonById.mockResolvedValue(person);
            candidateRepository.findByElectionAndPerson.mockResolvedValue(
                makeCandidate()
            );

            await expect(
                candidateService.createCandidate(
                    {
                        personId: person.id,
                        electionId: election.id,
                    },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "This person is already a candidate in this election.",
            });

            expect(candidateRepository.create).not.toHaveBeenCalled();
        });

        test("creates a candidate after all validations pass", async () => {
            const election = makeElection();
            const person = {
                id: "person-1",
                firstName: "Ali",
            };
            const data = {
                personId: person.id,
                electionId: election.id,
                biography: "Experienced community member",
            };
            const created = makeCandidate({
                biography: data.biography,
            });

            electionRepository.findById.mockResolvedValue(election);
            personRepository.getPersonById.mockResolvedValue(person);
            candidateRepository.findByElectionAndPerson.mockResolvedValue(
                null
            );
            candidateRepository.create.mockResolvedValue(created);

            const result = await candidateService.createCandidate(
                data,
                admin
            );

            expect(personRepository.getPersonById).toHaveBeenCalledWith(
                data.personId
            );
            expect(
                candidateRepository.findByElectionAndPerson
            ).toHaveBeenCalledWith(data.electionId, data.personId);
            expect(candidateRepository.create).toHaveBeenCalledWith({
                electionId: data.electionId,
                personId: data.personId,
                biography: data.biography,
            });
            expect(result).toBe(created);
        });
    });

    describe("getCandidates", () => {
        test("returns 404 when the election does not exist", async () => {
            await expect(
                candidateService.getCandidates("missing-election", admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(
                electionAccessService.assertCanReadElection
            ).not.toHaveBeenCalled();
        });

        test("propagates election read access denial", async () => {
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);

            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanReadElection
                .mockRejectedValue(error);

            await expect(
                candidateService.getCandidates(election.id, manager)
            ).rejects.toBe(error);

            expect(
                candidateRepository.findAllByElection
            ).not.toHaveBeenCalled();
        });

        test("returns candidates after authorization succeeds", async () => {
            const election = makeElection();
            const candidates = [
                makeCandidate(),
                makeCandidate({ id: "candidate-2", personId: "person-2" }),
            ];

            electionRepository.findById.mockResolvedValue(election);
            candidateRepository.findAllByElection.mockResolvedValue(
                candidates
            );

            const result = await candidateService.getCandidates(
                election.id,
                admin
            );

            expect(
                electionAccessService.assertCanReadElection
            ).toHaveBeenCalledWith(admin, election);
            expect(
                candidateRepository.findAllByElection
            ).toHaveBeenCalledWith(election.id);
            expect(result).toBe(candidates);
        });
    });

    describe("getCandidate", () => {
        test("returns 404 when the candidate does not exist", async () => {
            await expect(
                candidateService.getCandidate("missing-candidate", admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Candidate not found.",
            });

            expect(electionRepository.findById).not.toHaveBeenCalled();
        });

        test("propagates election read access denial", async () => {
            const candidate = makeCandidate();
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanReadElection
                .mockRejectedValue(error);

            await expect(
                candidateService.getCandidate(candidate.id, manager)
            ).rejects.toBe(error);

            expect(electionRepository.findById).toHaveBeenCalledWith(
                candidate.electionId
            );
        });

        test("returns the candidate after authorization succeeds", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);

            const result = await candidateService.getCandidate(
                candidate.id,
                admin
            );

            expect(electionAccessService.assertCanReadElection)
                .toHaveBeenCalledWith(admin, election);
            expect(result).toBe(candidate);
        });
    });

    describe("updateCandidate", () => {
        test("returns 404 when the candidate does not exist", async () => {
            await expect(
                candidateService.updateCandidate(
                    "missing-candidate",
                    { biography: "Updated" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Candidate not found.",
            });
        });

        test("returns 404 when the candidate's election does not exist", async () => {
            const candidate = makeCandidate();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(null);

            await expect(
                candidateService.updateCandidate(
                    candidate.id,
                    { biography: "Updated" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(
                electionAccessService.assertCanManageElection
            ).not.toHaveBeenCalled();
        });

        test("propagates election management access denial", async () => {
            const candidate = makeCandidate();
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanManageElection
                .mockRejectedValue(error);

            await expect(
                candidateService.updateCandidate(
                    candidate.id,
                    { biography: "Updated" },
                    manager
                )
            ).rejects.toBe(error);

            expect(candidateRepository.update).not.toHaveBeenCalled();
        });

        test("rejects editing a candidate when election is not DRAFT", async () => {
            const candidate = makeCandidate();
            const election = makeElection({ status: "CLOSED" });

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);

            await expect(
                candidateService.updateCandidate(
                    candidate.id,
                    { biography: "Updated" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Candidates are frozen once the election is open.",
            });

            expect(candidateRepository.update).not.toHaveBeenCalled();
        });

        test("rejects when no candidate fields are provided", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);

            await expect(
                candidateService.updateCandidate(
                    candidate.id,
                    {},
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message:
                    "At least one candidate field must be provided.",
            });

            expect(candidateRepository.update).not.toHaveBeenCalled();
        });

        test("rejects fields other than biography", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);

            await expect(
                candidateService.updateCandidate(
                    candidate.id,
                    { personId: "person-2" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message:
                    "At least one candidate field must be provided.",
            });

            expect(candidateRepository.update).not.toHaveBeenCalled();
        });

        test("updates the biography field", async () => {
            const candidate = makeCandidate();
            const election = makeElection();
            const data = {
                biography: "Updated biography",
            };
            const updated = {
                ...candidate,
                biography: data.biography,
            };

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            candidateRepository.update.mockResolvedValue(updated);

            const result = await candidateService.updateCandidate(
                candidate.id,
                data,
                admin
            );

            expect(candidateRepository.update).toHaveBeenCalledWith(
                candidate.id,
                { biography: data.biography }
            );
            expect(result).toBe(updated);
        });

        test("allows explicitly setting biography to null", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);

            await candidateService.updateCandidate(
                candidate.id,
                { biography: null },
                admin
            );

            expect(candidateRepository.update).toHaveBeenCalledWith(
                candidate.id,
                { biography: null }
            );
        });
    });

    describe("deleteCandidate", () => {
        test("returns 404 when the candidate does not exist", async () => {
            await expect(
                candidateService.deleteCandidate("missing-candidate", admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Candidate not found.",
            });

            expect(electionRepository.findById).not.toHaveBeenCalled();
        });

        test("returns 404 when the candidate's election does not exist", async () => {
            const candidate = makeCandidate();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(null);

            await expect(
                candidateService.deleteCandidate(candidate.id, admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(prisma.vote.count).not.toHaveBeenCalled();
        });

        test("propagates election management access denial", async () => {
            const candidate = makeCandidate();
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanManageElection
                .mockRejectedValue(error);

            await expect(
                candidateService.deleteCandidate(candidate.id, manager)
            ).rejects.toBe(error);

            expect(prisma.vote.count).not.toHaveBeenCalled();
            expect(candidateRepository.delete).not.toHaveBeenCalled();
        });

        test("rejects deletion when votes already exist", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            prisma.vote.count.mockResolvedValue(3);

            await expect(
                candidateService.deleteCandidate(candidate.id, admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "Candidate cannot be deleted because votes have already been cast for this candidate.",
            });

            expect(prisma.vote.count).toHaveBeenCalledWith({
                where: {
                    candidateId: candidate.id,
                },
            });
            expect(candidateRepository.delete).not.toHaveBeenCalled();
        });

        test("rejects deletion when election is no longer DRAFT", async () => {
            const candidate = makeCandidate();
            const election = makeElection({ status: "OPEN" });

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            prisma.vote.count.mockResolvedValue(0);

            await expect(
                candidateService.deleteCandidate(candidate.id, admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Candidates are frozen once the election is open.",
            });

            expect(candidateRepository.delete).not.toHaveBeenCalled();
        });

        test("deletes a candidate with no votes in a DRAFT election", async () => {
            const candidate = makeCandidate();
            const election = makeElection();

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            prisma.vote.count.mockResolvedValue(0);
            candidateRepository.delete.mockResolvedValue(candidate);

            const result = await candidateService.deleteCandidate(
                candidate.id,
                admin
            );

            expect(prisma.vote.count).toHaveBeenCalledWith({
                where: {
                    candidateId: candidate.id,
                },
            });
            expect(candidateRepository.delete).toHaveBeenCalledWith(
                candidate.id
            );
            expect(result).toBe(true);
        });

        test("propagates an error while counting votes", async () => {
            const candidate = makeCandidate();
            const election = makeElection();
            const error = new Error("Vote count failed");

            candidateRepository.findById.mockResolvedValue(candidate);
            electionRepository.findById.mockResolvedValue(election);
            prisma.vote.count.mockRejectedValue(error);

            await expect(
                candidateService.deleteCandidate(candidate.id, admin)
            ).rejects.toBe(error);

            expect(candidateRepository.delete).not.toHaveBeenCalled();
        });
    });
});
