const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `complex-it-${process.pid}-${Date.now()}`;

const fixture = {
    userIds: [],
    complexIds: [],
};

let admin;
let manager;
let unassignedManager;
let regularUser;

let adminToken;
let managerToken;
let unassignedManagerToken;
let userToken;

let assignedComplex;
let unassignedComplex;

let userCounter = 0;
let complexCounter = 0;

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

async function makeUser(label, role) {
    userCounter += 1;

    const user = await prisma.user.create({
        data: {
            fullName: `${tag}-${label}`,
            email: `${tag}-${label}-${userCounter}@example.test`,
            password: await bcrypt.hash("Test-Password-123!", 10),
            role,
            status: "ACTIVE",
        },
    });

    fixture.userIds.push(user.id);
    return user;
}

async function makeComplex(label) {
    complexCounter += 1;

    const complex = await prisma.complex.create({
        data: {
            name: `${tag}-${label}-${complexCounter}`,
            address: `Test address ${complexCounter}`,
            description: "Complex integration test fixture",
        },
    });

    fixture.complexIds.push(complex.id);
    return complex;
}

async function cleanupFixtures() {
    const orConditions = [];

    if (fixture.userIds.length) {
        orConditions.push({
            userId: { in: fixture.userIds },
        });
    }

    if (fixture.complexIds.length) {
        orConditions.push({
            complexId: { in: fixture.complexIds },
        });
    }

    if (orConditions.length) {
        await prisma.complexManager.deleteMany({
            where: { OR: orConditions },
        });
    }

    if (fixture.complexIds.length) {
        await prisma.complex.deleteMany({
            where: {
                id: { in: fixture.complexIds },
            },
        });
    }

    if (fixture.userIds.length) {
        await prisma.user.deleteMany({
            where: {
                id: { in: fixture.userIds },
            },
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
    manager = await makeUser("manager", "MANAGER");
    unassignedManager = await makeUser(
        "unassigned-manager",
        "MANAGER"
    );
    regularUser = await makeUser("user", "USER");

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    unassignedManagerToken = tokenFor(unassignedManager);
    userToken = tokenFor(regularUser);

    assignedComplex = await makeComplex("assigned");
    unassignedComplex = await makeComplex("other");

    await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: assignedComplex.id,
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

describe("Complex API integration tests", () => {
    test("ADMIN list includes both test complexes", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complexes"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const ids = response.body.complexes.map(
            complex => complex.id
        );

        expect(ids).toContain(assignedComplex.id);
        expect(ids).toContain(unassignedComplex.id);
    });

    test("MANAGER list includes only assigned complexes", async () => {
        const response = await api(
            managerToken,
            "get",
            "/api/complexes"
        );

        expect(response.statusCode).toBe(200);

        const ids = response.body.complexes.map(
            complex => complex.id
        );

        expect(ids).toContain(assignedComplex.id);
        expect(ids).not.toContain(unassignedComplex.id);
        expect(ids).toEqual([assignedComplex.id]);
    });

    test("MANAGER with no assignments receives an empty list", async () => {
        const response = await api(
            unassignedManagerToken,
            "get",
            "/api/complexes"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.complexes).toEqual([]);
    });

    test("USER receives an empty complex list", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/complexes"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.complexes).toEqual([]);
    });

    test("MANAGER can view an assigned complex", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/complexes/${assignedComplex.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.complex.id).toBe(
            assignedComplex.id
        );
    });

    test("MANAGER cannot view another complex", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/complexes/${unassignedComplex.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("USER cannot view complex details", async () => {
        const response = await api(
            userToken,
            "get",
            `/api/complexes/${assignedComplex.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("ADMIN gets 404 for an unknown complex", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/complexes/unknown-complex-id"
        );

        expect(response.statusCode).toBe(404);
    });

    test("missing token is rejected", async () => {
        const response = await api(
            null,
            "get",
            "/api/complexes"
        );

        expect(response.statusCode).toBe(401);
    });

    test("ADMIN can create a complex", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complexes"
        ).send({
            name: `${tag}-created-by-admin`,
            address: "Admin test address",
            description: "Created by integration test",
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.complex.name).toBe(
            `${tag}-created-by-admin`
        );

        fixture.complexIds.push(response.body.complex.id);
    });

    test("creating a complex without a name returns 400", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/complexes"
        ).send({
            address: "Address without name",
        });

        expect(response.statusCode).toBe(400);
    });

    test.each([
        ["MANAGER", () => managerToken],
        ["USER", () => userToken],
    ])("%s cannot create a complex", async (_role, getToken) => {
        const response = await api(
            getToken(),
            "post",
            "/api/complexes"
        ).send({
            name: `${tag}-forbidden-create`,
        });

        expect(response.statusCode).toBe(403);
    });

    test("ADMIN can update a complex", async () => {
        const newDescription = "Updated by integration test";

        const response = await api(
            adminToken,
            "patch",
            `/api/complexes/${assignedComplex.id}`
        ).send({
            description: newDescription,
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.complex.description).toBe(
            newDescription
        );
    });

    test("MANAGER cannot update a complex", async () => {
        const response = await api(
            managerToken,
            "patch",
            `/api/complexes/${assignedComplex.id}`
        ).send({
            name: `${tag}-unauthorized-update`,
        });

        expect(response.statusCode).toBe(403);
    });

    test("ADMIN gets 404 when updating an unknown complex", async () => {
        const response = await api(
            adminToken,
            "patch",
            "/api/complexes/unknown-complex-id"
        ).send({
            description: "Must not be created",
        });

        expect(response.statusCode).toBe(404);
    });

    test("MANAGER cannot delete a complex", async () => {
        const response = await api(
            managerToken,
            "delete",
            `/api/complexes/${assignedComplex.id}`
        );

        expect(response.statusCode).toBe(403);

        const stillExists = await prisma.complex.findUnique({
            where: { id: assignedComplex.id },
        });

        expect(stillExists).not.toBeNull();
    });

    test("ADMIN can delete an empty complex", async () => {
        const target = await makeComplex("delete-target");

        const response = await api(
            adminToken,
            "delete",
            `/api/complexes/${target.id}`
        );

        expect(response.statusCode).toBe(200);

        const deleted = await prisma.complex.findUnique({
            where: { id: target.id },
        });

        expect(deleted).toBeNull();
    });
});
