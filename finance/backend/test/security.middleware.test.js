
const test = require("node:test");
const assert = require("node:assert/strict");

const authenticate =
    require("../src/middleware/mainBackendAuth.middleware");

const adminOnly =
    require("../src/middleware/financeAdminOnly.middleware");


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


function fakeResponse(status, payload, jsonError = false) {
    return {
        status,

        ok: status >= 200 && status < 300,

        async json() {
            if (jsonError) {
                throw new Error("Invalid JSON response");
            }

            return payload;
        },
    };
}


test(
    "Finance authentication and ADMIN-only authorization",
    async (t) => {
        const originalFetch = global.fetch;

        try {

            await t.test(
                "Reject missing and malformed authorization headers",
                async () => {
                    let fetchCalls = 0;

                    global.fetch = async () => {
                        fetchCalls++;
                        return fakeResponse(200, {});
                    };

                    const invalidHeaders = [
                        undefined,
                        "Basic invalid-token",
                        "Bearer ",
                        "Bearer    ",
                    ];

                    for (const token of invalidHeaders) {
                        const ctx = makeContext(token);

                        await authenticate(
                            ctx.req,
                            ctx.res,
                            ctx.next
                        );

                        assert.equal(ctx.res.statusCode, 401);
                        assert.equal(ctx.nextCalls, 0);
                    }

                    assert.equal(fetchCalls, 0);
                }
            );


            await t.test(
                "Reject invalid or expired token",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(401, {
                            message: "Invalid token",
                        });

                    const ctx = makeContext(
                        "Bearer invalid-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 401);
                    assert.equal(ctx.nextCalls, 0);

                    assert.match(
                        ctx.res.body.message,
                        /Invalid or expired/
                    );
                }
            );


            await t.test(
                "Reject inactive or forbidden user",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(403, {
                            message: "Access denied",
                        });

                    const ctx = makeContext(
                        "Bearer inactive-user-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 403);
                    assert.equal(ctx.nextCalls, 0);
                }
            );


            await t.test(
                "Fail closed when main backend is unavailable",
                async () => {
                    global.fetch = async () => {
                        throw new Error(
                            "Simulated connection failure"
                        );
                    };

                    const ctx = makeContext(
                        "Bearer valid-looking-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 503);
                    assert.equal(ctx.nextCalls, 0);
                }
            );


            await t.test(
                "Return 503 for unexpected upstream HTTP errors",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(500, {
                            message: "Internal server error",
                        });

                    const ctx = makeContext(
                        "Bearer valid-looking-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 503);
                    assert.equal(ctx.nextCalls, 0);
                }
            );


            await t.test(
                "Reject malformed authentication response",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(200, null, true);

                    const ctx = makeContext(
                        "Bearer valid-looking-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 401);
                    assert.equal(ctx.nextCalls, 0);
                }
            );


            await t.test(
                "Reject unsupported user role",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(200, {
                            success: true,
                            user: {
                                id: "unknown-user",
                                role: "SUPERUSER",
                            },
                        });

                    const ctx = makeContext(
                        "Bearer unsupported-role-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 401);
                    assert.equal(ctx.nextCalls, 0);
                }
            );


            await t.test(
                "Authenticate MANAGER but deny finance access",
                async () => {
                    global.fetch = async (url, options) => {
                        assert.match(
                            url,
                            /\/api\/users\/profile$/
                        );

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

                    const ctx = makeContext(
                        "Bearer manager-test-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.nextCalls, 1);
                    assert.equal(
                        ctx.req.user.role,
                        "MANAGER"
                    );

                    adminOnly(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 403);

                    assert.equal(ctx.nextCalls, 1);

                    assert.match(
                        ctx.res.body.message,
                        /Administrator access required/
                    );
                }
            );


            await t.test(
                "Authenticate USER but deny finance access",
                async () => {
                    global.fetch = async () =>
                        fakeResponse(200, {
                            success: true,
                            user: {
                                id: "user-test-id",
                                role: "USER",
                                personId: "person-test-id",
                                fullName: "Test User",
                                email: "user@example.test",
                            },
                        });

                    const ctx = makeContext(
                        "Bearer user-test-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.nextCalls, 1);
                    assert.equal(ctx.req.user.role, "USER");

                    adminOnly(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 403);
                    assert.equal(ctx.nextCalls, 1);
                }
            );


            await t.test(
                "Authenticate ADMIN and allow finance access",
                async () => {
                    global.fetch = async (url, options) => {
                        assert.match(
                            url,
                            /\/api\/users\/profile$/
                        );

                        assert.equal(
                            options.headers.Authorization,
                            "Bearer admin-test-token"
                        );

                        return fakeResponse(200, {
                            success: true,
                            user: {
                                id: "admin-test-id",
                                role: "ADMIN",
                                personId: null,
                                fullName: "Test Admin",
                                email: "admin@example.test",
                            },
                        });
                    };

                    const ctx = makeContext(
                        "Bearer admin-test-token"
                    );

                    await authenticate(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.nextCalls, 1);
                    assert.equal(ctx.req.user.role, "ADMIN");

                    adminOnly(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.nextCalls, 2);
                    assert.equal(ctx.res.statusCode, 200);
                }
            );


            await t.test(
                "Reject authorization without authenticated user",
                async () => {
                    const ctx = makeContext(undefined);

                    adminOnly(
                        ctx.req,
                        ctx.res,
                        ctx.next
                    );

                    assert.equal(ctx.res.statusCode, 401);
                    assert.equal(ctx.nextCalls, 0);

                    assert.match(
                        ctx.res.body.message,
                        /Authentication required/
                    );
                }
            );

        } finally {
            global.fetch = originalFetch;
        }
    }
);
