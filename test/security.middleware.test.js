"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const authenticate = require("../src/middleware/mainBackendAuth.middleware");
const adminOnly = require("../src/middleware/financeAdminOnly.middleware");

function makeContext(token) {
    const req = { headers: {} };
    if (token !== undefined) {
        req.headers.authorization = token;
    }

    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        },
    };

    let nextCalls = 0;

    return {
        req,
        res,
        next() {
            nextCalls += 1;
        },
        get nextCalls() {
            return nextCalls;
        },
    };
}

function fakeResponse(status, payload) {
    return {
        status,
        ok: status >= 200 && status < 300,
        async json() {
            return payload;
        },
    };
}

test("finance authentication and ADMIN-only authorization", async () => {
    const originalFetch = global.fetch;

    try {
        // Missing token must be rejected before contacting the main backend.
        let ctx = makeContext();
        await authenticate(ctx.req, ctx.res, ctx.next);
        assert.equal(ctx.res.statusCode, 401);
        assert.equal(ctx.nextCalls, 0);

        // Invalid token must be rejected.
        global.fetch = async () =>
            fakeResponse(401, { message: "Invalid token" });

        ctx = makeContext("Bearer invalid-token");
        await authenticate(ctx.req, ctx.res, ctx.next);
        assert.equal(ctx.res.statusCode, 401);
        assert.equal(ctx.nextCalls, 0);

        // An unavailable main backend must fail closed.
        global.fetch = async () => {
            throw new Error("simulated connection failure");
        };

        ctx = makeContext("Bearer valid-looking-token");
        await authenticate(ctx.req, ctx.res, ctx.next);
        assert.equal(ctx.res.statusCode, 503);
        assert.equal(ctx.nextCalls, 0);

        // A valid MANAGER profile authenticates, but finance authorization denies it.
        global.fetch = async (url, options) => {
            assert.match(url, /\/api\/users\/profile$/);
            assert.equal(
                options.headers.Authorization,
                "Bearer manager-test-token"
            );

            return fakeResponse(200, {
                success: true,
                user: {
                    id: "manager-test-id",
                    role: "MANAGER",
                    personId: null,
                    fullName: "Test Manager",
                    email: "manager@example.test",
                },
            });
        };

        const manager = makeContext("Bearer manager-test-token");
        await authenticate(manager.req, manager.res, manager.next);

        assert.equal(manager.nextCalls, 1);
        assert.equal(manager.req.user.role, "MANAGER");

        adminOnly(manager.req, manager.res, manager.next);
        assert.equal(manager.res.statusCode, 403);
        assert.match(manager.res.body.message, /Administrator/i);

        // ADMIN is allowed through the role middleware.
        const admin = makeContext("Bearer admin-test-token");
        admin.req.user = { id: "admin-test-id", role: "ADMIN" };

        adminOnly(admin.req, admin.res, admin.next);
        assert.equal(admin.nextCalls, 1);

        // Authorization without an authenticated user must be rejected.
        const anonymous = makeContext();
        adminOnly(anonymous.req, anonymous.res, anonymous.next);
        assert.equal(anonymous.res.statusCode, 401);
    } finally {
        global.fetch = originalFetch;
    }
});
