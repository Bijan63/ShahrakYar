const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `ownership-it-${process.pid}-${Date.now()}`;

let complexA;
let complexB;
let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

let propertyA;
let propertyB;
let personA;
let personB;
let personC;

let caseNumber = 0;
let personCounter = 0;
let propertyCounter = 0;

let casePropertyIds = [];
let casePersonIds = [];

function tokenFor(user) {
    return jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        config.jwt.secret,
        { expiresIn: "1h" }
    );
}

function api(token, method, path) {
    return request(app)[method](path).set(
        "Authorization",
        `Bearer ${token}`
    );
}

async function createOwnership(data = {}, token = adminToken) {
    const payload = {
        propertyId: data.propertyId || propertyA.id,
        personId: data.personId || personA.id,
    };

    for (const field of ["percentage", "startDate", "endDate"]) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            payload[field] = data[field];
        }
    }

    return api(token, "post", "/api/ownerships").send(payload);
}

async function makeProperty(complexId, label) {
    const property = await prisma.property.create({
        data: {
            complexId,
            code: `${tag}-case-${caseNumber}-${label}-${++propertyCounter}`,
            propertyType: "VILLA",
            status: "BUILT",
        },
    });

    casePropertyIds.push(property.id);
    return property;
}

async function makePerson(label) {
    const number = ++personCounter;

    const person = await prisma.person.create({
        data: {
            firstName: "OwnershipTest",
            lastName: `${label}-${number}`,
            mobile: `${tag}-${caseNumber}-${number}`,
            email: `${tag}-case-${caseNumber}-person-${number}@example.test`,
        },
    });

    casePersonIds.push(person.id);
    return person;
}

async function readOwnership(propertyId, personId) {
    return prisma.ownership.findFirst({
        where: { propertyId, personId },
    });
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

    complexA = await prisma.complex.create({
        data: { name: `${tag}-complex-A` },
    });

    complexB = await prisma.complex.create({
        data: { name: `${tag}-complex-B` },
    });

    admin = await prisma.user.create({
        data: {
            fullName: `${tag} Admin`,
            email: `${tag}-admin@example.test`,
            password: "test-only-password",
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    manager = await prisma.user.create({
        data: {
            fullName: `${tag} Manager`,
            email: `${tag}-manager@example.test`,
            password: "test-only-password",
            role: "MANAGER",
            status: "ACTIVE",
        },
    });

    regularUser = await prisma.user.create({
        data: {
            fullName: `${tag} User`,
            email: `${tag}-user@example.test`,
            password: "test-only-password",
            role: "USER",
            status: "ACTIVE",
        },
    });

    await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: complexA.id,
        },
    });

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    userToken = tokenFor(regularUser);
});

beforeEach(async () => {
    caseNumber += 1;
    casePropertyIds = [];
    casePersonIds = [];

    propertyA = await makeProperty(complexA.id, "A");
    propertyB = await makeProperty(complexB.id, "B");

    personA = await makePerson("OwnerA");
    personB = await makePerson("OwnerB");
    personC = await makePerson("OwnerC");
});

afterEach(async () => {
    if (casePropertyIds.length > 0) {
        await prisma.ownership.deleteMany({
            where: {
                propertyId: { in: casePropertyIds },
            },
        });

        await prisma.property.deleteMany({
            where: {
                id: { in: casePropertyIds },
            },
        });
    }

    if (casePersonIds.length > 0) {
        await prisma.person.deleteMany({
            where: {
                id: { in: casePersonIds },
            },
        });
    }
});

afterAll(async () => {
    try {
        const complexIds = [complexA?.id, complexB?.id].filter(Boolean);

        if (complexIds.length > 0) {
            await prisma.complexManager.deleteMany({
                where: {
                    complexId: { in: complexIds },
                },
            });

            await prisma.property.deleteMany({
                where: {
                    complexId: { in: complexIds },
                },
            });

            await prisma.complex.deleteMany({
                where: {
                    id: { in: complexIds },
                },
            });
        }

        await prisma.person.deleteMany({
            where: {
                email: { startsWith: `${tag}-` },
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: { startsWith: `${tag}-` },
            },
        });
    } finally {
        await prisma.$disconnect();
    }
});

describe("Ownership integration tests", () => {
    test("requires authentication", async () => {
        const response = await request(app).get("/api/ownerships");

        expect(response.statusCode).toBe(401);
    });

    test("denies the USER role", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/ownerships"
        );

        expect(response.statusCode).toBe(403);
    });

    test("creates an ownership with the default 100 percent share", async () => {
        const response = await createOwnership();

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        const saved = await readOwnership(
            propertyA.id,
            personA.id
        );

        expect(saved).not.toBeNull();
        expect(saved.percentage).toBe(100);
        expect(saved.endDate).toBeNull();
        expect(saved.startDate).toBeInstanceOf(Date);
    });

    test.each([0, -1, 100.01])(
        "rejects invalid ownership percentage %p",
        async (percentage) => {
            const response = await createOwnership({ percentage });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);

            const saved = await readOwnership(
                propertyA.id,
                personA.id
            );

            expect(saved).toBeNull();
        }
    );

    test("does not allow active ownership shares to exceed 100 percent", async () => {
        const first = await createOwnership({
            personId: personA.id,
            percentage: 60,
        });

        const second = await createOwnership({
            personId: personB.id,
            percentage: 40,
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);

        const rejected = await createOwnership({
            personId: personC.id,
            percentage: 0.01,
        });

        expect(rejected.statusCode).toBe(400);

        const saved = await prisma.ownership.findMany({
            where: { propertyId: propertyA.id, endDate: null },
        });

        expect(saved).toHaveLength(2);

        const total = saved.reduce(
            (sum, ownership) => sum + Number(ownership.percentage),
            0
        );

        expect(total).toBe(100);
    });

    test("rejects a duplicate active ownership for the same person and property", async () => {
        const first = await createOwnership({
            personId: personA.id,
            percentage: 40,
        });

        expect(first.statusCode).toBe(201);

        const duplicate = await createOwnership({
            personId: personA.id,
            percentage: 40,
        });

        expect(duplicate.statusCode).toBe(409);

        const count = await prisma.ownership.count({
            where: {
                propertyId: propertyA.id,
                personId: personA.id,
            },
        });

        expect(count).toBe(1);
    });

    test("treats a shared date endpoint as an overlap", async () => {
        const first = await createOwnership({
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const overlapping = await createOwnership({
            startDate: "2026-01-10T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(overlapping.statusCode).toBe(409);

        const count = await prisma.ownership.count({
            where: {
                propertyId: propertyA.id,
                personId: personA.id,
            },
        });

        expect(count).toBe(1);
    });

    test("allows non-overlapping consecutive historical ownership periods", async () => {
        const first = await createOwnership({
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createOwnership({
            startDate: "2026-01-11T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(201);

        const count = await prisma.ownership.count({
            where: {
                propertyId: propertyA.id,
                personId: personA.id,
            },
        });

        expect(count).toBe(2);
    });

    test("rejects a start date later than the end date", async () => {
        const response = await createOwnership({
            startDate: "2026-01-20T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(response.statusCode).toBe(400);

        const saved = await readOwnership(
            propertyA.id,
            personA.id
        );

        expect(saved).toBeNull();
    });

    test("rejects an update that would make active shares exceed 100 percent", async () => {
        await createOwnership({
            personId: personA.id,
            percentage: 60,
        });

        await createOwnership({
            personId: personB.id,
            percentage: 40,
        });

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({ percentage: 61 });

        expect(response.statusCode).toBe(400);

        const saved = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(Number(saved.percentage)).toBe(60);
    });

    test("updates an ownership without counting its old share twice", async () => {
        await createOwnership({ percentage: 60 });

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({ percentage: 55 });

        expect(response.statusCode).toBe(200);

        const saved = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(Number(saved.percentage)).toBe(55);
    });

    test("deletes an ownership from the database", async () => {
        await createOwnership();

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "delete",
            `/api/ownerships/${existing.id}`
        );

        expect(response.statusCode).toBe(200);

        const saved = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(saved).toBeNull();
    });

    test("prevents a manager from creating ownership in an unassigned complex", async () => {
        const response = await createOwnership(
            {
                propertyId: propertyB.id,
                personId: personA.id,
            },
            managerToken
        );

        expect(response.statusCode).toBe(403);

        const saved = await readOwnership(
            propertyB.id,
            personA.id
        );

        expect(saved).toBeNull();
    });

    test("limits a manager's ownership list and blocks access to another complex", async () => {
        const createdA = await createOwnership({
            propertyId: propertyA.id,
            personId: personA.id,
        });

        const createdB = await createOwnership({
            propertyId: propertyB.id,
            personId: personB.id,
        });

        expect(createdA.statusCode).toBe(201);
        expect(createdB.statusCode).toBe(201);

        const ownershipA = await readOwnership(
            propertyA.id,
            personA.id
        );

        const ownershipB = await readOwnership(
            propertyB.id,
            personB.id
        );

        const listResponse = await api(
            managerToken,
            "get",
            "/api/ownerships"
        );

        expect(listResponse.statusCode).toBe(200);
        expect(Array.isArray(listResponse.body.data)).toBe(true);
        expect(listResponse.body.data).toHaveLength(1);
        expect(listResponse.body.data[0].id).toBe(ownershipA.id);

        const visible = await api(
            managerToken,
            "get",
            `/api/ownerships/${ownershipA.id}`
        );

        expect(visible.statusCode).toBe(200);

        const hidden = await api(
            managerToken,
            "get",
            `/api/ownerships/${ownershipB.id}`
        );

        expect(hidden.statusCode).toBe(404);

        const blockedUpdate = await api(
            managerToken,
            "put",
            `/api/ownerships/${ownershipB.id}`
        ).send({ percentage: 50 });

        expect(blockedUpdate.statusCode).toBe(403);

        const blockedDelete = await api(
            managerToken,
            "delete",
            `/api/ownerships/${ownershipB.id}`
        );

        expect(blockedDelete.statusCode).toBe(403);

        const unchanged = await prisma.ownership.findUnique({
            where: { id: ownershipB.id },
        });

        expect(unchanged).not.toBeNull();
        expect(Number(unchanged.percentage)).toBe(100);
    });


    test("allows ending an active ownership and creating a later ownership", async () => {
        const first = await createOwnership({
            startDate: "2026-01-01T00:00:00.000Z",
            percentage: 100,
        });

        expect(first.statusCode).toBe(201);

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const ended = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(ended.statusCode).toBe(200);

        const savedFirst = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(savedFirst.endDate.toISOString())
            .toBe("2026-01-10T00:00:00.000Z");

        const second = await createOwnership({
            startDate: "2026-01-11T00:00:00.000Z",
            percentage: 100,
        });

        expect(second.statusCode).toBe(201);

        const rows = await prisma.ownership.findMany({
            where: {
                propertyId: propertyA.id,
                personId: personA.id,
            },
            orderBy: { startDate: "asc" },
        });

        expect(rows).toHaveLength(2);
        expect(rows[0].endDate).not.toBeNull();
        expect(rows[1].endDate).toBeNull();
    });

    test("allows changing the person on an ownership when no conflict exists", async () => {
        const created = await createOwnership({
            personId: personA.id,
            percentage: 40,
        });

        expect(created.statusCode).toBe(201);

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({
            personId: personB.id,
        });

        expect(response.statusCode).toBe(200);

        expect(
            await readOwnership(propertyA.id, personA.id)
        ).toBeNull();

        const saved = await readOwnership(
            propertyA.id,
            personB.id
        );

        expect(saved).not.toBeNull();
        expect(Number(saved.percentage)).toBe(40);
    });

    test("allows an ADMIN to move an ownership to another property", async () => {
        const created = await createOwnership({
            propertyId: propertyA.id,
            personId: personA.id,
            percentage: 100,
        });

        expect(created.statusCode).toBe(201);

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({
            propertyId: propertyB.id,
        });

        expect(response.statusCode).toBe(200);

        expect(
            await readOwnership(propertyA.id, personA.id)
        ).toBeNull();

        const saved = await readOwnership(
            propertyB.id,
            personA.id
        );

        expect(saved).not.toBeNull();
        expect(saved.propertyId).toBe(propertyB.id);
    });

    test("prevents a MANAGER from moving ownership to an unassigned complex", async () => {
        const created = await createOwnership({
            propertyId: propertyA.id,
            personId: personA.id,
            percentage: 100,
        });

        expect(created.statusCode).toBe(201);

        const existing = await readOwnership(
            propertyA.id,
            personA.id
        );

        const response = await api(
            managerToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({
            propertyId: propertyB.id,
        });

        expect(response.statusCode).toBe(403);

        const unchanged = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(unchanged).not.toBeNull();
        expect(unchanged.propertyId).toBe(propertyA.id);

        expect(
            await readOwnership(propertyB.id, personA.id)
        ).toBeNull();
    });

    test("rejects an update that creates a date overlap and preserves the original dates", async () => {
        const first = await createOwnership({
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createOwnership({
            startDate: "2026-01-11T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(201);

        const existing = await prisma.ownership.findFirst({
            where: {
                propertyId: propertyA.id,
                personId: personA.id,
                startDate: new Date("2026-01-11T00:00:00.000Z"),
            },
        });

        expect(existing).not.toBeNull();

        const response = await api(
            adminToken,
            "put",
            `/api/ownerships/${existing.id}`
        ).send({
            startDate: "2026-01-10T00:00:00.000Z",
        });

        expect(response.statusCode).toBe(409);

        const unchanged = await prisma.ownership.findUnique({
            where: { id: existing.id },
        });

        expect(unchanged.startDate.toISOString())
            .toBe("2026-01-11T00:00:00.000Z");

        expect(unchanged.endDate.toISOString())
            .toBe("2026-01-20T00:00:00.000Z");
    });


    test("ownership history includes records active during the Jalali range", async () => {
        const overlappingPeriod = await createOwnership({
            personId: personA.id,
            percentage: 30,
            startDate: "2026-05-01T00:00:00.000Z",
            endDate: "2026-06-10T00:00:00.000Z",
        });

        const endedBeforeRange = await createOwnership({
            personId: personB.id,
            percentage: 30,
            startDate: "2026-04-01T00:00:00.000Z",
            endDate: "2026-05-10T00:00:00.000Z",
        });

        const activeOwnership = await createOwnership({
            personId: personC.id,
            percentage: 20,
            startDate: "2026-04-15T00:00:00.000Z",
        });

        expect(overlappingPeriod.statusCode).toBe(201);
        expect(endedBeforeRange.statusCode).toBe(201);
        expect(activeOwnership.statusCode).toBe(201);

        const includedRecord = await readOwnership(
            propertyA.id,
            personA.id
        );

        const excludedRecord = await readOwnership(
            propertyA.id,
            personB.id
        );

        const activeRecord = await readOwnership(
            propertyA.id,
            personC.id
        );

        const response = await api(
            adminToken,
            "get",
            "/api/ownerships/history"
        ).query({
            from: "1405/03/01",
            to: "1405/03/31",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        const returnedIds = response.body.data.map(
            (ownership) => ownership.id
        );

        expect(returnedIds).toContain(includedRecord.id);
        expect(returnedIds).toContain(activeRecord.id);
        expect(returnedIds).not.toContain(excludedRecord.id);
    });

    test("ownership changes reports a transfer between owners with the same share", async () => {
        const previousResponse = await createOwnership({
            personId: personA.id,
            percentage: 50,
            startDate: "2026-05-22T00:00:00.000Z",
            endDate: "2026-06-01T00:00:00.000Z",
        });

        const nextResponse = await createOwnership({
            personId: personB.id,
            percentage: 50,
            startDate: "2026-06-02T00:00:00.000Z",
        });

        expect(previousResponse.statusCode).toBe(201);
        expect(nextResponse.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "get",
            "/api/ownerships/changes"
        ).query({
            from: "1405/03/01",
            to: "1405/03/31",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveLength(1);

        const report = response.body.data[0];

        expect(report.property.id).toBe(propertyA.id);
        expect(report.hasChanges).toBe(true);
        expect(report.changeCount).toBe(1);
        expect(report.changes).toHaveLength(1);

        const transfer = report.changes[0];

        expect(transfer.type).toBe("OWNERSHIP_TRANSFER");
        expect(transfer.previousOwner.id).toBe(personA.id);
        expect(transfer.newOwner.id).toBe(personB.id);
        expect(Number(transfer.previousPercentage)).toBe(50);
        expect(Number(transfer.newPercentage)).toBe(50);
    });

    test("ownership history rejects an invalid Jalali date", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/ownerships/history"
        ).query({
            from: "1405/13/01",
            to: "1405/03/31",
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/Invalid Jalali date range/i);
    });

    test("ownership history requires both date parameters", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/ownerships/history"
        ).query({
            from: "1405/03/01",
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/from and to dates are required/i);
    });

});
