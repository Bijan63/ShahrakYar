jest.mock("../../src/services/candidate.service", () => ({
    createCandidate: jest.fn(),
    getCandidates: jest.fn(),
    getCandidate: jest.fn(),
    updateCandidate: jest.fn(),
    deleteCandidate: jest.fn(),
}));

const candidateService = require("../../src/services/candidate.service");

const {
    createCandidate,
    getCandidates,
    getCandidate,
    updateCandidate,
    deleteCandidate,
} = require("../../src/controllers/candidate.controller");

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

describe("CandidateController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createCandidate", () => {
        test("returns 201 and the created candidate", async () => {
            const body = {
                electionId: "election-1",
                personId: "person-1",
                biography: "Community member",
            };
            const candidate = {
                id: "candidate-1",
                ...body,
            };
            const req = { body, user };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.createCandidate.mockResolvedValue(candidate);

            await createCandidate(req, res, next);

            expect(candidateService.createCandidate).toHaveBeenCalledWith(
                body,
                user
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                candidate,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Create failed");
            const req = { body: {}, user };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.createCandidate.mockRejectedValue(error);

            await createCandidate(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe("getCandidates", () => {
        test("returns candidates for the requested election", async () => {
            const candidates = [{ id: "candidate-1" }];
            const req = {
                params: { electionId: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.getCandidates.mockResolvedValue(candidates);

            await getCandidates(req, res, next);

            expect(candidateService.getCandidates).toHaveBeenCalledWith(
                "election-1",
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                candidates,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Get candidates failed");
            const req = {
                params: { electionId: "election-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.getCandidates.mockRejectedValue(error);

            await getCandidates(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("getCandidate", () => {
        test("returns the requested candidate", async () => {
            const candidate = { id: "candidate-1" };
            const req = {
                params: { id: "candidate-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.getCandidate.mockResolvedValue(candidate);

            await getCandidate(req, res, next);

            expect(candidateService.getCandidate).toHaveBeenCalledWith(
                "candidate-1",
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                candidate,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Get candidate failed");
            const req = {
                params: { id: "candidate-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.getCandidate.mockRejectedValue(error);

            await getCandidate(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("updateCandidate", () => {
        test("returns the updated candidate", async () => {
            const body = { biography: "Updated biography" };
            const candidate = {
                id: "candidate-1",
                ...body,
            };
            const req = {
                params: { id: "candidate-1" },
                body,
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.updateCandidate.mockResolvedValue(candidate);

            await updateCandidate(req, res, next);

            expect(candidateService.updateCandidate).toHaveBeenCalledWith(
                "candidate-1",
                body,
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                candidate,
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Update failed");
            const req = {
                params: { id: "candidate-1" },
                body: {},
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.updateCandidate.mockRejectedValue(error);

            await updateCandidate(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("deleteCandidate", () => {
        test("returns a successful deletion message", async () => {
            const req = {
                params: { id: "candidate-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.deleteCandidate.mockResolvedValue(true);

            await deleteCandidate(req, res, next);

            expect(candidateService.deleteCandidate).toHaveBeenCalledWith(
                "candidate-1",
                user
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Candidate deleted successfully.",
            });
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Delete failed");
            const req = {
                params: { id: "candidate-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            candidateService.deleteCandidate.mockRejectedValue(error);

            await deleteCandidate(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
