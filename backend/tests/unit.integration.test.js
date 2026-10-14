const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `unit-it-${process.pid}-${Date.now()}`;

let complexA;
let complexB;
let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

let caseNumber = 0;
let unitCounter = 0;
let buildingCounter = 0;
let propertyCounter = 0;

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

function nextUnitNumber() {
    unitCounter += 1;
    return `${tag}-unit-${caseNumber}-${unitCounter}`;
}

function nextUnitCode() {
    unitCounter += 1;
    return `${tag}-unit-code-${caseNumber}-${unitCounter}`;
}

async function makeBuilding(complexId = complexA.id) {
    buildingCounter += 1;

    return prisma.building.create({
        data: {
            name: `${tag}-building-${caseNumber}-${buildingCounter}`,
            complexId,
        },
    });
}

async function makeProperty(complexId = complexA.id) {
    propertyCounter += 1;

    return prisma.property.create({
        data: {
            code: `${tag}-property-${caseNumber}-${propertyCounter}`,
            propertyType: "LAND",
            status: "VACANT",
            complexId,
        },
    });
}

function unitPayload(extra = {}) {
    return {
        unitNumber: nextUnitNumber(),
        ...extra,
    };
}

async function createUnit(payload, token = adminToken) {
    return api(token, "post", "/api/units").send(payload);
}

async function cleanupUnitFixtures() {
    // Delete test Units before their Building/Property resources.
    await prisma.unit.deleteMany({
        where: {
            unitNumber: {
                startsWith: `${tag}-unit-`,
            },
        },
    });

    await prisma.building.deleteMany({
        where: {
            name: {
                startsWith: `${tag}-building-`,
            },
        },
    });

    await prisma.property.deleteMany({
        where: {
            code: {
                startsWith: `${tag}-property-`,
            },
        },
    });
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

    // Safety guard: never create or modify fixtures in the main database.
    const rows = await prisma.$queryRaw`
        SELECT current_database() AS name
    `;

    if (rows[0]?.name !== "shahrakyar_test") {
        throw new Error(
            `TEST SAFETY STOP: expected shahrakyar_test, got ${rows[0]?.name}`
        );
    }

    complexA = await prisma.complex.create({
        data: {
            name: `${tag}-complex-A`,
        },
    });

    complexB = await prisma.complex.create({
        data: {
            name: `${tag}-complex-B`,
        },
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
    await cleanupUnitFixtures();
});

afterAll(async () => {
    try {
        await cleanupUnitFixtures();

        const complexIds = [
            complexA?.id,
            complexB?.id,
        ].filter(Boolean);

        if (complexIds.length > 0) {
            await prisma.complexManager.deleteMany({
                where: {
                    complexId: {
                        in: complexIds,
                    },
                },
            });

            await prisma.complex.deleteMany({
                where: {
                    id: {
                        in: complexIds,
                    },
                },
            });
        }

        const userIds = [
            admin?.id,
            manager?.id,
            regularUser?.id,
        ].filter(Boolean);

        if (userIds.length > 0) {
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
});

describe("Unit integration tests", () => {
    test("requires authentication", async () => {
        const response = await request(app).get("/api/units");

        expect(response.statusCode).toBe(401);
    });

    test("denies the USER role", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/units"
        );

        expect(response.statusCode).toBe(403);
    });

    test("requires unitNumber", async () => {
        const building = await makeBuilding();

        const response = await createUnit({
            buildingId: building.id,
        });

        expect(response.statusCode).toBe(400);
    });

    test("rejects a blank unitNumber", async () => {
        const building = await makeBuilding();

        const response = await createUnit({
            unitNumber: "   ",
            buildingId: building.id,
        });

        expect(response.statusCode).toBe(400);
    });

    test("rejects a non-integer floor", async () => {
        const building = await makeBuilding();

        const response = await createUnit(
            unitPayload({
                buildingId: building.id,
                floor: "2",
            })
        );

        expect(response.statusCode).toBe(400);
    });

    test("rejects a non-positive or non-numeric area", async () => {
        const building = await makeBuilding();

        const zero = await createUnit(
            unitPayload({
                buildingId: building.id,
                area: 0,
            })
        );

        const text = await createUnit(
            unitPayload({
                buildingId: building.id,
                area: "120",
            })
        );

        expect(zero.statusCode).toBe(400);
        expect(text.statusCode).toBe(400);
    });

    test("rejects an invalid buildingId UUID", async () => {
        const response = await createUnit(
            unitPayload({
                buildingId: "not-a-uuid",
            })
        );

        expect(response.statusCode).toBe(400);
    });

    test("returns 404 for a nonexistent property", async () => {
        const response = await createUnit(
            unitPayload({
                propertyId: "00000000-0000-4000-8000-000000000002",
            })
        );

        expect(response.statusCode).toBe(404);
    });

    test("requires a building or property association", async () => {
        const response = await createUnit(unitPayload());

        expect(response.statusCode).toBe(400);
    });

    test("rejects a building and property from different complexes", async () => {
        const building = await makeBuilding(complexA.id);
        const property = await makeProperty(complexB.id);

        const response = await createUnit(
            unitPayload({
                buildingId: building.id,
                propertyId: property.id,
            })
        );

        expect(response.statusCode).toBe(400);
    });

    test("creates a Unit linked to a Building", async () => {
        const building = await makeBuilding();
        const payload = unitPayload({
            buildingId: building.id,
            floor: 2,
            area: 125,
            code: nextUnitCode(),
        });

        const response = await createUnit(payload);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.unit.unitNumber).toBe(payload.unitNumber);

        const saved = await prisma.unit.findFirst({
            where: {
                unitNumber: payload.unitNumber,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.buildingId).toBe(building.id);
        expect(saved.floor).toBe(2);
        expect(saved.area).toBe(125);
        expect(saved.code).toBe(payload.code);
    });

    test("creates a Unit linked to a Property without a Building", async () => {
        const property = await makeProperty();

        const payload = unitPayload({
            propertyId: property.id,
            code: nextUnitCode(),
        });

        const response = await createUnit(payload);

        expect(response.statusCode).toBe(201);

        const saved = await prisma.unit.findFirst({
            where: {
                unitNumber: payload.unitNumber,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.propertyId).toBe(property.id);
        expect(saved.buildingId).toBeNull();
    });

    test("MANAGER can create a Unit in an assigned complex", async () => {
        const building = await makeBuilding(complexA.id);

        const payload = unitPayload({
            buildingId: building.id,
        });

        const response = await createUnit(payload, managerToken);

        expect(response.statusCode).toBe(201);

        const saved = await prisma.unit.findFirst({
            where: {
                unitNumber: payload.unitNumber,
            },
        });

        expect(saved).not.toBeNull();
    });

    test("MANAGER cannot create a Unit in an unassigned complex", async () => {
        const building = await makeBuilding(complexB.id);

        const payload = unitPayload({
            buildingId: building.id,
        });

        const response = await createUnit(payload, managerToken);

        expect(response.statusCode).toBe(403);

        expect(
            await prisma.unit.findFirst({
                where: {
                    unitNumber: payload.unitNumber,
                },
            })
        ).toBeNull();
    });

    test("rejects duplicate Unit codes", async () => {
        const building = await makeBuilding();
        const code = nextUnitCode();

        const first = await createUnit(
            unitPayload({
                buildingId: building.id,
                code,
            })
        );

        const second = await createUnit(
            unitPayload({
                buildingId: building.id,
                code,
            })
        );

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(409);

        expect(
            await prisma.unit.count({
                where: { code },
            })
        ).toBe(1);
    });

    test("ADMIN can see Units in both complexes", async () => {
        const buildingA = await makeBuilding(complexA.id);
        const buildingB = await makeBuilding(complexB.id);

        const payloadA = unitPayload({
            buildingId: buildingA.id,
            code: nextUnitCode(),
        });

        const payloadB = unitPayload({
            buildingId: buildingB.id,
            code: nextUnitCode(),
        });

        expect((await createUnit(payloadA)).statusCode).toBe(201);
        expect((await createUnit(payloadB)).statusCode).toBe(201);

        const response = await api(
            adminToken,
            "get",
            "/api/units"
        );

        expect(response.statusCode).toBe(200);

        const numbers = response.body.units.map(
            (unit) => unit.unitNumber
        );

        expect(numbers).toContain(payloadA.unitNumber);
        expect(numbers).toContain(payloadB.unitNumber);
    });

    test("MANAGER sees Units only in assigned complexes", async () => {
        const buildingA = await makeBuilding(complexA.id);
        const buildingB = await makeBuilding(complexB.id);

        const payloadA = unitPayload({
            buildingId: buildingA.id,
            code: nextUnitCode(),
        });

        const payloadB = unitPayload({
            buildingId: buildingB.id,
            code: nextUnitCode(),
        });

        expect((await createUnit(payloadA)).statusCode).toBe(201);
        expect((await createUnit(payloadB)).statusCode).toBe(201);

        const response = await api(
            managerToken,
            "get",
            "/api/units"
        );

        expect(response.statusCode).toBe(200);

        const numbers = response.body.units.map(
            (unit) => unit.unitNumber
        );

        expect(numbers).toContain(payloadA.unitNumber);
        expect(numbers).not.toContain(payloadB.unitNumber);
    });

    test("returns 400 for an invalid Unit ID", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/units/not-a-uuid"
        );

        expect(response.statusCode).toBe(400);
    });

    test("returns 404 for a nonexistent Unit", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/units/00000000-0000-4000-8000-000000000003"
        );

        expect(response.statusCode).toBe(404);
    });

    test("MANAGER cannot read a Unit outside their assigned complex", async () => {
        const building = await makeBuilding(complexB.id);

        const payload = unitPayload({
            buildingId: building.id,
        });

        const created = await createUnit(payload);

        expect(created.statusCode).toBe(201);

        const response = await api(
            managerToken,
            "get",
            `/api/units/${created.body.unit.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("rejects an empty update", async () => {
        const building = await makeBuilding();

        const created = await createUnit(
            unitPayload({
                buildingId: building.id,
                area: 100,
            })
        );

        expect(created.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "put",
            `/api/units/${created.body.unit.id}`
        ).send({});

        expect(response.statusCode).toBe(400);
    });

    test("rejects invalid update data and preserves existing values", async () => {
        const building = await makeBuilding();

        const payload = unitPayload({
            buildingId: building.id,
            area: 100,
        });

        const created = await createUnit(payload);

        expect(created.statusCode).toBe(201);

        const id = created.body.unit.id;

        const response = await api(
            adminToken,
            "put",
            `/api/units/${id}`
        ).send({
            unitNumber: "updated-number",
            area: 0,
        });

        expect(response.statusCode).toBe(400);

        const saved = await prisma.unit.findUnique({
            where: { id },
        });

        expect(saved.unitNumber).toBe(payload.unitNumber);
        expect(saved.area).toBe(100);
    });

    test("updates Unit fields and persists them", async () => {
        const building = await makeBuilding();

        const created = await createUnit(
            unitPayload({
                buildingId: building.id,
                floor: 1,
                area: 100,
            })
        );

        expect(created.statusCode).toBe(201);

        const id = created.body.unit.id;
        const newCode = nextUnitCode();

        const response = await api(
            adminToken,
            "put",
            `/api/units/${id}`
        ).send({
            unitNumber: nextUnitNumber(),
            floor: 3,
            area: 135,
            code: newCode,
        });

        expect(response.statusCode).toBe(200);

        const saved = await prisma.unit.findUnique({
            where: { id },
        });

        expect(saved.floor).toBe(3);
        expect(saved.area).toBe(135);
        expect(saved.code).toBe(newCode);
        expect(saved.unitNumber).not.toBe(created.body.unit.unitNumber);
    });

    test("rejects a duplicate code on update and preserves the original code", async () => {
        const building = await makeBuilding();
        const firstCode = nextUnitCode();
        const secondCode = nextUnitCode();

        const first = await createUnit(
            unitPayload({
                buildingId: building.id,
                code: firstCode,
            })
        );

        const second = await createUnit(
            unitPayload({
                buildingId: building.id,
                code: secondCode,
            })
        );

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "put",
            `/api/units/${first.body.unit.id}`
        ).send({
            code: secondCode,
        });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.unit.findUnique({
            where: {
                id: first.body.unit.id,
            },
        });

        expect(saved.code).toBe(firstCode);
    });

    test("MANAGER cannot move a Unit to an unassigned complex", async () => {
        const buildingA = await makeBuilding(complexA.id);
        const propertyA = await makeProperty(complexA.id);
        const buildingB = await makeBuilding(complexB.id);
        const propertyB = await makeProperty(complexB.id);

        const created = await createUnit(
            unitPayload({
                buildingId: buildingA.id,
                propertyId: propertyA.id,
            })
        );

        expect(created.statusCode).toBe(201);

        const response = await api(
            managerToken,
            "put",
            `/api/units/${created.body.unit.id}`
        ).send({
            buildingId: buildingB.id,
            propertyId: propertyB.id,
        });

        expect(response.statusCode).toBe(403);

        const saved = await prisma.unit.findUnique({
            where: {
                id: created.body.unit.id,
            },
        });

        expect(saved.buildingId).toBe(buildingA.id);
        expect(saved.propertyId).toBe(propertyA.id);
    });

    test("ADMIN can move a Unit when the new Building and Property share a complex", async () => {
        const buildingA = await makeBuilding(complexA.id);
        const propertyA = await makeProperty(complexA.id);
        const buildingB = await makeBuilding(complexB.id);
        const propertyB = await makeProperty(complexB.id);

        const created = await createUnit(
            unitPayload({
                buildingId: buildingA.id,
                propertyId: propertyA.id,
            })
        );

        expect(created.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "put",
            `/api/units/${created.body.unit.id}`
        ).send({
            buildingId: buildingB.id,
            propertyId: propertyB.id,
        });

        expect(response.statusCode).toBe(200);

        const saved = await prisma.unit.findUnique({
            where: {
                id: created.body.unit.id,
            },
        });

        expect(saved.buildingId).toBe(buildingB.id);
        expect(saved.propertyId).toBe(propertyB.id);
    });



    test("MANAGER cannot update or delete a Unit in an unassigned complex", async () => {
        const buildingB = await makeBuilding(complexB.id);

        const payload = unitPayload({
            buildingId: buildingB.id,
            code: nextUnitCode(),
            unitNumber: nextUnitNumber(),
        });

        const created = await createUnit(payload);
        expect(created.statusCode).toBe(201);

        const id = created.body.unit.id;

        const before = await prisma.unit.findUnique({
            where: { id },
        });

        expect(before).not.toBeNull();

        const updateResponse = await api(
            managerToken,
            "put",
            `/api/units/${id}`
        ).send({
            unitNumber: nextUnitNumber(),
        });

        expect(updateResponse.statusCode).toBe(403);

        const afterUpdate = await prisma.unit.findUnique({
            where: { id },
        });

        expect(afterUpdate).not.toBeNull();
        expect(afterUpdate.unitNumber).toBe(before.unitNumber);
        expect(afterUpdate.buildingId).toBe(before.buildingId);
        expect(afterUpdate.propertyId).toBe(before.propertyId);

        const deleteResponse = await api(
            managerToken,
            "delete",
            `/api/units/${id}`
        );

        expect(deleteResponse.statusCode).toBe(403);

        const afterDelete = await prisma.unit.findUnique({
            where: { id },
        });

        expect(afterDelete).not.toBeNull();
        expect(afterDelete.unitNumber).toBe(before.unitNumber);
        expect(afterDelete.buildingId).toBe(before.buildingId);
        expect(afterDelete.propertyId).toBe(before.propertyId);
    });

    test("returns 400 when deleting a Unit with an invalid ID", async () => {
        const response = await api(
            adminToken,
            "delete",
            "/api/units/not-a-valid-uuid"
        );

        expect(response.statusCode).toBe(400);
    });

    test("returns 404 when deleting a nonexistent Unit", async () => {
        const missingId = require("crypto").randomUUID();

        const response = await api(
            adminToken,
            "delete",
            `/api/units/${missingId}`
        );

        expect(response.statusCode).toBe(404);
    });

    test("deletes a Unit", async () => {
        const building = await makeBuilding();

        const created = await createUnit(
            unitPayload({
                buildingId: building.id,
            })
        );

        expect(created.statusCode).toBe(201);

        const id = created.body.unit.id;

        const response = await api(
            adminToken,
            "delete",
            `/api/units/${id}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.unit.findUnique({
                where: { id },
            })
        ).toBeNull();
    });

    test("MANAGER list stays successful when an orphan Unit has no Building or Property", async () => {
        const orphan = await prisma.unit.create({
            data: {
                unitNumber: nextUnitNumber(),
                code: nextUnitCode(),
                buildingId: null,
                propertyId: null,
            },
        });

        const response = await api(
            managerToken,
            "get",
            "/api/units"
        );

        expect(response.statusCode).toBe(200);

        const ids = response.body.units.map((unit) => unit.id);

        expect(ids).not.toContain(orphan.id);
    });
});
