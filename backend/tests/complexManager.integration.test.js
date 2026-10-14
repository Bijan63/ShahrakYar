const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `complex-manager-it-${process.pid}-${Date.now()}`;

const fixture = {
    userIds: [],
    complexIds: [],
};

let admin;
let manager;
let secondManager;
let removalManager;
let inactiveManager;
let regularUser;

let adminToken;
let managerToken;
let secondManagerToken;
let regularUserToken;

let complexA;
let complexB;
let existingAssignment;
let removableAssignment;

let counter = 0;

function tokenFor(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: "1h" }
    );
}

function api(token, method, path) {
    const req = request(app)[method](path);

    return token
        ? req.set("Authorization", `Bearer ${token}`)
        : req;
}

async function makeUser(label, role = "MANAGER", status = "ACTIVE") {
    counter += 1;

    const user = await prisma.user.create({
        data: {
            fullName: `${tag}-${label}`,
            email: `${tag}-${label}-${counter}@example.test`,
            password: await bcrypt.hash("Test-Password-123!", 10),
            role,
            status,
        },
    });

    fixture.userIds.push(user.id);
    return user;
}

async function makeComplex(label) {
    counter += 1;

    const complex = await prisma.complex.create({
        data: {
            name: `${tag}-${label}-${counter}`,
            address: `Test address ${counter}`,
            description: "ComplexManager integration fixture",
        },
    });

    fixture.complexIds.push(complex.id);
    return complex;
}

async function cleanupFixtures() {
    const conditions = [];

    if (fixture.userIds.length) {
        conditions.push({
            userId: { in: fixture.userIds },
        });
    }

    if (fixture.complexIds.length) {
        conditions.push({
            complexId: { in: fixture.complexIds },
        });
    }

    if (conditions.length) {
        await prisma.complexManager.deleteMany({
            where: { OR: conditions },
        });
    }

    if (fixture.complexIds.length) {
        await prisma.complex.deleteMany({
            where: { id: { in: fixture.complexIds } },
        });
    }

    if (fixture.userIds.length) {
        await prisma.user.deleteMany({
            where: { id: { in: fixture.userIds } },
        });
    }
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error("TEST SETUP FAILED: JWT secret is missing.");
    }

    const rows = await prisma.$queryRaw`
        SELECT current_database() AS name
    `;

    if (rows[0]?.name !== "shahrakyar_test") {
        throw new Error(
            `TEST SAFETY STOP: expected shahrakyar_test, got ${rows[0]?.name}`
        );
    }

    admin = await makeUser("admin", "ADMIN");
    manager = await makeUser("manager");
    secondManager = await makeUser("second-manager");
    removalManager = await makeUser("removal-manager");
    inactiveManager = await makeUser("inactive-manager", "MANAGER", "BLOCKED");
    regularUser = await makeUser("regular-user", "USER");

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    secondManagerToken = tokenFor(secondManager);
    regularUserToken = tokenFor(regularUser);

    complexA = await makeComplex("A");
    complexB = await makeComplex("B");

    existingAssignment = await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: complexA.id,
        },
    });

    removableAssignment = await prisma.complexManager.create({
        data: {
            userId: removalManager.id,
            complexId: complexB.id,
        },
    });
});

afterAll(async () => {
    try {
        await cleanupFixtures();
    } finally {
        await prisma.$disconnect();
    }
});

describe("ComplexManager API integration tests", () => {


    test("all endpoints require authentication and ADMIN role", async () => {
        const endpoints = [
            {
                method: "get",
                path: "/api/complex-managers",
            },
            {
                method: "post",
                path: "/api/complex-managers",
                body: {
                    userId: secondManager.id,
                    complexId: complexB.id,
                },
            },
            {
                method: "get",
                path: `/api/complex-managers/${existingAssignment.id}`,
            },
            {
                method: "get",
                path: `/api/complex-managers/manager/${manager.id}`,
            },
            {
                method: "get",
                path: `/api/complex-managers/complex/${complexA.id}`,
            },
            {
                method: "delete",
                path: `/api/complex-managers/${removableAssignment.id}`,
            },
        ];

        async function sendRequest(token, endpoint) {
            let req = api(token, endpoint.method, endpoint.path);

            if (endpoint.body) {
                req = req.send(endpoint.body);
            }

            return req;
        }

        for (const endpoint of endpoints) {
            // درخواست بدون توکن باید Unauthorized باشد.
            const anonymousResponse = await sendRequest(
                null,
                endpoint
            );

            expect(anonymousResponse.statusCode).toBe(401);

            // هیچ‌یک از نقش‌های غیر ADMIN اجازه دسترسی ندارند.
            for (const token of [managerToken, regularUserToken]) {
                const response = await sendRequest(token, endpoint);

                expect(response.statusCode).toBe(403);
            }
        }

        // درخواست‌های غیرمجاز نباید تخصیص جدیدی ایجاد کنند.
        const unexpectedAssignment =
            await prisma.complexManager.findFirst({
                where: {
                    userId: secondManager.id,
                    complexId: complexB.id,
                },
            });

        expect(unexpectedAssignment).toBeNull();

        // درخواست حذف غیرمجاز نباید تخصیص موجود را حذف کند.
        const preservedAssignment =
            await prisma.complexManager.findUnique({
                where: {
                    id: removableAssignment.id,
                },
            });

        expect(preservedAssignment).not.toBeNull();
    });

    test("ADMIN can list manager assignments", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complex-managers"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const ids = response.body.assignments.map(item => item.id);

        expect(ids).toContain(existingAssignment.id);
        expect(ids).toContain(removableAssignment.id);
    });

    test("ADMIN can get an assignment by ID", async () => {
        const response = await api(
            adminToken,
            "get",
            `/api/complex-managers/${existingAssignment.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.assignment.id).toBe(existingAssignment.id);
        expect(response.body.assignment.user.id).toBe(manager.id);
        expect(response.body.assignment.complex.id).toBe(complexA.id);
    });

    test("getting an unknown assignment returns 404", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complex-managers/unknown-assignment-id"
        );

        expect(response.statusCode).toBe(404);
    });

    test("ADMIN can get assignments for a manager", async () => {
        const response = await api(
            adminToken,
            "get",
            `/api/complex-managers/manager/${manager.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        // Current API returns assignment records containing a nested complex.
        expect(response.body.complexes).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    complexId: complexA.id,
                    complex: expect.objectContaining({
                        id: complexA.id,
                    }),
                }),
            ])
        );
    });

    test("getting assignments for an unknown user returns 404", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complex-managers/manager/unknown-user-id"
        );

        expect(response.statusCode).toBe(404);
    });

    test("non-MANAGER users cannot be queried as managers", async () => {
        const response = await api(
            adminToken,
            "get",
            `/api/complex-managers/manager/${regularUser.id}`
        );

        expect(response.statusCode).toBe(400);
    });

    test("ADMIN can get managers assigned to a complex", async () => {
        const response = await api(
            adminToken,
            "get",
            `/api/complex-managers/complex/${complexA.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.managers).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    userId: manager.id,
                    user: expect.objectContaining({
                        id: manager.id,
                        role: "MANAGER",
                    }),
                }),
            ])
        );
    });

    test("getting managers for an unknown complex returns 404", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complex-managers/complex/unknown-complex-id"
        );

        expect(response.statusCode).toBe(404);
    });

    test("assignment rejects missing userId or complexId", async () => {
        const cases = [
            {},
            { userId: manager.id },
            { complexId: complexA.id },
        ];

        for (const body of cases) {
            const response = await api(
                adminToken,
                "post",
                "/api/complex-managers"
            ).send(body);

            expect(response.statusCode).toBe(400);
        }
    });

    test("assignment rejects an unknown user", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: "unknown-user-id",
            complexId: complexA.id,
        });

        expect(response.statusCode).toBe(404);
    });

    test("assignment rejects a user who is not a MANAGER", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: regularUser.id,
            complexId: complexA.id,
        });

        expect(response.statusCode).toBe(400);
    });

    test("assignment rejects an inactive or blocked manager", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: inactiveManager.id,
            complexId: complexA.id,
        });

        expect(response.statusCode).toBe(400);
    });

    test("assignment rejects an unknown complex", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: secondManager.id,
            complexId: "unknown-complex-id",
        });

        expect(response.statusCode).toBe(404);
    });

    test("duplicate manager assignment returns 409", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: manager.id,
            complexId: complexA.id,
        });

        expect(response.statusCode).toBe(409);
    });

    test("ADMIN can assign an active MANAGER to another complex", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complex-managers"
        ).send({
            userId: secondManager.id,
            complexId: complexB.id,
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.assignment.user.id).toBe(secondManager.id);
        expect(response.body.assignment.complex.id).toBe(complexB.id);
    });

    test("ADMIN can remove an assignment", async () => {
        const response = await api(
            adminToken,
            "delete",
            `/api/complex-managers/${removableAssignment.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.assignment.id).toBe(removableAssignment.id);

        const deleted = await prisma.complexManager.findUnique({
            where: { id: removableAssignment.id },
        });

        expect(deleted).toBeNull();
    });

    test("removing a nonexistent assignment returns 404", async () => {
        const response = await api(
            adminToken,
            "delete",
            "/api/complex-managers/unknown-assignment-id"
        );

        expect(response.statusCode).toBe(404);
    });

    const protectedRoutes = [
        ["assign", "post", "/api/complex-managers"],
        ["list assignments", "get", "/api/complex-managers"],
        ["get assignment", "get", "/api/complex-managers/any-id"],
        ["get manager assignments", "get", "/api/complex-managers/manager/any-user"],
        ["get complex managers", "get", "/api/complex-managers/complex/any-complex"],
        ["remove assignment", "delete", "/api/complex-managers/any-id"],
    ];

    test.each(protectedRoutes)(
        "%s rejects requests without authentication",
        async (_label, method, path) => {
            const response = await api(null, method, path);
            expect(response.statusCode).toBe(401);
        }
    );

    test.each(
        protectedRoutes.flatMap(route =>
            ["MANAGER", "USER"].map(role => [...route, role])
        )
    )(
        "%s is forbidden to %s",
        async (_label, method, path, role) => {
            const token =
                role === "MANAGER"
                    ? managerToken
                    : regularUserToken;

            const response = await api(token, method, path);
            expect(response.statusCode).toBe(403);
        }
    );
});
