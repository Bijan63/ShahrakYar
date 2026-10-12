const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `residency-it-${process.pid}-${Date.now()}`;

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

const allPropertyIds = new Set();
const allPersonIds = new Set();

function tokenFor(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
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

async function createResidency(data = {}, token = adminToken) {
    const payload = {
        propertyId: data.propertyId || propertyA.id,
        personId: data.personId || personA.id,
    };

    for (const field of ["type", "startDate", "endDate"]) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            payload[field] = data[field];
        }
    }

    return api(token, "post", "/api/residencies").send(payload);
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
    allPropertyIds.add(property.id);
    return property;
}

async function makePerson(label) {
    const number = ++personCounter;

    const person = await prisma.person.create({
        data: {
            firstName: "ResidencyTest",
            lastName: `${label}-${number}`,
            mobile: `${tag}-${caseNumber}-${number}`,
            email: `${tag}-case-${caseNumber}-person-${number}@example.test`,
        },
    });

    casePersonIds.push(person.id);
    allPersonIds.add(person.id);
    return person;
}

async function readResidency(propertyId, personId) {
    return prisma.residency.findFirst({
        where: { propertyId, personId },
    });
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

    // Fail closed before creating any test data.
    const rows = await prisma.$queryRaw`
        SELECT current_database() AS name
    `;

    if (rows[0]?.name !== "shahrakyar_test") {
        throw new Error(
            `TEST SAFETY STOP: expected shahrakyar_test, got ${rows[0]?.name}`
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

    personA = await makePerson("PersonA");
    personB = await makePerson("PersonB");
    personC = await makePerson("PersonC");
});

afterEach(async () => {
    if (casePropertyIds.length > 0) {
        await prisma.residency.deleteMany({
            where: { propertyId: { in: casePropertyIds } },
        });

        await prisma.property.deleteMany({
            where: { id: { in: casePropertyIds } },
        });
    }

    if (casePersonIds.length > 0) {
        await prisma.person.deleteMany({
            where: { id: { in: casePersonIds } },
        });
    }
});

afterAll(async () => {
    try {
        const complexIds = [complexA?.id, complexB?.id].filter(Boolean);

        if (allPropertyIds.size > 0) {
            await prisma.residency.deleteMany({
                where: {
                    propertyId: { in: [...allPropertyIds] },
                },
            });

            await prisma.property.deleteMany({
                where: { id: { in: [...allPropertyIds] } },
            });
        }

        if (allPersonIds.size > 0) {
            await prisma.person.deleteMany({
                where: { id: { in: [...allPersonIds] } },
            });
        }

        if (complexIds.length > 0) {
            await prisma.complexManager.deleteMany({
                where: { complexId: { in: complexIds } },
            });

            await prisma.complex.deleteMany({
                where: { id: { in: complexIds } },
            });
        }

        const userIds = [
            admin?.id,
            manager?.id,
            regularUser?.id,
        ].filter(Boolean);

        if (userIds.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: userIds } },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
});

describe("Residency integration tests", () => {
    test("requires authentication", async () => {
        const response = await request(app).get("/api/residencies");
        expect(response.statusCode).toBe(401);
    });

    test("denies the USER role", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/residencies"
        );

        expect(response.statusCode).toBe(403);
    });

    test.each(["OWNER", "TENANT", "FAMILY"])(
        "creates a valid %s residency and persists it",
        async (type) => {
            const response = await createResidency({ type });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);

            const saved = await readResidency(
                propertyA.id,
                personA.id
            );

            expect(saved).not.toBeNull();
            expect(saved.type).toBe(type);
            expect(saved.endDate).toBeNull();
            expect(saved.startDate).toBeInstanceOf(Date);
        }
    );

    test("rejects missing required fields", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/residencies"
        ).send({
            propertyId: propertyA.id,
            personId: personA.id,
        });

        expect(response.statusCode).toBe(400);

        expect(
            await prisma.residency.count({
                where: { propertyId: propertyA.id },
            })
        ).toBe(0);
    });

    test("rejects an invalid residency type", async () => {
        const response = await createResidency({
            type: "VISITOR",
        });

        expect(response.statusCode).toBe(400);

        expect(
            await readResidency(propertyA.id, personA.id)
        ).toBeNull();
    });

    test("rejects an invalid start date", async () => {
        const response = await createResidency({
            type: "OWNER",
            startDate: "not-a-date",
        });

        expect(response.statusCode).toBe(400);
    });

    test.each([
        ["equal dates", "2026-01-10T00:00:00.000Z"],
        ["end date before start date", "2026-01-09T00:00:00.000Z"],
    ])("rejects %s", async (_label, endDate) => {
        const response = await createResidency({
            type: "OWNER",
            startDate: "2026-01-10T00:00:00.000Z",
            endDate,
        });

        expect(response.statusCode).toBe(400);

        expect(
            await readResidency(propertyA.id, personA.id)
        ).toBeNull();
    });

    test("rejects overlapping residencies for the same person and property", async () => {
        const first = await createResidency({
            type: "OWNER",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-15T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createResidency({
            type: "FAMILY",
            startDate: "2026-01-10T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(409);

        expect(
            await prisma.residency.count({
                where: {
                    propertyId: propertyA.id,
                    personId: personA.id,
                },
            })
        ).toBe(1);
    });

    test("allows adjacent periods for the same person when one ends exactly as the next starts", async () => {
        const first = await createResidency({
            type: "OWNER",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createResidency({
            type: "FAMILY",
            startDate: "2026-01-10T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(201);

        expect(
            await prisma.residency.count({
                where: {
                    propertyId: propertyA.id,
                    personId: personA.id,
                },
            })
        ).toBe(2);
    });

    test("rejects overlapping tenants even when they are different people", async () => {
        const first = await createResidency({
            personId: personA.id,
            type: "TENANT",
            startDate: "2026-01-01T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createResidency({
            personId: personB.id,
            type: "TENANT",
            startDate: "2026-01-05T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(409);

        expect(
            await prisma.residency.count({
                where: {
                    propertyId: propertyA.id,
                    type: "TENANT",
                },
            })
        ).toBe(1);
    });

    test("allows consecutive tenant periods at an exact shared boundary", async () => {
        const first = await createResidency({
            personId: personA.id,
            type: "TENANT",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);

        const second = await createResidency({
            personId: personB.id,
            type: "TENANT",
            startDate: "2026-01-10T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(second.statusCode).toBe(201);

        expect(
            await prisma.residency.count({
                where: {
                    propertyId: propertyA.id,
                    type: "TENANT",
                },
            })
        ).toBe(2);
    });

    test("rejects creating a residency in an unassigned complex as MANAGER", async () => {
        const response = await createResidency(
            {
                propertyId: propertyB.id,
                personId: personA.id,
                type: "OWNER",
            },
            managerToken
        );

        expect(response.statusCode).toBe(403);

        expect(
            await readResidency(propertyB.id, personA.id)
        ).toBeNull();
    });

    test("updates a residency and persists the changed type", async () => {
        const created = await createResidency({
            type: "OWNER",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(created.statusCode).toBe(201);

        const existing = await readResidency(
            propertyA.id,
            personA.id
        );

        const updated = await api(
            adminToken,
            "put",
            `/api/residencies/${existing.id}`
        ).send({ type: "FAMILY" });

        expect(updated.statusCode).toBe(200);

        const saved = await prisma.residency.findUnique({
            where: { id: existing.id },
        });

        expect(saved.type).toBe("FAMILY");
    });

    test("rejects an update that would overlap another residency and preserves the original dates", async () => {
        const first = await createResidency({
            type: "OWNER",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-10T00:00:00.000Z",
        });

        const second = await createResidency({
            type: "FAMILY",
            startDate: "2026-01-11T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);

        const existing = await prisma.residency.findFirst({
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
            `/api/residencies/${existing.id}`
        ).send({
            startDate: "2026-01-09T00:00:00.000Z",
        });

        expect(response.statusCode).toBe(409);

        const unchanged = await prisma.residency.findUnique({
            where: { id: existing.id },
        });

        expect(unchanged.startDate.toISOString())
            .toBe("2026-01-11T00:00:00.000Z");

        expect(unchanged.endDate.toISOString())
            .toBe("2026-01-20T00:00:00.000Z");
    });

    test("does not allow changing another residency to TENANT when a tenant already exists", async () => {
        const first = await createResidency({
            personId: personA.id,
            type: "OWNER",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        const tenant = await createResidency({
            personId: personB.id,
            type: "TENANT",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-20T00:00:00.000Z",
        });

        expect(first.statusCode).toBe(201);
        expect(tenant.statusCode).toBe(201);

        const existing = await readResidency(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/residencies/${existing.id}`
        ).send({ type: "TENANT" });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.residency.findUnique({
            where: { id: existing.id },
        });

        expect(saved.type).toBe("OWNER");
    });

    test("rejects an empty update body", async () => {
        const created = await createResidency({ type: "OWNER" });
        expect(created.statusCode).toBe(201);

        const existing = await readResidency(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "put",
            `/api/residencies/${existing.id}`
        ).send({});

        expect(response.statusCode).toBe(400);
    });

    test("deletes a residency from the database", async () => {
        const created = await createResidency({ type: "OWNER" });
        expect(created.statusCode).toBe(201);

        const existing = await readResidency(
            propertyA.id,
            personA.id
        );

        const response = await api(
            adminToken,
            "delete",
            `/api/residencies/${existing.id}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.residency.findUnique({
                where: { id: existing.id },
            })
        ).toBeNull();
    });

    test("limits the residency list and hides out-of-scope records from a MANAGER", async () => {
        const inScope = await createResidency({
            propertyId: propertyA.id,
            personId: personA.id,
            type: "OWNER",
        });

        const outOfScope = await createResidency({
            propertyId: propertyB.id,
            personId: personB.id,
            type: "OWNER",
        });

        expect(inScope.statusCode).toBe(201);
        expect(outOfScope.statusCode).toBe(201);

        const recordA = await readResidency(
            propertyA.id,
            personA.id
        );

        const recordB = await readResidency(
            propertyB.id,
            personB.id
        );

        const list = await api(
            managerToken,
            "get",
            "/api/residencies"
        );

        expect(list.statusCode).toBe(200);
        expect(Array.isArray(list.body.data)).toBe(true);
        expect(list.body.data.map((item) => item.id))
            .toContain(recordA.id);
        expect(list.body.data.map((item) => item.id))
            .not.toContain(recordB.id);

        const hidden = await api(
            managerToken,
            "get",
            `/api/residencies/${recordB.id}`
        );

        expect(hidden.statusCode).toBe(404);

        const blockedUpdate = await api(
            managerToken,
            "put",
            `/api/residencies/${recordB.id}`
        ).send({ type: "FAMILY" });

        expect(blockedUpdate.statusCode).toBe(404);

        const blockedDelete = await api(
            managerToken,
            "delete",
            `/api/residencies/${recordB.id}`
        );

        expect(blockedDelete.statusCode).toBe(404);

        expect(
            await prisma.residency.findUnique({
                where: { id: recordB.id },
            })
        ).not.toBeNull();
    });

    test("returns only active residencies for a property's residents endpoint", async () => {
        const active = await createResidency({
            personId: personA.id,
            type: "OWNER",
        });

        const historical = await createResidency({
            personId: personB.id,
            type: "FAMILY",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-15T00:00:00.000Z",
        });

        expect(active.statusCode).toBe(201);
        expect(historical.statusCode).toBe(201);

        const activeRecord = await readResidency(
            propertyA.id,
            personA.id
        );

        const historicalRecord = await readResidency(
            propertyA.id,
            personB.id
        );

        const response = await api(
            adminToken,
            "get",
            `/api/residencies/property/${propertyA.id}/residents`
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);

        const returnedIds = response.body.data.map(
            (item) => item.id
        );

        expect(returnedIds).toContain(activeRecord.id);
        expect(returnedIds).not.toContain(historicalRecord.id);
    });

    test("denies a MANAGER access to residents of an unassigned complex", async () => {
        const response = await api(
            managerToken,
            "get",
            `/api/residencies/property/${propertyB.id}/residents`
        );

        expect(response.statusCode).toBe(403);
    });
});
