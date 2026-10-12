const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `building-it-${process.pid}-${Date.now()}`;

let complexA;
let complexB;
let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

let caseNumber = 0;
let nameCounter = 0;

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

function nextBuildingName() {
    nameCounter += 1;
    return `${tag}-building-${caseNumber}-${nameCounter}`;
}

async function createBuilding(
    name = nextBuildingName(),
    complexId = complexA.id,
    token = adminToken,
    extra = {}
) {
    return api(token, "post", "/api/buildings").send({
        name,
        complexId,
        ...extra,
    });
}

async function cleanupBuildingFixtures() {
    // Units are removed first because deleting a Building sets
    // Unit.buildingId to null rather than deleting the Unit.
    await prisma.unit.deleteMany({
        where: {
            unitNumber: {
                startsWith: `${tag}-unit-`,
            },
        },
    });

    const buildings = await prisma.building.findMany({
        where: {
            name: {
                startsWith: `${tag}-building-`,
            },
        },
        select: { id: true },
    });

    if (buildings.length > 0) {
        await prisma.building.deleteMany({
            where: {
                id: {
                    in: buildings.map((building) => building.id),
                },
            },
        });
    }
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

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
    await cleanupBuildingFixtures();
});

afterAll(async () => {
    try {
        await cleanupBuildingFixtures();

        const complexIds = [complexA?.id, complexB?.id].filter(Boolean);

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

describe("Building integration tests", () => {
    test("requires authentication", async () => {
        const response = await request(app).get("/api/buildings");

        expect(response.statusCode).toBe(401);
    });

    test("denies the USER role", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/buildings"
        );

        expect(response.statusCode).toBe(403);
    });

    test("rejects a missing or blank building name", async () => {
        const missing = await api(
            adminToken,
            "post",
            "/api/buildings"
        ).send({ complexId: complexA.id });

        const blank = await createBuilding("   ");

        expect(missing.statusCode).toBe(400);
        expect(blank.statusCode).toBe(400);
    });

    test("rejects an invalid complex UUID", async () => {
        const response = await createBuilding(
            nextBuildingName(),
            "not-a-uuid"
        );

        expect(response.statusCode).toBe(400);
    });

    test("ADMIN creates a building and the name is trimmed", async () => {
        const name = nextBuildingName();

        const response = await createBuilding(`  ${name}  `);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.building.name).toBe(name);

        const saved = await prisma.building.findFirst({
            where: {
                complexId: complexA.id,
                name,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.name).toBe(name);
    });

    test("MANAGER can create a building in an assigned complex", async () => {
        const name = nextBuildingName();

        const response = await createBuilding(
            name,
            complexA.id,
            managerToken
        );

        expect(response.statusCode).toBe(201);

        const saved = await prisma.building.findFirst({
            where: {
                complexId: complexA.id,
                name,
            },
        });

        expect(saved).not.toBeNull();
    });

    test("MANAGER cannot create a building in an unassigned complex", async () => {
        const name = nextBuildingName();

        const response = await createBuilding(
            name,
            complexB.id,
            managerToken
        );

        expect(response.statusCode).toBe(403);

        expect(
            await prisma.building.findFirst({
                where: {
                    complexId: complexB.id,
                    name,
                },
            })
        ).toBeNull();
    });

    test("rejects a duplicate building name in the same complex", async () => {
        const name = nextBuildingName();

        const first = await createBuilding(name);
        const duplicate = await createBuilding(name);

        expect(first.statusCode).toBe(201);
        expect(duplicate.statusCode).toBe(409);
    });

    test("allows the same building name in different complexes", async () => {
        const name = nextBuildingName();

        const first = await createBuilding(name, complexA.id);
        const second = await createBuilding(name, complexB.id);

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);

        const count = await prisma.building.count({
            where: { name },
        });

        expect(count).toBe(2);
    });

    test("ADMIN sees buildings from both complexes", async () => {
        const nameA = nextBuildingName();
        const nameB = nextBuildingName();

        await createBuilding(nameA, complexA.id);
        await createBuilding(nameB, complexB.id);

        const response = await api(
            adminToken,
            "get",
            "/api/buildings"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const names = response.body.buildings.map(
            (building) => building.name
        );

        expect(names).toContain(nameA);
        expect(names).toContain(nameB);
    });

    test("MANAGER sees only buildings in assigned complexes", async () => {
        const nameA = nextBuildingName();
        const nameB = nextBuildingName();

        await createBuilding(nameA, complexA.id);
        await createBuilding(nameB, complexB.id);

        const response = await api(
            managerToken,
            "get",
            "/api/buildings"
        );

        expect(response.statusCode).toBe(200);

        const names = response.body.buildings.map(
            (building) => building.name
        );

        expect(names).toContain(nameA);
        expect(names).not.toContain(nameB);
    });

    test("MANAGER cannot read a building in an unassigned complex", async () => {
        const created = await createBuilding(
            nextBuildingName(),
            complexB.id
        );

        expect(created.statusCode).toBe(201);

        const response = await api(
            managerToken,
            "get",
            `/api/buildings/${created.body.building.id}`
        );

        expect(response.statusCode).toBe(403);
    });

    test("updates allowed fields and ignores complexId in update data", async () => {
        const created = await createBuilding();

        expect(created.statusCode).toBe(201);

        const id = created.body.building.id;
        const updatedName = nextBuildingName();

        const response = await api(
            adminToken,
            "put",
            `/api/buildings/${id}`
        ).send({
            name: ` ${updatedName} `,
            address: "Test Address",
            description: "Updated description",
            complexId: complexB.id,
        });

        expect(response.statusCode).toBe(200);

        const saved = await prisma.building.findUnique({
            where: { id },
        });

        expect(saved.name).toBe(updatedName);
        expect(saved.address).toBe("Test Address");
        expect(saved.description).toBe("Updated description");
        expect(saved.complexId).toBe(complexA.id);
    });

    test("rejects empty update data and blank updated name", async () => {
        const created = await createBuilding();
        const id = created.body.building.id;

        const empty = await api(
            adminToken,
            "put",
            `/api/buildings/${id}`
        ).send({});

        const blank = await api(
            adminToken,
            "put",
            `/api/buildings/${id}`
        ).send({ name: "   " });

        expect(empty.statusCode).toBe(400);
        expect(blank.statusCode).toBe(400);
    });

    test("rejects duplicate name on update and preserves existing data", async () => {
        const existingName = nextBuildingName();
        const first = await createBuilding(existingName);
        const second = await createBuilding();

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(201);

        const secondId = second.body.building.id;

        const response = await api(
            adminToken,
            "put",
            `/api/buildings/${secondId}`
        ).send({ name: existingName });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.building.findUnique({
            where: { id: secondId },
        });

        expect(saved.name).toBe(second.body.building.name);
    });

    test("returns 400 for an invalid building ID", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/buildings/not-a-uuid"
        );

        expect(response.statusCode).toBe(400);
    });

    test("returns 404 when the building does not exist", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/buildings/00000000-0000-4000-8000-000000000001"
        );

        expect(response.statusCode).toBe(404);
    });

    test("deleting a building preserves its Unit with buildingId set to null", async () => {
        const created = await createBuilding();

        expect(created.statusCode).toBe(201);

        const buildingId = created.body.building.id;

        const unit = await prisma.unit.create({
            data: {
                unitNumber: `${tag}-unit-${caseNumber}`,
                code: `${tag}-unit-code-${caseNumber}`,
                buildingId,
            },
        });

        const response = await api(
            adminToken,
            "delete",
            `/api/buildings/${buildingId}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.building.findUnique({
                where: { id: buildingId },
            })
        ).toBeNull();

        const savedUnit = await prisma.unit.findUnique({
            where: { id: unit.id },
        });

        expect(savedUnit).not.toBeNull();
        expect(savedUnit.buildingId).toBeNull();
    });
});
