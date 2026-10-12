const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `person-it-${process.pid}-${Date.now()}`;

let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

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

function personPayload(extra = {}) {
    personCounter += 1;
    const number = personCounter;

    return {
        firstName: `${tag}-First-${number}`,
        lastName: `Last-${number}`,
        mobile: `${tag}-mobile-${number}`,
        email: `${tag}-person-${number}@example.test`,
        nationalId: `${tag}-national-${number}`,
        ...extra,
    };
}

async function createPerson(payload = personPayload(), token = adminToken) {
    return api(token, "post", "/api/persons").send(payload);
}

async function cleanupPersonFixtures() {
    // Every test Person is created with a unique nationalId prefix.
    // Cleanup is therefore limited to fixtures from this test run.
    await prisma.person.deleteMany({
        where: {
            nationalId: {
                startsWith: `${tag}-national-`,
            },
        },
    });
}

const securedRoutes = [
    ["list persons", "get", "/api/persons"],
    ["create person", "post", "/api/persons"],
    [
        "get person",
        "get",
        "/api/persons/00000000-0000-4000-8000-000000000011",
    ],
    [
        "update person",
        "put",
        "/api/persons/00000000-0000-4000-8000-000000000011",
    ],
    [
        "delete person",
        "delete",
        "/api/persons/00000000-0000-4000-8000-000000000011",
    ],
    [
        "get person properties",
        "get",
        "/api/persons/00000000-0000-4000-8000-000000000011/properties",
    ],
    [
        "get person residencies",
        "get",
        "/api/persons/00000000-0000-4000-8000-000000000011/residencies",
    ],
];

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

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    userToken = tokenFor(regularUser);
});

afterEach(async () => {
    await cleanupPersonFixtures();
});

afterAll(async () => {
    try {
        await cleanupPersonFixtures();

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

describe("Person integration tests", () => {
    test.each(securedRoutes)(
        "%s requires authentication",
        async (_label, method, path) => {
            const response = await request(app)[method](path);

            expect(response.statusCode).toBe(401);
        }
    );

    test.each([
        ["USER", () => userToken],
        ["MANAGER", () => managerToken],
    ])("%s cannot list or create Persons", async (_role, tokenFactory) => {
        const token = tokenFactory();

        const list = await api(
            token,
            "get",
            "/api/persons"
        );

        const payload = personPayload();

        const create = await createPerson(payload, token);

        expect(list.statusCode).toBe(403);
        expect(create.statusCode).toBe(403);

        expect(
            await prisma.person.findUnique({
                where: {
                    nationalId: payload.nationalId,
                },
            })
        ).toBeNull();
    });

    test("ADMIN creates a Person and persists the data", async () => {
        const payload = personPayload();

        const response = await createPerson(payload);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.firstName).toBe(payload.firstName);
        expect(response.body.data.lastName).toBe(payload.lastName);
        expect(response.body.data.mobile).toBe(payload.mobile);
        expect(response.body.data.nationalId).toBe(payload.nationalId);

        const saved = await prisma.person.findUnique({
            where: {
                nationalId: payload.nationalId,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.email).toBe(payload.email);
        expect(saved.status).toBe("ACTIVE");
    });

    test("rejects missing required fields", async () => {
        const cases = [
            ["firstName", { lastName: "Last", mobile: "09120000001" }],
            ["lastName", { firstName: "First", mobile: "09120000002" }],
            ["mobile", { firstName: "First", lastName: "Last" }],
        ];

        for (const [field, partial] of cases) {
            const response = await api(
                adminToken,
                "post",
                "/api/persons"
            ).send(partial);

            expect(response.statusCode).toBe(400);
        }
    });

    test("rejects a duplicate nationalId", async () => {
        const payload = personPayload();

        const first = await createPerson(payload);
        const duplicatePayload = personPayload({
            nationalId: payload.nationalId,
        });
        const duplicate = await createPerson(duplicatePayload);

        expect(first.statusCode).toBe(201);
        expect(duplicate.statusCode).toBe(409);

        expect(
            await prisma.person.count({
                where: {
                    nationalId: payload.nationalId,
                },
            })
        ).toBe(1);
    });

    test("ADMIN lists Persons including a newly created Person", async () => {
        const created = await createPerson();

        expect(created.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "get",
            "/api/persons"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);

        expect(
            response.body.data.some(
                person => person.id === created.body.data.id
            )
        ).toBe(true);
    });

    test("ADMIN gets a Person by ID", async () => {
        const created = await createPerson();
        const id = created.body.data.id;

        const response = await api(
            adminToken,
            "get",
            `/api/persons/${id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(id);
    });

    test("returns 404 for a nonexistent Person", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/persons/00000000-0000-4000-8000-000000000012"
        );

        expect(response.statusCode).toBe(404);
    });

    test("ADMIN updates Person fields and persists them", async () => {
        const created = await createPerson();
        const id = created.body.data.id;

        const updated = {
            firstName: `${tag}-Updated`,
            lastName: "UpdatedLast",
            mobile: `${tag}-updated-mobile-${personCounter + 1}`,
        };

        const response = await api(
            adminToken,
            "put",
            `/api/persons/${id}`
        ).send(updated);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.firstName).toBe(updated.firstName);
        expect(response.body.data.lastName).toBe(updated.lastName);
        expect(response.body.data.mobile).toBe(updated.mobile);

        const saved = await prisma.person.findUnique({
            where: { id },
        });

        expect(saved.firstName).toBe(updated.firstName);
        expect(saved.lastName).toBe(updated.lastName);
        expect(saved.mobile).toBe(updated.mobile);
    });

    test("rejects a blank required field on update and preserves existing data", async () => {
        const created = await createPerson();
        const id = created.body.data.id;
        const originalFirstName = created.body.data.firstName;

        const response = await api(
            adminToken,
            "put",
            `/api/persons/${id}`
        ).send({
            firstName: "",
        });

        expect(response.statusCode).toBe(400);

        const saved = await prisma.person.findUnique({
            where: { id },
        });

        expect(saved.firstName).toBe(originalFirstName);
    });

    test("rejects an update with another Person's nationalId", async () => {
        const first = await createPerson();
        const second = await createPerson();

        const firstId = first.body.data.id;
        const secondNationalId = second.body.data.nationalId;
        const firstNationalId = first.body.data.nationalId;

        const response = await api(
            adminToken,
            "put",
            `/api/persons/${firstId}`
        ).send({
            nationalId: secondNationalId,
        });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.person.findUnique({
            where: { id: firstId },
        });

        expect(saved.nationalId).toBe(firstNationalId);
    });

    test("returns Person ownership history", async () => {
        const created = await createPerson();

        const response = await api(
            adminToken,
            "get",
            `/api/persons/${created.body.data.id}/properties`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(created.body.data.id);
        expect(response.body.data.ownerships).toEqual([]);
    });

    test("returns Person residency history", async () => {
        const created = await createPerson();

        const response = await api(
            adminToken,
            "get",
            `/api/persons/${created.body.data.id}/residencies`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(created.body.data.id);
        expect(response.body.data.residencies).toEqual([]);
    });

    test("returns 404 when ownership history Person does not exist", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/persons/00000000-0000-4000-8000-000000000013/properties"
        );

        expect(response.statusCode).toBe(404);
    });

    test("returns 404 when residency history Person does not exist", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/persons/00000000-0000-4000-8000-000000000014/residencies"
        );

        expect(response.statusCode).toBe(404);
    });

    test("MANAGER cannot update or delete a Person", async () => {
        const created = await createPerson();
        const id = created.body.data.id;

        const update = await api(
            managerToken,
            "put",
            `/api/persons/${id}`
        ).send({
            lastName: "UnauthorizedChange",
        });

        const deletion = await api(
            managerToken,
            "delete",
            `/api/persons/${id}`
        );

        expect(update.statusCode).toBe(403);
        expect(deletion.statusCode).toBe(403);

        expect(
            await prisma.person.findUnique({
                where: { id },
            })
        ).not.toBeNull();
    });

    test("ADMIN deletes a Person", async () => {
        const created = await createPerson();
        const id = created.body.data.id;

        const response = await api(
            adminToken,
            "delete",
            `/api/persons/${id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        expect(
            await prisma.person.findUnique({
                where: { id },
            })
        ).toBeNull();
    });
});
