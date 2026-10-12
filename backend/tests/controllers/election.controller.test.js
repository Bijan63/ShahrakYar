jest.mock("../../src/services/election.service", () => ({
    createElection: jest.fn(),
    getElection: jest.fn(),
    getElections: jest.fn(),
    openElection: jest.fn(),
    closeElection: jest.fn(),
    getResult: jest.fn(),
}));

const electionService = require("../../src/services/election.service");

const {
    createElection,
    getElection,
    getElections,
    openElection,
    closeElection,
    getResult,
} = require("../../src/controllers/election.controller");

const user = {
    id: "admin-1",
    role: "ADMIN",
};

const makeResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe("ElectionController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createElection", () => {
        test("returns 201 and the created election", async () => {
            const body = {
                title: "Board Election",
                status: "DRAFT",
            };
            const election = {
                id: "election-1",
                ...body,
            };
            const req = { body, user };
            const res = makeResponse();
            const next = jest.fn();

            electionService.createElection.mockResolvedValue(election);

            await createElection(req, res, next);

            expect(electionService.createElection).toHaveBeenCalledWith(
                body,
                user
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                election,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Create election failed");
            const req = { body: {}, user };
            const res = makeResponse();
            const next = jest.fn();

            electionService.createElection.mockRejectedValue(error);

            await createElection(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe("getElection", () => {
        test("returns the requested election", async () => {
            const election = { id: "election-1" };
            const req = {
                params: { id: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getElection.mockResolvedValue(election);

            await getElection(req, res, next);

            expect(electionService.getElection).toHaveBeenCalledWith(
                "election-1",
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                election,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Get election failed");
            const req = {
                params: { id: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getElection.mockRejectedValue(error);

            await getElection(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getElections", () => {
        test("returns the election list", async () => {
            const elections = [
                { id: "election-1" },
                { id: "election-2" },
            ];
            const req = { user };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getElections.mockResolvedValue(elections);

            await getElections(req, res, next);

            expect(electionService.getElections).toHaveBeenCalledWith(user);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                elections,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("List elections failed");
            const req = { user };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getElections.mockRejectedValue(error);

            await getElections(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("openElection", () => {
        test("returns a success message and the opened election", async () => {
            const election = {
                id: "election-1",
                status: "OPEN",
            };
            const req = {
                params: { id: "election-1" },
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.openElection.mockResolvedValue(election);

            await openElection(req, res, next);

            expect(electionService.openElection).toHaveBeenCalledWith(
                "election-1"
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Election opened successfully.",
                election,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Open election failed");
            const req = {
                params: { id: "election-1" },
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.openElection.mockRejectedValue(error);

            await openElection(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("closeElection", () => {
        test("returns a success message and the closed election", async () => {
            const election = {
                id: "election-1",
                status: "CLOSED",
            };
            const req = {
                params: { id: "election-1" },
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.closeElection.mockResolvedValue(election);

            await closeElection(req, res, next);

            expect(electionService.closeElection).toHaveBeenCalledWith(
                "election-1"
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Election closed successfully.",
                election,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Close election failed");
            const req = {
                params: { id: "election-1" },
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.closeElection.mockRejectedValue(error);

            await closeElection(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getResult", () => {
        test("returns election results for the authenticated user", async () => {
            const result = [
                {
                    candidateId: "candidate-1",
                    votes: 12,
                },
            ];
            const req = {
                params: { id: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getResult.mockResolvedValue(result);

            await getResult(req, res, next);

            expect(electionService.getResult).toHaveBeenCalledWith(
                "election-1",
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                result,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Get election result failed");
            const req = {
                params: { id: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            electionService.getResult.mockRejectedValue(error);

            await getResult(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
