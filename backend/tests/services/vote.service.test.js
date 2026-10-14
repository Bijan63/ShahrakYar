const mockGetIO = jest.fn();
const mockEmit = jest.fn();

jest.mock("../../src/socket/socket", () => ({
    getIO: mockGetIO,
}));

jest.mock("../../src/config/prisma", () => ({
    ownership: {
        findFirst: jest.fn(),
    },
}));

jest.mock("../../src/repositories/vote.repository", () => ({
    create: jest.fn(),
    findByVoterAndElection: jest.fn(),
    getElectionResult: jest.fn(),
}));

jest.mock("../../src/repositories/election.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/election-access.service", () => ({
    assertCanReadElection: jest.fn(),
    assertCanManageElection: jest.fn(),
}));

jest.mock("../../src/repositories/candidate.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
    findByIdWithPerson: jest.fn(),
}));

jest.mock("../../src/repositories/resident.repository", () => ({
    findById: jest.fn(),
}));

const voteService = require("../../src/services/vote.service");
const prisma = require("../../src/config/prisma");
const voteRepository = require("../../src/repositories/vote.repository");
const electionRepository = require("../../src/repositories/election.repository");
const electionAccessService = require("../../src/services/election-access.service");
const candidateRepository = require("../../src/repositories/candidate.repository");
const userRepository = require("../../src/repositories/user.repository");
const residentRepository = require("../../src/repositories/resident.repository");

describe("VoteService unit tests", () => {
    const userId = "user-1";
    const voterId = "person-1";
    const electionId = "election-1";
    const candidateId = "candidate-1";
    const residentId = "resident-1";

    const user = {
        id: userId,
        status: "ACTIVE",
        person: {
            id: voterId,
            status: "ACTIVE",
        },
    };

    const election = {
        id: electionId,
        status: "OPEN",
        complexId: "complex-1",
        startDate: new Date(Date.now() - 60_000),
        endDate: new Date(Date.now() + 60_000),
    };

    const candidate = {
        id: candidateId,
        electionId,
    };

    const ownership = {
        id: "ownership-1",
        percentage: 100,
        startDate: new Date(Date.now() - 60_000),
        endDate: null,
        property: {
            id: "property-1",
            code: "VILLA-001",
            complexId: "complex-1",
        },
    };

    const vote = {
        id: "vote-1",
        electionId,
        voterId,
        candidateId,
    };

    function configureValidVote() {
        userRepository.findByIdWithPerson.mockResolvedValue(user);
        electionAccessService.assertCanReadElection.mockResolvedValue(undefined);
        electionRepository.findById.mockResolvedValue(election);
        prisma.ownership.findFirst.mockResolvedValue(ownership);
        candidateRepository.findById.mockResolvedValue(candidate);
        residentRepository.findById.mockResolvedValue({
            id: residentId,
            personId: voterId,
        });
        voteRepository.findByVoterAndElection.mockResolvedValue(null);
        voteRepository.create.mockResolvedValue(vote);
        mockGetIO.mockReturnValue({ emit: mockEmit });
    }

    beforeEach(() => {
        jest.clearAllMocks();
        configureValidVote();
    });

    test("rejects a missing authenticated user", async () => {
        await expect(
            voteService.createVote(null, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("rejects an inactive user account", async () => {
        userRepository.findByIdWithPerson.mockResolvedValue({
            ...user,
            status: "INACTIVE",
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 403 });

        expect(electionRepository.findById).not.toHaveBeenCalled();
    });

    test("includes residentId when a resident is supplied", async () => {
        const result = await voteService.createVote(userId, {
            electionId,
            candidateId,
            residentId,
        });

        expect(result).toEqual(vote);
        expect(voteRepository.create).toHaveBeenCalledWith({
            electionId,
            voterId,
            candidateId,
            residentId,
        });
    });

    test("converts a P2002 database error to a 409 conflict", async () => {
        voteRepository.create.mockRejectedValue({
            code: "P2002",
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    test("rethrows unexpected vote repository errors", async () => {
        const databaseError = new Error("Database unavailable");
        voteRepository.create.mockRejectedValue(databaseError);

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toBe(databaseError);
    });

    test("returns the saved vote even when getIO throws", async () => {
        const error = new Error("Socket unavailable");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mockGetIO.mockImplementation(() => {
            throw error;
        });

        try {
            await expect(
                voteService.createVote(userId, { electionId, candidateId })
            ).resolves.toEqual(vote);

            expect(consoleSpy).toHaveBeenCalled();
        } finally {
            consoleSpy.mockRestore();
        }
    });

    test("returns the saved vote even when socket emit throws", async () => {
        const error = new Error("Emit failed");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mockEmit.mockImplementation(() => {
            throw error;
        });

        try {
            await expect(
                voteService.createVote(userId, { electionId, candidateId })
            ).resolves.toEqual(vote);

            expect(consoleSpy).toHaveBeenCalled();
        } finally {
            consoleSpy.mockRestore();
        }
    });
     test("rejects missing candidateId", async () => {
        await expect(
            voteService.createVote(userId, { electionId })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(userRepository.findByIdWithPerson).not.toHaveBeenCalled();
    });

    test("rejects a user that does not exist", async () => {
        userRepository.findByIdWithPerson.mockResolvedValue(null);

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("rejects a user not linked to a Person", async () => {
        userRepository.findByIdWithPerson.mockResolvedValue({
            ...user,
            person: null,
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("rejects an inactive Person", async () => {
        userRepository.findByIdWithPerson.mockResolvedValue({
            ...user,
            person: { ...user.person, status: "INACTIVE" },
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("rejects a missing election", async () => {
        electionRepository.findById.mockResolvedValue(null);

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("rejects an election that is not open", async () => {
        electionRepository.findById.mockResolvedValue({
            ...election,
            status: "DRAFT",
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("rejects an election without a complex", async () => {
        electionRepository.findById.mockResolvedValue({
            ...election,
            complexId: null,
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 409 });
    });

    test("rejects voting when the voter has no active ownership", async () => {
        prisma.ownership.findFirst.mockResolvedValue(null);

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 403 });

        expect(candidateRepository.findById).not.toHaveBeenCalled();
        expect(voteRepository.create).not.toHaveBeenCalled();
    });  
       test("rejects an election with invalid voting dates", async () => {
        electionRepository.findById.mockResolvedValue({
            ...election,
            startDate: "invalid-date",
            endDate: "also-invalid",
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 500 });

        expect(prisma.ownership.findFirst).not.toHaveBeenCalled();
    });

    test("rejects voting outside the election date range", async () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        electionRepository.findById.mockResolvedValue({
            ...election,
            startDate: yesterday,
            endDate: yesterday,
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(prisma.ownership.findFirst).not.toHaveBeenCalled();
    });
    test("rejects a missing candidate", async () => {
        candidateRepository.findById.mockResolvedValue(null);

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(voteRepository.create).not.toHaveBeenCalled();
    });

    test("rejects a candidate from another election", async () => {
        candidateRepository.findById.mockResolvedValue({
            ...candidate,
            electionId: "another-election-id",
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(voteRepository.create).not.toHaveBeenCalled();
    });

    test("rejects a missing resident when residentId is supplied", async () => {
        residentRepository.findById.mockResolvedValue(null);

        await expect(
            voteService.createVote(userId, {
                electionId,
                candidateId,
                residentId,
            })
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(voteRepository.create).not.toHaveBeenCalled();
    });

    test("rejects a resident belonging to another person", async () => {
        residentRepository.findById.mockResolvedValue({
            id: residentId,
            personId: "another-person-id",
        });

        await expect(
            voteService.createVote(userId, {
                electionId,
                candidateId,
                residentId,
            })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(voteRepository.create).not.toHaveBeenCalled();
    });

    test("rejects a duplicate vote", async () => {
        voteRepository.findByVoterAndElection.mockResolvedValue({
            id: "existing-vote-id",
            electionId,
            voterId,
            candidateId,
        });

        await expect(
            voteService.createVote(userId, { electionId, candidateId })
        ).rejects.toMatchObject({ statusCode: 409 });

        expect(voteRepository.create).not.toHaveBeenCalled();
    });    

    test("rejects an empty election ID when reading results", async () => {
        await expect(
            voteService.getElectionResult("", { id: userId })
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(electionRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a missing election when reading results", async () => {
        electionRepository.findById.mockResolvedValue(null);

        await expect(
            voteService.getElectionResult(electionId, { id: userId })
        ).rejects.toMatchObject({ statusCode: 404 });

        expect(voteRepository.getElectionResult).not.toHaveBeenCalled();
    });

    test("does not return results when access is denied", async () => {
        const accessError = new Error("Forbidden");
        electionAccessService.assertCanReadElection.mockRejectedValue(accessError);

        await expect(
            voteService.getElectionResult(electionId, { id: userId })
        ).rejects.toBe(accessError);

        expect(voteRepository.getElectionResult).not.toHaveBeenCalled();
    });

    test("returns results after successful access validation", async () => {
        const results = [{ id: candidateId, votes: 2 }];
        voteRepository.getElectionResult.mockResolvedValue(results);

        await expect(
            voteService.getElectionResult(electionId, { id: userId })
        ).resolves.toEqual(results);

        expect(electionAccessService.assertCanReadElection).toHaveBeenCalledWith(
            { id: userId },
            election
        );
    });
});


