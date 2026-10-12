jest.mock("../../src/config/prisma", () => ({
    candidate: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const candidateRepository = require("../../src/repositories/candidate.repository");

const CANDIDATE_INCLUDE = {
    person: true,
    election: true,
};

describe("CandidateRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("create", () => {
        test("creates a candidate and includes person and election", async () => {
            const data = {
                electionId: "election-1",
                personId: "person-1",
            };
            const created = {
                id: "candidate-1",
                ...data,
            };

            prisma.candidate.create.mockResolvedValue(created);

            const result = await candidateRepository.create(data);

            expect(prisma.candidate.create).toHaveBeenCalledWith({
                data,
                include: CANDIDATE_INCLUDE,
            });
            expect(result).toBe(created);
        });

        test("propagates a Prisma creation error", async () => {
            const error = new Error("Candidate creation failed");
            prisma.candidate.create.mockRejectedValue(error);

            await expect(
                candidateRepository.create({
                    electionId: "election-1",
                    personId: "person-1",
                })
            ).rejects.toBe(error);
        });
    });

    describe("findById", () => {
        test("finds a candidate by ID with person and election", async () => {
            const candidate = {
                id: "candidate-1",
                person: { id: "person-1" },
                election: { id: "election-1" },
            };

            prisma.candidate.findUnique.mockResolvedValue(candidate);

            const result =
                await candidateRepository.findById("candidate-1");

            expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
                where: {
                    id: "candidate-1",
                },
                include: CANDIDATE_INCLUDE,
            });
            expect(result).toBe(candidate);
        });

        test("returns null when the candidate does not exist", async () => {
            prisma.candidate.findUnique.mockResolvedValue(null);

            await expect(
                candidateRepository.findById("missing-candidate")
            ).resolves.toBeNull();
        });
    });

    describe("findAllByElection", () => {
        test("filters by election and sorts by person first and last name", async () => {
            const candidates = [
                { id: "candidate-1" },
                { id: "candidate-2" },
            ];

            prisma.candidate.findMany.mockResolvedValue(candidates);

            const result =
                await candidateRepository.findAllByElection("election-1");

            expect(prisma.candidate.findMany).toHaveBeenCalledWith({
                where: {
                    electionId: "election-1",
                },
                include: {
                    person: true,
                },
                orderBy: [
                    {
                        person: {
                            firstName: "asc",
                        },
                    },
                    {
                        person: {
                            lastName: "asc",
                        },
                    },
                ],
            });
            expect(result).toBe(candidates);
        });

        test("returns an empty list when an election has no candidates", async () => {
            prisma.candidate.findMany.mockResolvedValue([]);

            await expect(
                candidateRepository.findAllByElection("election-empty")
            ).resolves.toEqual([]);
        });
    });

    describe("findByElectionAndPerson", () => {
        test("uses the compound electionId_personId unique key", async () => {
            const candidate = {
                id: "candidate-1",
                electionId: "election-1",
                personId: "person-1",
            };

            prisma.candidate.findUnique.mockResolvedValue(candidate);

            const result =
                await candidateRepository.findByElectionAndPerson(
                    "election-1",
                    "person-1"
                );

            expect(prisma.candidate.findUnique).toHaveBeenCalledWith({
                where: {
                    electionId_personId: {
                        electionId: "election-1",
                        personId: "person-1",
                    },
                },
            });
            expect(result).toBe(candidate);
        });

        test("returns null when the election-person pair is not found", async () => {
            prisma.candidate.findUnique.mockResolvedValue(null);

            await expect(
                candidateRepository.findByElectionAndPerson(
                    "election-1",
                    "person-missing"
                )
            ).resolves.toBeNull();
        });
    });

    describe("update", () => {
        test("updates a candidate and includes person and election", async () => {
            const id = "candidate-1";
            const data = {
                personId: "person-2",
            };
            const updated = {
                id,
                ...data,
            };

            prisma.candidate.update.mockResolvedValue(updated);

            const result = await candidateRepository.update(id, data);

            expect(prisma.candidate.update).toHaveBeenCalledWith({
                where: {
                    id,
                },
                data,
                include: CANDIDATE_INCLUDE,
            });
            expect(result).toBe(updated);
        });

        test("propagates a Prisma update error", async () => {
            const error = new Error("Candidate update failed");
            prisma.candidate.update.mockRejectedValue(error);

            await expect(
                candidateRepository.update("candidate-1", {
                    personId: "person-2",
                })
            ).rejects.toBe(error);
        });
    });

    describe("delete", () => {
        test("deletes a candidate by ID", async () => {
            const deleted = {
                id: "candidate-1",
            };

            prisma.candidate.delete.mockResolvedValue(deleted);

            const result =
                await candidateRepository.delete("candidate-1");

            expect(prisma.candidate.delete).toHaveBeenCalledWith({
                where: {
                    id: "candidate-1",
                },
            });
            expect(result).toBe(deleted);
        });

        test("propagates a Prisma deletion error", async () => {
            const error = new Error("Candidate deletion failed");
            prisma.candidate.delete.mockRejectedValue(error);

            await expect(
                candidateRepository.delete("candidate-1")
            ).rejects.toBe(error);
        });
    });
});
