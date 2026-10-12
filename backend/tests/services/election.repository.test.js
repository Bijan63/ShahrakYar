jest.mock("../../src/config/prisma", () => ({
    election: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const electionRepository = require("../../src/repositories/election.repository");

describe("ElectionRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("create", () => {
        test("creates an election with the supplied data", async () => {
            const data = {
                title: "Board Election",
                status: "DRAFT",
            };
            const created = {
                id: "election-1",
                ...data,
            };

            prisma.election.create.mockResolvedValue(created);

            const result = await electionRepository.create(data);

            expect(prisma.election.create).toHaveBeenCalledWith({
                data,
            });
            expect(result).toBe(created);
        });

        test("propagates a Prisma creation error", async () => {
            const error = new Error("Create failed");
            prisma.election.create.mockRejectedValue(error);

            await expect(
                electionRepository.create({ title: "Election" })
            ).rejects.toBe(error);
        });
    });

    describe("findById", () => {
        test("finds an election by ID and includes candidates", async () => {
            const election = {
                id: "election-1",
                candidates: [],
            };

            prisma.election.findUnique.mockResolvedValue(election);

            const result =
                await electionRepository.findById("election-1");

            expect(prisma.election.findUnique).toHaveBeenCalledWith({
                where: { id: "election-1" },
                include: {
                    candidates: true,
                },
            });
            expect(result).toBe(election);
        });

        test("returns null when the election does not exist", async () => {
            prisma.election.findUnique.mockResolvedValue(null);

            await expect(
                electionRepository.findById("missing-election")
            ).resolves.toBeNull();
        });
    });

    describe("findAll", () => {
        test("returns all elections ordered by descending start date", async () => {
            const elections = [
                { id: "election-2" },
                { id: "election-1" },
            ];

            prisma.election.findMany.mockResolvedValue(elections);

            const result = await electionRepository.findAll();

            expect(prisma.election.findMany).toHaveBeenCalledWith({
                orderBy: {
                    startDate: "desc",
                },
            });
            expect(result).toBe(elections);
        });

        test("propagates a Prisma query error", async () => {
            const error = new Error("Query failed");
            prisma.election.findMany.mockRejectedValue(error);

            await expect(
                electionRepository.findAll()
            ).rejects.toBe(error);
        });
    });

    describe("update", () => {
        test("updates an election with the supplied data", async () => {
            const id = "election-1";
            const data = {
                title: "Updated Election",
            };
            const updated = {
                id,
                ...data,
            };

            prisma.election.update.mockResolvedValue(updated);

            const result = await electionRepository.update(id, data);

            expect(prisma.election.update).toHaveBeenCalledWith({
                where: { id },
                data,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        test("deletes an election by ID", async () => {
            const deleted = {
                id: "election-1",
                title: "Board Election",
            };

            prisma.election.delete.mockResolvedValue(deleted);

            const result =
                await electionRepository.delete("election-1");

            expect(prisma.election.delete).toHaveBeenCalledWith({
                where: {
                    id: "election-1",
                },
            });
            expect(result).toBe(deleted);
        });
    });

    describe("openElection", () => {
        test("changes election status to OPEN", async () => {
            const opened = {
                id: "election-1",
                status: "OPEN",
            };

            prisma.election.update.mockResolvedValue(opened);

            const result =
                await electionRepository.openElection("election-1");

            expect(prisma.election.update).toHaveBeenCalledWith({
                where: {
                    id: "election-1",
                },
                data: {
                    status: "OPEN",
                },
            });
            expect(result).toBe(opened);
        });
    });

    describe("closeElection", () => {
        test("changes election status to CLOSED", async () => {
            const closed = {
                id: "election-1",
                status: "CLOSED",
            };

            prisma.election.update.mockResolvedValue(closed);

            const result =
                await electionRepository.closeElection("election-1");

            expect(prisma.election.update).toHaveBeenCalledWith({
                where: {
                    id: "election-1",
                },
                data: {
                    status: "CLOSED",
                },
            });
            expect(result).toBe(closed);
        });
    });

    describe("getResult", () => {
        test("fetches an election with candidates and their votes", async () => {
            const election = {
                id: "election-1",
                candidates: [
                    {
                        id: "candidate-1",
                        votes: [{ id: "vote-1" }],
                    },
                ],
            };

            prisma.election.findUnique.mockResolvedValue(election);

            const result =
                await electionRepository.getResult("election-1");

            expect(prisma.election.findUnique).toHaveBeenCalledWith({
                where: {
                    id: "election-1",
                },
                include: {
                    candidates: {
                        include: {
                            votes: true,
                        },
                    },
                },
            });
            expect(result).toBe(election);
        });

        test("returns null when the election result is not found", async () => {
            prisma.election.findUnique.mockResolvedValue(null);

            await expect(
                electionRepository.getResult("missing-election")
            ).resolves.toBeNull();
        });

        test("propagates a Prisma result query error", async () => {
            const error = new Error("Result query failed");
            prisma.election.findUnique.mockRejectedValue(error);

            await expect(
                electionRepository.getResult("election-1")
            ).rejects.toBe(error);
        });
    });
});
