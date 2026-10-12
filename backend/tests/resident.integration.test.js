const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `resident-access-it-${process.pid}-${Date.now()}`;

const fixture = {
    userIds: [],
    complexIds: [],
    propertyIds: [],
    unitIds: [],
    residentIds: [],
};

let admin;
let manager;
let regularUser;
let residentUserA;
let residentUserB;

let adminToken;
let managerToken;
let userToken;

let complexA;
let complexB;
let residentA;
let residentB;

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

async function makeUser(label, role = "USER") {
    counter += 1;

    const user = await prisma.user.create({
        data: {
            fullName: `${tag}-${label}`,
            email: `${tag}-${label}-${counter}@example.test`,
            password: await bcrypt.hash("Test-Password-123!", 10),
            role,
            status: "ACTIVE",
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
            description: "Resident access integration fixture",
        },
    });

    fixture.complexIds.push(complex.id);
    return complex;
}

async function makeResident(complexId, label, user) {
    counter += 1;

    const property = await prisma.property.create({
        data: {
            complexId,
            code: `${tag}-property-${label}-${counter}`,
            propertyType: "VILLA",
            status: "BUILT",
        },
    });
    fixture.propertyIds.push(property.id);

    const unit = await prisma.unit.create({
        data: {
            unitNumber: `${tag}-unit-${label}-${counter}`,
            propertyId: property.id,
        },
    });
    fixture.unitIds.push(unit.id);

    const resident = await prisma.resident.create({
        data: {
            fullName: `${tag}-resident-${label}`,
            mobile: `${tag}-mobile-${label}`,
            userId: user.id,
            unitId: unit.id,
        },
    });
    fixture.residentIds.push(resident.id);

    return resident;
}

async function cleanupFixtures() {
    if (fixture.residentIds.length) {
        await prisma.resident.deleteMany({
            where: {
                id: { in: fixture.residentIds },
            },
        });
    }

    if (fixture.unitIds.length) {
        await prisma.unit.deleteMany({
            where: {
                id: { in: fixture.unitIds },
            },
        });
    }

    if (fixture.propertyIds.length) {
        await prisma.propertyAddress.deleteMany({
            where: {
                propertyId: { in: fixture.propertyIds },
            },
        });

        await prisma.property.deleteMany({
            where: {
                id: { in: fixture.propertyIds },
            },
        });
    }

    if (fixture.complexIds.length || fixture.userIds.length) {
        const OR = [];

        if (fixture.complexIds.length) {
            OR.push({
                complexId: { in: fixture.complexIds },
            });
        }

        if (fixture.userIds.length) {
            OR.push({
                userId: { in: fixture.userIds },
            });
        }

        await prisma.complexManager.deleteMany({
            where: { OR },
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
    regularUser = await makeUser("regular-user", "USER");

    residentUserA = await makeUser("resident-A", "USER");
    residentUserB = await makeUser("resident-B", "USER");

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    userToken = tokenFor(regularUser);

    complexA = await makeComplex("A");
    complexB = await makeComplex("B");

    await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: complexA.id,
        },
    });

    residentA = await makeResident(
        complexA.id,
        "A",
        residentUserA
    );

    residentB = await makeResident(
        complexB.id,
        "B",
        residentUserB
    );
});

afterAll(async () => {
    try {
        await cleanupFixtures();
    } finally {
        await prisma.$disconnect();
    }
});

describe("Resident access-control integration tests", () => {
    test("ADMIN can list residents from both complexes", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/residents"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const ids = response.body.data.data.map(
            resident => resident.id
        );

        expect(ids).toContain(residentA.id);
        expect(ids).toContain(residentB.id);
    });

    test("MANAGER list includes only residents in assigned complexes", async () => {
        const response = await api(
            managerToken,
            "get",
            "/api/residents"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const ids = response.body.data.data.map(
            resident => resident.id
        );

        expect(ids).toContain(residentA.id);
        expect(ids).not.toContain(residentB.id);
        expect(response.body.data.total).toBe(1);
    });

    test("MANAGER can search for a resident in the assigned complex", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/residents/search?search=${encodeURIComponent(`${tag}-resident-A`)}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.total).toBe(1);
        expect(
            response.body.data.data.map(resident => resident.id)
        ).toContain(residentA.id);
    });

    test("MANAGER search does not disclose residents from other complexes", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/residents/search?search=${encodeURIComponent(`${tag}-resident-B`)}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.total).toBe(0);
        expect(response.body.data.data).toEqual([]);
    });

    test("MANAGER cannot view a resident from an unassigned complex by ID", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/residents/${residentB.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("MANAGER can view a resident in the assigned complex by ID", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/residents/${residentA.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(residentA.id);
    });

    test("USER cannot list residents", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/residents"
        );

        expect(response.statusCode).toBe(403);
    });

    test("USER cannot search residents", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/residents/search"
        );

        expect(response.statusCode).toBe(403);
    });

    test("USER cannot read a resident by ID", async () => {
        const response = await api(
            userToken,
            "get",
            `/api/residents/${residentA.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test.each([
        ["list", "get", "/api/residents"],
        ["search", "get", "/api/residents/search"],
        ["read by ID", "get", () => `/api/residents/${residentA.id}`],
    ])("%s rejects requests without a token", async (_label, method, path) => {
        const resolvedPath =
            typeof path === "function" ? path() : path;

        const response = await api(
            null,
            method,
            resolvedPath
        );

        expect(response.statusCode).toBe(401);
    });
});
