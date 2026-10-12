const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `dashboard-it-${process.pid}-${Date.now()}`;
const fixture = {
    users: [],
    complexes: [],
    properties: [],
    persons: [],
    elections: [],
    candidates: [],
};

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
    const user = await prisma.user.create({
        data: {
            fullName: `${tag}-${label}`,
            email: `${tag}-${label}@example.test`,
            password: await bcrypt.hash("Test-Password-123!", 10),
            role,
            status: "ACTIVE",
        },
    });

    fixture.users.push(user.id);
    return user;
}

async function makePerson(label) {
    const person = await prisma.person.create({
        data: {
            firstName: `${tag}-${label}`,
            lastName: "DashboardTest",
            nationalId: `${tag}-${label}`,
            mobile: `${tag}-${label}`,
            email: `${tag}-${label}@person.example.test`,
        },
    });

    fixture.persons.push(person.id);
    return person;
}

async function makeComplexWithData(label) {
    const complex = await prisma.complex.create({
        data: {
            name: `${tag}-${label}`,
            description: "Dashboard integration fixture",
        },
    });
    fixture.complexes.push(complex.id);

    const property = await prisma.property.create({
        data: {
            complexId: complex.id,
            code: `${tag}-${label}-property`,
            propertyType: "VILLA",
            status: "BUILT",
        },
    });
    fixture.properties.push(property.id);

    const person = await makePerson(`${label}-person`);

    await prisma.ownership.create({
        data: {
            propertyId: property.id,
            personId: person.id,
            percentage: 100,
        },
    });

    await prisma.residency.create({
        data: {
            propertyId: property.id,
            personId: person.id,
            type: "OWNER",
        },
    });

    const election = await prisma.election.create({
        data: {
            title: `${tag}-${label}-election`,
            description: "Dashboard integration fixture",
            startDate: new Date(Date.now() - 60_000),
            endDate: new Date(Date.now() + 60 * 60_000),
            status: "OPEN",
            complexId: complex.id,
        },
    });
    fixture.elections.push(election.id);

    const candidate = await prisma.candidate.create({
        data: {
            electionId: election.id,
            personId: person.id,
            biography: "Dashboard test candidate",
        },
    });
    fixture.candidates.push(candidate.id);

    await prisma.vote.create({
        data: {
            electionId: election.id,
            voterId: person.id,
            candidateId: candidate.id,
        },
    });

    return { complex, property, person };
}

async function cleanupFixtures() {
    const complexIds = fixture.complexes;
    const propertyIds = fixture.properties;
    const electionIds = fixture.elections;
    const candidateIds = fixture.candidates;
    const personIds = fixture.persons;
    const userIds = fixture.users;

    if (electionIds.length) {
        await prisma.vote.deleteMany({
            where: { electionId: { in: electionIds } },
        });

        await prisma.candidate.deleteMany({
            where: { electionId: { in: electionIds } },
        });

        await prisma.election.deleteMany({
            where: { id: { in: electionIds } },
        });
    }

    if (candidateIds.length) {
        await prisma.candidate.deleteMany({
            where: { id: { in: candidateIds } },
        });
    }

    if (propertyIds.length) {
        await prisma.ownership.deleteMany({
            where: { propertyId: { in: propertyIds } },
        });

        await prisma.residency.deleteMany({
            where: { propertyId: { in: propertyIds } },
        });

        await prisma.propertyAddress.deleteMany({
            where: { propertyId: { in: propertyIds } },
        });

        await prisma.property.deleteMany({
            where: { id: { in: propertyIds } },
        });
    }

    if (complexIds.length || userIds.length) {
        await prisma.complexManager.deleteMany({
            where: {
                OR: [
                    ...(complexIds.length
                        ? [{ complexId: { in: complexIds } }]
                        : []),
                    ...(userIds.length
                        ? [{ userId: { in: userIds } }]
                        : []),
                ],
            },
        });
    }

    if (complexIds.length) {
        await prisma.complex.deleteMany({
            where: { id: { in: complexIds } },
        });
    }

    if (personIds.length) {
        await prisma.person.deleteMany({
            where: { id: { in: personIds } },
        });
    }

    if (userIds.length) {
        await prisma.user.deleteMany({
            where: { id: { in: userIds } },
        });
    }
}

let admin;
let manager;
let unassignedManager;
let regularUser;
let adminToken;
let managerToken;
let unassignedManagerToken;
let userToken;

let assignedData;
let otherData;

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
    unassignedManager = await makeUser("unassigned-manager", "MANAGER");
    regularUser = await makeUser("user", "USER");

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    unassignedManagerToken = tokenFor(unassignedManager);
    userToken = tokenFor(regularUser);

    assignedData = await makeComplexWithData("assigned");
    otherData = await makeComplexWithData("unassigned");

    await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: assignedData.complex.id,
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

describe("Dashboard API integration tests", () => {
    test("MANAGER sees only assigned-complex statistics", async () => {
        const response = await api(
            managerToken,
            "get",
            "/api/dashboard"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const dashboard = response.body.dashboard;

        expect(dashboard.complexes).toBe(1);
        expect(dashboard.properties).toBe(1);
        expect(dashboard.propertyTypes.villas).toBe(1);
        expect(dashboard.persons).toBe(1);
        expect(dashboard.ownerships).toBe(1);
        expect(dashboard.residencies).toBe(1);
        expect(dashboard.ownerResidents).toBe(1);
        expect(dashboard.activeElections).toBe(1);
        expect(dashboard.candidates).toBe(1);
        expect(dashboard.votes).toBe(1);
        expect(dashboard.electionStatistics.uniqueVoters).toBe(1);
    });

    test("ADMIN retains global statistics across both fixture complexes", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/dashboard"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const dashboard = response.body.dashboard;

        expect(dashboard.complexes).toBeGreaterThanOrEqual(2);
        expect(dashboard.properties).toBeGreaterThanOrEqual(2);
        expect(dashboard.persons).toBeGreaterThanOrEqual(2);
        expect(dashboard.ownerships).toBeGreaterThanOrEqual(2);
        expect(dashboard.residencies).toBeGreaterThanOrEqual(2);
        expect(dashboard.activeElections).toBeGreaterThanOrEqual(2);
        expect(dashboard.candidates).toBeGreaterThanOrEqual(2);
        expect(dashboard.votes).toBeGreaterThanOrEqual(2);
    });

    test("MANAGER with no assigned complexes gets zero scoped counts", async () => {
        const response = await api(
            unassignedManagerToken,
            "get",
            "/api/dashboard"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const dashboard = response.body.dashboard;

        expect(dashboard.complexes).toBe(0);
        expect(dashboard.properties).toBe(0);
        expect(dashboard.propertyTypes.villas).toBe(0);
        expect(dashboard.persons).toBe(0);
        expect(dashboard.ownerships).toBe(0);
        expect(dashboard.residencies).toBe(0);
        expect(dashboard.activeElections).toBe(0);
        expect(dashboard.candidates).toBe(0);
        expect(dashboard.votes).toBe(0);
        expect(dashboard.electionStatistics.uniqueVoters).toBe(0);
    });

    test("USER is forbidden from the management dashboard", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/dashboard"
        );

        expect(response.statusCode).toBe(403);
    });

    test("missing token is rejected", async () => {
        const response = await api(
            null,
            "get",
            "/api/dashboard"
        );

        expect(response.statusCode).toBe(401);
    });
});
