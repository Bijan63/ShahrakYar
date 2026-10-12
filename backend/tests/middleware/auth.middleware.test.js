const jwt = require("jsonwebtoken");
const config = require("../../src/config");

jest.mock("../../src/repositories/user.repository", () => ({
    findById: jest.fn(),
}));

const userRepository = require("../../src/repositories/user.repository");
const authMiddleware = require("../../src/middleware/auth.middleware");

describe("Authentication middleware", () => {
    let req;
    let res;
    let next;

    const makeToken = (payload = { id: "user-1" }, options = {}) =>
        jwt.sign(payload, config.jwt.secret, options);

    beforeEach(() => {
        jest.clearAllMocks();

        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        next = jest.fn();
    });

    test("rejects a request without an authorization header", async () => {
        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Access token is required.",
        });
        expect(next).not.toHaveBeenCalled();
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects an empty Bearer token", async () => {
        req.headers.authorization = "Bearer   ";

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Access token is required.",
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects an invalid token", async () => {
        req.headers.authorization = "Bearer invalid-test-token";

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid token",
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects an expired token", async () => {
        req.headers.authorization = `Bearer ${makeToken(
            { id: "user-1" },
            { expiresIn: -1 }
        )}`;

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid token",
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a validly signed token without a user ID", async () => {
        req.headers.authorization = `Bearer ${makeToken({ role: "ADMIN" })}`;

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid token",
        });
        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a token when the user no longer exists", async () => {
        req.headers.authorization = `Bearer ${makeToken()}`;
        userRepository.findById.mockResolvedValue(null);

        await authMiddleware(req, res, next);

        expect(userRepository.findById).toHaveBeenCalledWith("user-1");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: "Invalid token",
        });
        expect(next).not.toHaveBeenCalled();
    });

    test("blocks an inactive account", async () => {
        req.headers.authorization = `Bearer ${makeToken()}`;
        userRepository.findById.mockResolvedValue({
            id: "user-1",
            role: "USER",
            status: "INACTIVE",
            personId: null,
        });

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                message: "User is inactive or blocked.",
            })
        );
        expect(res.status).not.toHaveBeenCalled();
    });

    test("uses the current database role instead of a stale token role", async () => {
        req.headers.authorization = `Bearer ${makeToken({
            id: "user-1",
            role: "ADMIN",
        })}`;

        userRepository.findById.mockResolvedValue({
            id: "user-1",
            role: "USER",
            status: "ACTIVE",
            personId: "person-1",
        });

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toEqual(
            expect.objectContaining({
                id: "user-1",
                role: "USER",
                status: "ACTIVE",
                personId: "person-1",
            })
        );
    });

    test("passes database errors to the error handler", async () => {
        const databaseError = new Error("Database unavailable");

        req.headers.authorization = `Bearer ${makeToken()}`;
        userRepository.findById.mockRejectedValue(databaseError);

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledWith(databaseError);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
    });
});
