const authorize = require("../../src/middleware/role.middleware");

describe("Role authorization middleware", () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {};
        res = {};
        next = jest.fn();
    });

    test("returns 401 when req.user is missing", () => {
        authorize("ADMIN")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                message: "Unauthorized",
                statusCode: 401,
            })
        );
    });

    test("returns 403 when the user's role is not allowed", () => {
        req.user = { id: "user-1", role: "USER" };

        authorize("ADMIN", "MANAGER")(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                message: "Forbidden",
                statusCode: 403,
            })
        );
    });

    test("allows an ADMIN when ADMIN is permitted", () => {
        req.user = { id: "admin-1", role: "ADMIN" };

        authorize("ADMIN", "MANAGER")(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    test("allows a MANAGER when MANAGER is permitted", () => {
        req.user = { id: "manager-1", role: "MANAGER" };

        authorize("ADMIN", "MANAGER")(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    test("allows a USER when USER is permitted", () => {
        req.user = { id: "user-1", role: "USER" };

        authorize("USER")(req, res, next);

        expect(next).toHaveBeenCalledWith();
    });

    test("rejects a role when no allowed roles are provided", () => {
        req.user = { id: "admin-1", role: "ADMIN" };

        authorize()(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0][0]).toEqual(
            expect.objectContaining({
                message: "Forbidden",
                statusCode: 403,
            })
        );
    });
});
