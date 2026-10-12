const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `property-it-${process.pid}-${Date.now()}`;

let complexA;
let complexB;
let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

let caseNumber = 0;
let propertyCounter = 0;
let personCounter = 0;

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

function nextCode(label = "prop") {
    propertyCounter += 1;
    return `${tag}-prop-${caseNumber}-${propertyCounter}-${label}`;
}

function landPayload(extra = {}) {
    return {
        complexId: complexA.id,
        code: nextCode("land"),
        propertyType: "LAND",
        ...extra,
    };
}

function villaPayload(extra = {}) {
    return {
        complexId: complexA.id,
        code: nextCode("villa"),
        propertyType: "VILLA",
        status: "BUILT",
        ...extra,
    };
}

async function createProperty(payload, token = adminToken) {
    return api(token, "post", "/api/properties").send(payload);
}

async function findByCode(code) {
    return prisma.property.findUnique({
        where: { code },
    });
}

async function makePerson() {
    personCounter += 1;

    return prisma.person.create({
        data: {
            firstName: "PropertyTest",
            lastName: `Owner-${caseNumber}-${personCounter}`,
            mobile: `${tag}-${caseNumber}-${personCounter}`,
            email: `${tag}-person-${caseNumber}-${personCounter}@example.test`,
        },
    });
}

async function cleanupPropertyFixtures() {
    const properties = await prisma.property.findMany({
        where: {
            code: { startsWith: `${tag}-prop-` },
        },
        select: { id: true },
    });

    const propertyIds = properties.map((property) => property.id);

    const units = await prisma.unit.findMany({
        where: {
            code: { startsWith: `${tag}-unit-` },
        },
        select: { id: true },
    });

    const unitIds = units.map((unit) => unit.id);

    const persons = await prisma.person.findMany({
        where: {
            email: { startsWith: `${tag}-person-` },
        },
        select: { id: true },
    });

    const personIds = persons.map((person) => person.id);

    if (propertyIds.length > 0 || personIds.length > 0) {
        const conditions = [];

        if (propertyIds.length > 0) {
            conditions.push({ propertyId: { in: propertyIds } });
        }

        if (personIds.length > 0) {
            conditions.push({ personId: { in: personIds } });
        }

        await prisma.ownership.deleteMany({
            where: { OR: conditions },
        });

        await prisma.residency.deleteMany({
            where: { OR: conditions },
        });
    }

    if (unitIds.length > 0) {
        await prisma.unit.deleteMany({
            where: { id: { in: unitIds } },
        });
    }

    if (propertyIds.length > 0) {
        await prisma.propertyAddress.deleteMany({
            where: { propertyId: { in: propertyIds } },
        });

        await prisma.property.deleteMany({
            where: { id: { in: propertyIds } },
        });
    }

    if (personIds.length > 0) {
        await prisma.person.deleteMany({
            where: { id: { in: personIds } },
        });
    }
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

    // Do not write any fixtures unless the connection is test-only.
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

beforeEach(() => {
    caseNumber += 1;
});

afterEach(async () => {
    await cleanupPropertyFixtures();
});

afterAll(async () => {
    try {
        // A final cleanup remains limited to this run's unique prefix.
        await cleanupPropertyFixtures();

        const complexIds = [complexA?.id, complexB?.id].filter(Boolean);

        if (complexIds.length > 0) {
            await prisma.complexManager.deleteMany({
                where: { complexId: { in: complexIds } },
            });

            await prisma.complex.deleteMany({
                where: { id: { in: complexIds } },
            });
        }

        const userIds = [admin?.id, manager?.id, regularUser?.id]
            .filter(Boolean);

        if (userIds.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: userIds } },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
});

describe("Property integration tests", () => {
    test("requires authentication", async () => {
        const response = await request(app).get("/api/properties");

        expect(response.statusCode).toBe(401);
    });

    test("denies the USER role", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/properties"
        );

        expect(response.statusCode).toBe(403);
    });

    test("creates LAND with default VACANT status", async () => {
        const payload = landPayload();
        const response = await createProperty(payload);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        const saved = await findByCode(payload.code);

        expect(saved).not.toBeNull();
        expect(saved.propertyType).toBe("LAND");
        expect(saved.status).toBe("VACANT");
    });

    test("normalizes property type, status and code", async () => {
        const rawCode = nextCode("normalized");
        const normalizedCode = rawCode.trim();

        const response = await createProperty({
            complexId: complexA.id,
            code: ` ${rawCode} `,
            propertyType: "villa",
            status: "built",
            landArea: 500,
            builtArea: 200,
        });

        expect(response.statusCode).toBe(201);

        const saved = await findByCode(normalizedCode);

        expect(saved).not.toBeNull();
        expect(saved.propertyType).toBe("VILLA");
        expect(saved.status).toBe("BUILT");
        expect(saved.code).toBe(normalizedCode);
    });

    test("rejects an invalid property type", async () => {
        const payload = landPayload({
            propertyType: "GARAGE",
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects an invalid property status", async () => {
        const payload = villaPayload({
            status: "UNKNOWN",
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects LAND with BUILT status", async () => {
        const payload = landPayload({
            status: "BUILT",
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test.each(["VILLA", "APARTMENT", "COMMERCIAL"])(
        "rejects %s with VACANT status",
        async (propertyType) => {
            const payload = {
                complexId: complexA.id,
                code: nextCode(propertyType.toLowerCase()),
                propertyType,
                status: "VACANT",
            };

            const response = await createProperty(payload);

            expect(response.statusCode).toBe(400);
            expect(await findByCode(payload.code)).toBeNull();
        }
    );

    test("rejects negative land area", async () => {
        const payload = landPayload({ landArea: -1 });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects negative built area", async () => {
        const payload = villaPayload({
            landArea: 500,
            builtArea: -1,
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects built area greater than land area", async () => {
        const payload = villaPayload({
            landArea: 100,
            builtArea: 101,
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects a non-numeric area", async () => {
        const payload = landPayload({
            landArea: "500",
        });

        const response = await createProperty(payload);

        expect(response.statusCode).toBe(400);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("rejects a duplicate property code and preserves one record", async () => {
        const payload = landPayload();

        const first = await createProperty(payload);
        expect(first.statusCode).toBe(201);

        const duplicate = await createProperty(payload);

        expect(duplicate.statusCode).toBe(409);

        const count = await prisma.property.count({
            where: { code: payload.code },
        });

        expect(count).toBe(1);
    });

    test("updates property fields and persists them", async () => {
        const payload = villaPayload({
            landArea: 500,
            builtArea: 200,
        });

        const created = await createProperty(payload);
        expect(created.statusCode).toBe(201);

        const updated = await api(
            adminToken,
            "put",
            `/api/properties/${(await findByCode(payload.code)).id}`
        ).send({
            builtArea: 250,
            description: "Updated test description",
            registryNumber: "TEST-REG-100",
        });

        expect(updated.statusCode).toBe(200);

        const saved = await findByCode(payload.code);

        expect(saved.builtArea).toBe(250);
        expect(saved.description).toBe("Updated test description");
        expect(saved.registryNumber).toBe("TEST-REG-100");
    });

    test("rejects an invalid area update without changing persisted values", async () => {
        const payload = villaPayload({
            landArea: 500,
            builtArea: 200,
        });

        const created = await createProperty(payload);
        expect(created.statusCode).toBe(201);

        const savedBefore = await findByCode(payload.code);

        const response = await api(
            adminToken,
            "put",
            `/api/properties/${savedBefore.id}`
        ).send({ builtArea: 600 });

        expect(response.statusCode).toBe(400);

        const savedAfter = await findByCode(payload.code);

        expect(savedAfter.builtArea).toBe(200);
        expect(savedAfter.landArea).toBe(500);
    });

    test("rejects updating a property to an invalid type/status combination", async () => {
        const payload = villaPayload();
        const created = await createProperty(payload);

        expect(created.statusCode).toBe(201);

        const savedBefore = await findByCode(payload.code);

        const response = await api(
            adminToken,
            "put",
            `/api/properties/${savedBefore.id}`
        ).send({
            propertyType: "VILLA",
            status: "VACANT",
        });

        expect(response.statusCode).toBe(400);

        const savedAfter = await findByCode(payload.code);

        expect(savedAfter.propertyType).toBe("VILLA");
        expect(savedAfter.status).toBe("BUILT");
    });

    test("rejects updating to a code already used by another property", async () => {
        const firstPayload = landPayload();
        const secondPayload = landPayload();

        expect((await createProperty(firstPayload)).statusCode).toBe(201);
        expect((await createProperty(secondPayload)).statusCode).toBe(201);

        const first = await findByCode(firstPayload.code);

        const response = await api(
            adminToken,
            "put",
            `/api/properties/${first.id}`
        ).send({ code: secondPayload.code });

        expect(response.statusCode).toBe(409);

        const saved = await findByCode(firstPayload.code);

        expect(saved).not.toBeNull();
        expect(saved.code).toBe(firstPayload.code);
    });

    test("allows a MANAGER to create a property in an assigned complex", async () => {
        const payload = landPayload();

        const response = await createProperty(payload, managerToken);

        expect(response.statusCode).toBe(201);

        const saved = await findByCode(payload.code);

        expect(saved).not.toBeNull();
        expect(saved.complexId).toBe(complexA.id);
    });

    test("denies a MANAGER from creating a property in an unassigned complex", async () => {
        const payload = landPayload({
            complexId: complexB.id,
        });

        const response = await createProperty(payload, managerToken);

        expect(response.statusCode).toBe(403);
        expect(await findByCode(payload.code)).toBeNull();
    });

    test("limits property lists to the MANAGER's assigned complex", async () => {
        const payloadA = landPayload();
        const payloadB = landPayload({
            complexId: complexB.id,
        });

        expect((await createProperty(payloadA)).statusCode).toBe(201);
        expect((await createProperty(payloadB)).statusCode).toBe(201);

        const propertyA = await findByCode(payloadA.code);
        const propertyB = await findByCode(payloadB.code);

        const response = await api(
            managerToken,
            "get",
            "/api/properties"
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);

        const returnedIds = response.body.data.map(
            (property) => property.id
        );

        expect(returnedIds).toContain(propertyA.id);
        expect(returnedIds).not.toContain(propertyB.id);
    });

    test("denies a MANAGER from reading a property outside their complex", async () => {
        const payload = landPayload({
            complexId: complexB.id,
        });

        expect((await createProperty(payload)).statusCode).toBe(201);

        const property = await findByCode(payload.code);

        const response = await api(
            managerToken,
            "get",
            `/api/properties/${property.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("prevents a MANAGER from moving a property to an unassigned complex", async () => {
        const payload = landPayload();
        expect((await createProperty(payload)).statusCode).toBe(201);

        const property = await findByCode(payload.code);

        const response = await api(
            managerToken,
            "put",
            `/api/properties/${property.id}`
        ).send({ complexId: complexB.id });

        expect(response.statusCode).toBe(403);

        const unchanged = await prisma.property.findUnique({
            where: { id: property.id },
        });

        expect(unchanged.complexId).toBe(complexA.id);
    });

    test("allows ADMIN to move a property between complexes", async () => {
        const payload = landPayload();
        expect((await createProperty(payload)).statusCode).toBe(201);

        const property = await findByCode(payload.code);

        const response = await api(
            adminToken,
            "put",
            `/api/properties/${property.id}`
        ).send({ complexId: complexB.id });

        expect(response.statusCode).toBe(200);

        const saved = await prisma.property.findUnique({
            where: { id: property.id },
        });

        expect(saved.complexId).toBe(complexB.id);
    });

    test("filters search results to the MANAGER's accessible complexes", async () => {
        const payloadA = landPayload();
        const payloadB = landPayload({
            complexId: complexB.id,
        });

        expect((await createProperty(payloadA)).statusCode).toBe(201);
        expect((await createProperty(payloadB)).statusCode).toBe(201);

        const response = await api(
            managerToken,
            "get",
            `/api/properties/search?q=${encodeURIComponent(payloadB.code)}`
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(0);
    });


    test("returns property detail, owners, and residents", async () => {
        const payload = villaPayload({
            landArea: 200,
            builtArea: 100,
        });

        const created = await createProperty(payload);
        expect(created.statusCode).toBe(201);

        const property = await findByCode(payload.code);
        const person = await makePerson();

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

        const detail = await api(
            adminToken,
            "get",
            `/api/properties/detail/${property.id}`
        );

        expect(detail.statusCode).toBe(200);
        expect(detail.body.data.id).toBe(property.id);
        expect(detail.body.data.complex.id).toBe(complexA.id);
        expect(detail.body.data.owners).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: person.id,
                    share: 100,
                }),
            ])
        );
        expect(detail.body.data.residents).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: person.id,
                    type: "OWNER",
                }),
            ])
        );

        const owners = await api(
            adminToken,
            "get",
            `/api/properties/${property.id}/owners`
        );

        expect(owners.statusCode).toBe(200);
        expect(owners.body.data.owners).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: person.id,
                    share: 100,
                }),
            ])
        );

        const residents = await api(
            adminToken,
            "get",
            `/api/properties/${property.id}/residents`
        );

        expect(residents.statusCode).toBe(200);
        expect(residents.body.data.residents).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: person.id,
                    type: "OWNER",
                }),
            ])
        );
    });

    test("denies MANAGER access to detail, owners, and residents outside assigned complex", async () => {
        const payload = villaPayload({
            complexId: complexB.id,
            landArea: 200,
            builtArea: 100,
        });

        expect((await createProperty(payload)).statusCode).toBe(201);

        const property = await findByCode(payload.code);

        const paths = [
            `/api/properties/detail/${property.id}`,
            `/api/properties/${property.id}/owners`,
            `/api/properties/${property.id}/residents`,
        ];

        for (const path of paths) {
            const response = await api(managerToken, "get", path);
            expect(response.statusCode).toBe(403);
        }
    });

    test("returns 404 for missing property detail, owners, and residents", async () => {
        const missingId = "00000000-0000-4000-8000-000000000001";

        const paths = [
            `/api/properties/detail/${missingId}`,
            `/api/properties/${missingId}/owners`,
            `/api/properties/${missingId}/residents`,
        ];

        for (const path of paths) {
            const response = await api(adminToken, "get", path);
            expect(response.statusCode).toBe(404);
        }
    });

    test("deletes a property, cascades dependent records, and preserves Unit with null propertyId", async () => {
        const payload = villaPayload({
            landArea: 200,
            builtArea: 100,
        });

        expect((await createProperty(payload)).statusCode).toBe(201);

        const property = await findByCode(payload.code);
        const person = await makePerson();

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

        await prisma.propertyAddress.create({
            data: {
                propertyId: property.id,
                mainStreet: "Test Street",
            },
        });

        const unit = await prisma.unit.create({
            data: {
                unitNumber: `${tag}-${caseNumber}`,
                code: `${tag}-unit-${caseNumber}`,
                propertyId: property.id,
            },
        });

        const response = await api(
            adminToken,
            "delete",
            `/api/properties/${property.id}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.property.findUnique({
                where: { id: property.id },
            })
        ).toBeNull();

        expect(
            await prisma.ownership.count({
                where: { propertyId: property.id },
            })
        ).toBe(0);

        expect(
            await prisma.residency.count({
                where: { propertyId: property.id },
            })
        ).toBe(0);

        expect(
            await prisma.propertyAddress.findUnique({
                where: { propertyId: property.id },
            })
        ).toBeNull();

        const savedUnit = await prisma.unit.findUnique({
            where: { id: unit.id },
        });

        expect(savedUnit).not.toBeNull();
        expect(savedUnit.propertyId).toBeNull();
    });
});
