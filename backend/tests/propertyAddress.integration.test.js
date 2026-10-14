const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `property-address-it-${process.pid}-${Date.now()}`;

let complexA;
let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

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

async function makeProperty() {
    propertyCounter += 1;

    return prisma.property.create({
        data: {
            complexId: complexA.id,
            code: `${tag}-property-${propertyCounter}`,
            propertyType: "LAND",
            status: "VACANT",
        },
    });
}

function addressPayload(propertyId, extra = {}) {
    return {
        propertyId,
        mainStreet: "Main Test Street",
        subStreet: "Second Street",
        alley: "Test Alley",
        number: "12",
        description: "PropertyAddress integration test",
        ...extra,
    };
}

async function createAddress(payload, token = adminToken) {
    return api(
        token,
        "post",
        "/api/property-addresses"
    ).send(payload);
}

async function cleanupAddressFixtures() {
    const properties = await prisma.property.findMany({
        where: {
            code: {
                startsWith: `${tag}-property-`,
            },
        },
        select: {
            id: true,
        },
    });

    const propertyIds = properties.map(
        (property) => property.id
    );

    if (propertyIds.length > 0) {
        await prisma.propertyAddress.deleteMany({
            where: {
                propertyId: {
                    in: propertyIds,
                },
            },
        });

        await prisma.property.deleteMany({
            where: {
                id: {
                    in: propertyIds,
                },
            },
        });
    }
}

const securedRoutes = [
    ["create address", "post", "/api/property-addresses"],
    ["list addresses", "get", "/api/property-addresses"],
    [
        "get address by ID",
        "get",
        "/api/property-addresses/00000000-0000-4000-8000-000000000031",
    ],
    [
        "get addresses by property",
        "get",
        "/api/property-addresses/property/00000000-0000-4000-8000-000000000032",
    ],
    [
        "update address",
        "put",
        "/api/property-addresses/00000000-0000-4000-8000-000000000033",
    ],
    [
        "delete address",
        "delete",
        "/api/property-addresses/00000000-0000-4000-8000-000000000034",
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

    complexA = await prisma.complex.create({
        data: {
            name: `${tag}-complex`,
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

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    userToken = tokenFor(regularUser);
});

afterEach(async () => {
    await cleanupAddressFixtures();
});

afterAll(async () => {
    try {
        await cleanupAddressFixtures();

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

        if (complexA?.id) {
            await prisma.complex.deleteMany({
                where: {
                    id: complexA.id,
                },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
});

describe("PropertyAddress integration tests", () => {
    test.each(securedRoutes)(
        "%s requires authentication",
        async (_label, method, path) => {
            const response = await request(app)[method](path);

            expect(response.statusCode).toBe(401);
        }
    );


    test("MANAGER and USER cannot access address list", async () => {
        const managerResponse = await api(
            managerToken,
            "get",
            "/api/property-addresses"
        );

        const userResponse = await api(
            userToken,
            "get",
            "/api/property-addresses"
        );

        expect(managerResponse.statusCode).toBe(403);
        expect(userResponse.statusCode).toBe(403);
    });

    test.each([
        ["MANAGER", () => managerToken],
        ["USER", () => userToken],
    ])(
        "%s cannot create, read, update, or delete property addresses",
        async (_role, tokenFactory) => {
            const addressProperty = await makeProperty();
            const createTargetProperty = await makeProperty();

            // نشانی اولیه را با ADMIN ایجاد می‌کنیم.
            const initialDescription =
                "Address that must remain unchanged";

            const createResponse = await createAddress(
                addressPayload(addressProperty.id, {
                    description: initialDescription,
                }),
                adminToken
            );

            expect(createResponse.statusCode).toBe(201);

            const existingAddress =
                await prisma.propertyAddress.findUnique({
                    where: {
                        propertyId: addressProperty.id,
                    },
                });

            expect(existingAddress).not.toBeNull();

            const token = tokenFactory();

            const endpoints = [
                {
                    method: "post",
                    path: "/api/property-addresses",
                    body: addressPayload(createTargetProperty.id),
                },
                {
                    method: "get",
                    path: "/api/property-addresses",
                },
                {
                    method: "get",
                    path: `/api/property-addresses/${existingAddress.id}`,
                },
                {
                    method: "get",
                    path: `/api/property-addresses/property/${addressProperty.id}`,
                },
                {
                    method: "put",
                    path: `/api/property-addresses/${existingAddress.id}`,
                    body: {
                        description: "Unauthorized address update",
                    },
                },
                {
                    method: "delete",
                    path: `/api/property-addresses/${existingAddress.id}`,
                },
            ];

            for (const endpoint of endpoints) {
                let req = api(
                    token,
                    endpoint.method,
                    endpoint.path
                );

                if (endpoint.body) {
                    req = req.send(endpoint.body);
                }

                const response = await req;

                expect(response.statusCode).toBe(403);
            }

            // ایجاد غیرمجاز نباید نشانی جدیدی ثبت کند.
            const unexpectedAddress =
                await prisma.propertyAddress.findUnique({
                    where: {
                        propertyId: createTargetProperty.id,
                    },
                });

            expect(unexpectedAddress).toBeNull();

            // نشانی اولیه باید با همان اطلاعات باقی بماند.
            const savedAddress =
                await prisma.propertyAddress.findUnique({
                    where: {
                        id: existingAddress.id,
                    },
                });

            expect(savedAddress).not.toBeNull();
            expect(savedAddress.propertyId).toBe(addressProperty.id);
            expect(savedAddress.description).toBe(initialDescription);
        }
    );


    test("ADMIN creates an address and persists its fields", async () => {
        const property = await makeProperty();
        const payload = addressPayload(property.id);

        const response = await createAddress(payload);

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.propertyId).toBe(property.id);
        expect(response.body.data.mainStreet).toBe(payload.mainStreet);
        expect(response.body.data.subStreet).toBe(payload.subStreet);
        expect(response.body.data.alley).toBe(payload.alley);
        expect(response.body.data.number).toBe(payload.number);
        expect(response.body.data.description).toBe(payload.description);

        const saved = await prisma.propertyAddress.findUnique({
            where: {
                propertyId: property.id,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.mainStreet).toBe(payload.mainStreet);
    });

    test("rejects creation without propertyId", async () => {
        const response = await createAddress({
            mainStreet: "Missing Property Street",
        });

        expect(response.statusCode).toBe(400);
    });

    test("returns 404 when the target Property does not exist", async () => {
        const response = await createAddress({
            propertyId: "00000000-0000-4000-8000-000000000035",
            mainStreet: "Unknown Property Street",
        });

        expect(response.statusCode).toBe(404);
    });

    test("rejects a second address for the same Property", async () => {
        const property = await makeProperty();

        const first = await createAddress(
            addressPayload(property.id)
        );

        const second = await createAddress(
            addressPayload(property.id, {
                mainStreet: "Duplicate Street",
            })
        );

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(409);

        expect(
            await prisma.propertyAddress.count({
                where: {
                    propertyId: property.id,
                },
            })
        ).toBe(1);
    });

    test("ADMIN lists addresses", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        expect(created.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "get",
            "/api/property-addresses"
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);

        expect(
            response.body.data.some(
                (address) => address.id === created.body.data.id
            )
        ).toBe(true);
    });

    test("gets an address by ID", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        const id = created.body.data.id;

        const response = await api(
            adminToken,
            "get",
            `/api/property-addresses/${id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(id);
        expect(response.body.data.propertyId).toBe(property.id);
    });

    test("returns 404 for an unknown address ID", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/property-addresses/00000000-0000-4000-8000-000000000036"
        );

        expect(response.statusCode).toBe(404);
    });

    test("gets addresses for a Property", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        const response = await api(
            adminToken,
            "get",
            `/api/property-addresses/property/${property.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe(created.body.data.id);
    });

    test("returns 404 when getting addresses for an unknown Property", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/property-addresses/property/00000000-0000-4000-8000-000000000037"
        );

        expect(response.statusCode).toBe(404);
    });

    test("updates address fields and persists them", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        const id = created.body.data.id;

        const response = await api(
            adminToken,
            "put",
            `/api/property-addresses/${id}`
        ).send({
            mainStreet: "Updated Main Street",
            number: "88",
            description: "Updated description",
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.mainStreet).toBe("Updated Main Street");
        expect(response.body.data.number).toBe("88");
        expect(response.body.data.description).toBe("Updated description");

        const saved = await prisma.propertyAddress.findUnique({
            where: {
                propertyId: property.id,
            },
        });

        expect(saved.mainStreet).toBe("Updated Main Street");
        expect(saved.number).toBe("88");
    });

    test("rejects an empty propertyId when updating", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        const response = await api(
            adminToken,
            "put",
            `/api/property-addresses/${created.body.data.id}`
        ).send({
            propertyId: "",
        });

        expect(response.statusCode).toBe(400);
    });

    test("rejects changing the address to a Property that already has an address", async () => {
        const propertyA = await makeProperty();
        const propertyB = await makeProperty();

        const addressA = await createAddress(
            addressPayload(propertyA.id)
        );
        const addressB = await createAddress(
            addressPayload(propertyB.id)
        );

        expect(addressA.statusCode).toBe(201);
        expect(addressB.statusCode).toBe(201);

        const response = await api(
            adminToken,
            "put",
            `/api/property-addresses/${addressA.body.data.id}`
        ).send({
            propertyId: propertyB.id,
        });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.propertyAddress.findUnique({
            where: {
                propertyId: propertyA.id,
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.id).toBe(addressA.body.data.id);
    });

    test("rejects changing an address to an unknown Property", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        const response = await api(
            adminToken,
            "put",
            `/api/property-addresses/${created.body.data.id}`
        ).send({
            propertyId: "00000000-0000-4000-8000-000000000038",
        });

        expect(response.statusCode).toBe(404);
    });

    test("deletes an address", async () => {
        const property = await makeProperty();

        const created = await createAddress(
            addressPayload(property.id)
        );

        expect(created.statusCode).toBe(201);

        const id = created.body.data.id;

        const response = await api(
            adminToken,
            "delete",
            `/api/property-addresses/${id}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.propertyAddress.findUnique({
                where: {
                    propertyId: property.id,
                },
            })
        ).toBeNull();
    });

    test("returns 404 when deleting a nonexistent address", async () => {
        const response = await api(
            adminToken,
            "delete",
            "/api/property-addresses/00000000-0000-4000-8000-000000000039"
        );

        expect(response.statusCode).toBe(404);
    });
});
