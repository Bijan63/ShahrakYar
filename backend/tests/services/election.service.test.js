jest.mock("../../src/repositories/election.repository", () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    openElection: jest.fn(),
    closeElection: jest.fn(),
    getResult: jest.fn(),
}));

jest.mock("../../src/repositories/complex.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/election-access.service", () => ({
    assertCanManageElection: jest.fn(),
    assertCanReadElection: jest.fn(),
    getReadableComplexIds: jest.fn(),
}));

const AppError = require("../../src/utils/AppError");
const electionRepository = require("../../src/repositories/election.repository");
const complexRepository = require("../../src/repositories/complex.repository");
const electionAccessService = require("../../src/services/election-access.service");
const electionService = require("../../src/services/election.service");

const admin = { id: "admin-1", role: "ADMIN" };
const manager = { id: "manager-1", role: "MANAGER" };

const validData = (overrides = {}) => ({
    title: "  Board Election  ",
    description: "Board election description",
    startDate: "2026-11-01T09:00:00.000Z",
    endDate: "2026-11-02T09:00:00.000Z",
    complexId: "complex-1",
    ...overrides,
});

const makeElection = (overrides = {}) => ({
    id: "election-1",
    title: "Board Election",
    status: "DRAFT",
    complexId: "complex-1",
    startDate: new Date("2026-11-01T09:00:00.000Z"),
    endDate: new Date("2026-11-02T09:00:00.000Z"),
    ...overrides,
});

describe("ElectionService", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        electionRepository.create.mockResolvedValue(
            makeElection()
        );
        electionRepository.findById.mockResolvedValue(
            makeElection()
        );
        electionRepository.findAll.mockResolvedValue([]);
        electionRepository.openElection.mockResolvedValue(
            makeElection({ status: "OPEN" })
        );
        electionRepository.closeElection.mockResolvedValue(
            makeElection({ status: "CLOSED" })
        );
        electionRepository.getResult.mockResolvedValue(
            makeElection({ candidates: [] })
        );

        complexRepository.findById.mockResolvedValue({
            id: "complex-1",
            name: "Test Complex",
        });

        electionAccessService.assertCanManageElection.mockResolvedValue(
            undefined
        );
        electionAccessService.assertCanReadElection.mockResolvedValue(
            undefined
        );
        electionAccessService.getReadableComplexIds.mockResolvedValue(null);
    });

    describe("createElection", () => {
        test.each([
            ["non-string title", { title: 123 }],
            ["blank title", { title: "   " }],
            ["missing start date", { startDate: undefined }],
            ["missing end date", { endDate: undefined }],
            ["non-string complex ID", { complexId: 123 }],
            ["blank complex ID", { complexId: "   " }],
        ])("rejects invalid input: %s", async (_label, overrides) => {
            await expect(
                electionService.createElection(
                    validData(overrides),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message:
                    "Title, start date, end date and complexId are required.",
            });

            expect(complexRepository.findById).not.toHaveBeenCalled();
            expect(electionRepository.create).not.toHaveBeenCalled();
        });

        test("rejects an invalid start date", async () => {
            await expect(
                electionService.createElection(
                    validData({ startDate: "not-a-date" }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid start date.",
            });

            expect(complexRepository.findById).not.toHaveBeenCalled();
        });

        test("rejects an invalid end date", async () => {
            await expect(
                electionService.createElection(
                    validData({ endDate: "not-a-date" }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid end date.",
            });

            expect(complexRepository.findById).not.toHaveBeenCalled();
        });

        test.each([
            ["equal dates", "2026-11-01T09:00:00.000Z"],
            ["end before start", "2026-10-31T09:00:00.000Z"],
        ])("rejects when the end date is invalid: %s", async (_label, endDate) => {
            await expect(
                electionService.createElection(
                    validData({
                        startDate: "2026-11-01T09:00:00.000Z",
                        endDate,
                    }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "End date must be after start date.",
            });

            expect(complexRepository.findById).not.toHaveBeenCalled();
        });

        test("returns 404 when the complex does not exist", async () => {
            complexRepository.findById.mockResolvedValue(null);

            await expect(
                electionService.createElection(validData(), admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Complex not found.",
            });

            expect(electionAccessService.assertCanManageElection)
                .not.toHaveBeenCalled();
            expect(electionRepository.create).not.toHaveBeenCalled();
        });

        test("propagates election management access denial", async () => {
            const error = new AppError("Forbidden.", 403);
            electionAccessService.assertCanManageElection
                .mockRejectedValue(error);

            await expect(
                electionService.createElection(validData(), manager)
            ).rejects.toBe(error);

            expect(electionAccessService.assertCanManageElection)
                .toHaveBeenCalledWith(manager, {
                    complexId: "complex-1",
                });
            expect(electionRepository.create).not.toHaveBeenCalled();
        });

        test("creates a DRAFT election with trimmed title and parsed dates", async () => {
            const data = validData();
            const created = makeElection({
                title: "Board Election",
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
            });
            electionRepository.create.mockResolvedValue(created);

            const result = await electionService.createElection(data, admin);

            expect(complexRepository.findById).toHaveBeenCalledWith(
                data.complexId
            );
            expect(electionAccessService.assertCanManageElection)
                .toHaveBeenCalledWith(admin, {
                    complexId: data.complexId,
                });
            expect(electionRepository.create).toHaveBeenCalledWith({
                title: "Board Election",
                description: data.description,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                complexId: data.complexId,
                status: "DRAFT",
            });
            expect(result).toBe(created);
        });
    });

    describe("getElection", () => {
        test("returns an election after read access is checked", async () => {
            const election = makeElection();
            electionRepository.findById.mockResolvedValue(election);

            const result = await electionService.getElection(
                election.id,
                manager
            );

            expect(electionRepository.findById).toHaveBeenCalledWith(
                election.id
            );
            expect(electionAccessService.assertCanReadElection)
                .toHaveBeenCalledWith(manager, election);
            expect(result).toBe(election);
        });

        test("propagates read access errors", async () => {
            const election = makeElection();
            const error = new AppError("Forbidden.", 403);
            electionRepository.findById.mockResolvedValue(election);
            electionAccessService.assertCanReadElection
                .mockRejectedValue(error);

            await expect(
                electionService.getElection(election.id, manager)
            ).rejects.toBe(error);
        });
    });

    describe("getElections", () => {
        test("returns all elections when readable complex IDs are null", async () => {
            const elections = [
                makeElection(),
                makeElection({
                    id: "election-2",
                    complexId: "complex-2",
                }),
                makeElection({
                    id: "election-3",
                    complexId: null,
                }),
            ];
            electionRepository.findAll.mockResolvedValue(elections);
            electionAccessService.getReadableComplexIds
                .mockResolvedValue(null);

            const result = await electionService.getElections(admin);

            expect(electionRepository.findAll).toHaveBeenCalled();
            expect(electionAccessService.getReadableComplexIds)
                .toHaveBeenCalledWith(admin);
            expect(result).toBe(elections);
        });

        test("filters elections to readable complexes and excludes unassigned elections", async () => {
            const allowed = makeElection({
                id: "election-1",
                complexId: "complex-1",
            });
            const denied = makeElection({
                id: "election-2",
                complexId: "complex-2",
            });
            const unassigned = makeElection({
                id: "election-3",
                complexId: null,
            });

            electionRepository.findAll.mockResolvedValue([
                allowed,
                denied,
                unassigned,
            ]);
            electionAccessService.getReadableComplexIds
                .mockResolvedValue(["complex-1"]);

            const result = await electionService.getElections(manager);

            expect(result).toEqual([allowed]);
        });

        test("returns an empty list when no elections match the readable complexes", async () => {
            electionRepository.findAll.mockResolvedValue([
                makeElection(),
                makeElection({
                    id: "election-2",
                    complexId: null,
                }),
            ]);
            electionAccessService.getReadableComplexIds
                .mockResolvedValue([]);

            const result = await electionService.getElections(manager);

            expect(result).toEqual([]);
        });
    });

    describe("openElection", () => {
        test("returns 404 when the election does not exist", async () => {
            electionRepository.findById.mockResolvedValue(null);

            await expect(
                electionService.openElection("missing-election")
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(electionRepository.openElection).not.toHaveBeenCalled();
        });

        test("rejects elections that have no complex assigned", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ complexId: null })
            );

            await expect(
                electionService.openElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "Election must be assigned to a Complex before it can be opened.",
            });
        });

        test("rejects an election that is already open", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "OPEN" })
            );

            await expect(
                electionService.openElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Election is already open.",
            });
        });

        test("rejects reopening a closed election", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "CLOSED" })
            );

            await expect(
                electionService.openElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Closed election cannot be reopened.",
            });
        });

        test("rejects opening an election from an unsupported status", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "CANCELLED" })
            );

            await expect(
                electionService.openElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "Election cannot be opened from status CANCELLED.",
            });
        });

        test("opens a DRAFT election", async () => {
            const opened = makeElection({ status: "OPEN" });
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "DRAFT" })
            );
            electionRepository.openElection.mockResolvedValue(opened);

            const result = await electionService.openElection("election-1");

            expect(electionRepository.openElection).toHaveBeenCalledWith(
                "election-1"
            );
            expect(result).toBe(opened);
        });
    });

    describe("closeElection", () => {
        test("returns 404 when the election does not exist", async () => {
            electionRepository.findById.mockResolvedValue(null);

            await expect(
                electionService.closeElection("missing-election")
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(electionRepository.closeElection).not.toHaveBeenCalled();
        });

        test("rejects closing an election that is already closed", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "CLOSED" })
            );

            await expect(
                electionService.closeElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Election already closed.",
            });
        });

        test("rejects closing an election that is not open", async () => {
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "DRAFT" })
            );

            await expect(
                electionService.closeElection("election-1")
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Election cannot be closed from status DRAFT.",
            });

            expect(electionRepository.closeElection).not.toHaveBeenCalled();
        });

        test("closes an OPEN election", async () => {
            const closed = makeElection({ status: "CLOSED" });
            electionRepository.findById.mockResolvedValue(
                makeElection({ status: "OPEN" })
            );
            electionRepository.closeElection.mockResolvedValue(closed);

            const result = await electionService.closeElection("election-1");

            expect(electionRepository.closeElection).toHaveBeenCalledWith(
                "election-1"
            );
            expect(result).toBe(closed);
        });
    });

    describe("getResult", () => {
        test("propagates election read access errors", async () => {
            const election = makeElection({ candidates: [] });
            const error = new AppError("Forbidden.", 403);
            electionRepository.getResult.mockResolvedValue(election);
            electionAccessService.assertCanReadElection
                .mockRejectedValue(error);

            await expect(
                electionService.getResult(election.id, manager)
            ).rejects.toBe(error);
        });

        test("calculates total votes and percentage rounded to two decimals", async () => {
            const election = makeElection({
                candidates: [
                    {
                        id: "candidate-1",
                        fullName: "Ali",
                        votes: [{ id: "v1" }],
                    },
                    {
                        id: "candidate-2",
                        fullName: "Sara",
                        votes: [{ id: "v2" }, { id: "v3" }],
                    },
                ],
            });
            electionRepository.getResult.mockResolvedValue(election);

            const result = await electionService.getResult(
                election.id,
                admin
            );

            expect(electionRepository.getResult).toHaveBeenCalledWith(
                election.id
            );
            expect(electionAccessService.assertCanReadElection)
                .toHaveBeenCalledWith(admin, election);
            expect(result).toEqual({
                election: {
                    id: election.id,
                    title: election.title,
                    status: election.status,
                },
                totalVotes: 3,
                candidates: [
                    {
                        id: "candidate-1",
                        fullName: "Ali",
                        votes: 1,
                        percent: 33.33,
                    },
                    {
                        id: "candidate-2",
                        fullName: "Sara",
                        votes: 2,
                        percent: 66.67,
                    },
                ],
            });
        });

        test("returns zero percent when no votes have been cast", async () => {
            const election = makeElection({
                candidates: [
                    {
                        id: "candidate-1",
                        fullName: "Ali",
                        votes: [],
                    },
                    {
                        id: "candidate-2",
                        fullName: "Sara",
                        votes: [],
                    },
                ],
            });
            electionRepository.getResult.mockResolvedValue(election);

            const result = await electionService.getResult(
                election.id,
                admin
            );

            expect(result.totalVotes).toBe(0);
            expect(result.candidates).toEqual([
                {
                    id: "candidate-1",
                    fullName: "Ali",
                    votes: 0,
                    percent: 0,
                },
                {
                    id: "candidate-2",
                    fullName: "Sara",
                    votes: 0,
                    percent: 0,
                },
            ]);
        });
    });
});
