const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");

const tag = `user-auth-it-${process.pid}-${Date.now()}`;
const testPassword = "Test-Password-123!";

let admin;
let manager;
let regularUser;

let adminToken;
let managerToken;
let userToken;

let counter = 0;
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

function nextEmail(label = "account") {
    counter += 1;
    return `${tag}-${label}-${counter}@example.test`;
}

async function makePerson() {
    personCounter += 1;
    const number = personCounter;

    return prisma.person.create({
        data: {
            firstName: `${tag}-First-${number}`,
            lastName: `Person-${number}`,
            nationalId: `${tag}-national-${number}`,
            mobile: `${tag}-mobile-${number}`,
            email: `${tag}-person-${number}@example.test`,
        },
    });
}

async function makeStoredUser(
    label,
    role = "USER",
    status = "ACTIVE",
    personId = null
) {
    const data = {
        fullName: `${tag} ${label}`,
        email: nextEmail(label),
        password: await bcrypt.hash(testPassword, 10),
        role,
        status,
    };

    if (personId) {
        data.personId = personId;
    }

    return prisma.user.create({ data });
}

async function cleanupFixtures() {
    // First remove users so their person relations are set to null.
    await prisma.user.deleteMany({
        where: {
            email: {
                startsWith: tag,
            },
        },
    });

    // Only delete Persons created specifically by this test suite.
    await prisma.person.deleteMany({
        where: {
            OR: [
                {
                    nationalId: {
                        startsWith: `${tag}-national-`,
                    },
                },
                {
                    email: {
                        startsWith: `${tag}-person-`,
                    },
                },
            ],
        },
    });
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

    admin = await makeStoredUser("admin", "ADMIN");
    manager = await makeStoredUser("manager", "MANAGER");
    regularUser = await makeStoredUser("user", "USER");

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
    userToken = tokenFor(regularUser);
});

afterAll(async () => {
    try {
        await cleanupFixtures();
    } finally {
        await prisma.$disconnect();
    }
});

describe("Authentication integration tests", () => {
    test("register rejects an empty body", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({});

        expect(response.statusCode).toBe(400);
    });

    test("register rejects missing required fields", async () => {
        const cases = [
            { email: nextEmail("missing-name"), password: testPassword },
            { fullName: "Missing Email", password: testPassword },
            { fullName: "Missing Password", email: nextEmail("missing-password") },
        ];

        for (const payload of cases) {
            const response = await request(app)
                .post("/api/auth/register")
                .send(payload);

            expect(response.statusCode).toBe(400);
        }
    });

    test("register creates a USER with ACTIVE status and never returns the password", async () => {
        const email = nextEmail("register");
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: `${tag} Registered`,
                email,
                password: testPassword,
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user.role).toBe("USER");
        expect(response.body.user.status).toBe("ACTIVE");
        expect(response.body.user).not.toHaveProperty("password");

        const saved = await prisma.user.findUnique({
            where: { email },
        });

        expect(saved).not.toBeNull();
        expect(saved.password).not.toBe(testPassword);
        expect(await bcrypt.compare(testPassword, saved.password)).toBe(true);
    });

    test("register cannot self-assign ADMIN or BLOCKED status", async () => {
        const email = nextEmail("self-promotion");

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: `${tag} Self Promotion`,
                email,
                password: testPassword,
                role: "ADMIN",
                status: "BLOCKED",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.user.role).toBe("USER");
        expect(response.body.user.status).toBe("ACTIVE");

        const saved = await prisma.user.findUnique({
            where: { email },
        });

        expect(saved.role).toBe("USER");
        expect(saved.status).toBe("ACTIVE");
    });

    test("register rejects an existing email", async () => {
        const email = nextEmail("duplicate-register");

        const first = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: `${tag} First`,
                email,
                password: testPassword,
            });

        const duplicate = await request(app)
            .post("/api/auth/register")
            .send({
                fullName: `${tag} Duplicate`,
                email,
                password: testPassword,
            });

        expect(first.statusCode).toBe(201);
        expect(duplicate.statusCode).toBe(409);
    });

    test("login rejects missing credentials", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: nextEmail("login-missing") });

        expect(response.statusCode).toBe(400);
    });

    test("login rejects an unknown email", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: nextEmail("unknown"),
                password: testPassword,
            });

        expect(response.statusCode).toBe(401);
    });

    test("login rejects an incorrect password", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: regularUser.email,
                password: "Incorrect-Password",
            });

        expect(response.statusCode).toBe(401);
    });

    test("login returns a valid token for an ACTIVE account", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: regularUser.email,
                password: testPassword,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(typeof response.body.token).toBe("string");
        expect(response.body.user.email).toBe(regularUser.email);
        expect(response.body.user).not.toHaveProperty("password");

        const decoded = jwt.verify(
            response.body.token,
            config.jwt.secret
        );

        expect(decoded.id).toBe(regularUser.id);
        expect(decoded.role).toBe("USER");
    });

    test.each(["INACTIVE", "BLOCKED"])(
        "login rejects an account with status %s",
        async (status) => {
            const account = await makeStoredUser(
                `login-${status.toLowerCase()}`,
                "USER",
                status
            );

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: account.email,
                    password: testPassword,
                });

            expect(response.statusCode).toBe(403);
            expect(response.body).not.toHaveProperty("token");
        }
    );
});

describe("User API integration tests", () => {
    test("user list requires authentication", async () => {
        const response = await request(app).get("/api/users");

        expect(response.statusCode).toBe(401);
    });

    test.each([
        ["MANAGER", () => managerToken],
        ["USER", () => userToken],
    ])("%s cannot access the administrative user list", async (_role, getToken) => {
        const response = await api(
            getToken(),
            "get",
            "/api/users"
        );

        expect(response.statusCode).toBe(403);
    });
    test("profile requires authentication", async () => {
        const response = await request(app)
            .get("/api/users/profile");

        expect(response.statusCode).toBe(401);
    });

    test.each([
        ["MANAGER", () => managerToken],
        ["USER", () => userToken],
    ])(
        "%s cannot read, update, or delete another user's account",
        async (_role, tokenFactory) => {
            // ساخت یک حساب مستقل برای آزمون؛ حذف آن در cleanupFixtures انجام می‌شود.
            const target = await makeStoredUser("restricted-target");

            const before = await prisma.user.findUnique({
                where: { id: target.id },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    password: true,
                    role: true,
                    status: true,
                    personId: true,
                },
            });

            const token = tokenFactory();

            const endpoints = [
                {
                    method: "get",
                    path: `/api/users/${target.id}`,
                },
                {
                    method: "patch",
                    path: `/api/users/${target.id}`,
                    body: {
                        fullName: "Unauthorized Change",
                    },
                },
                {
                    method: "delete",
                    path: `/api/users/${target.id}`,
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

            // حساب باید موجود بماند و اطلاعاتش تغییر نکرده باشد.
            const after = await prisma.user.findUnique({
                where: { id: target.id },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    password: true,
                    role: true,
                    status: true,
                    personId: true,
                },
            });

            expect(after).toEqual(before);
        }
    );

    test("ADMIN creates a user without exposing the password", async () => {
        const email = nextEmail("admin-create");

        const response = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Admin Created`,
            email,
            password: testPassword,
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user.role).toBe("USER");
        expect(response.body.user.status).toBe("ACTIVE");
        expect(response.body.user).not.toHaveProperty("password");

        const saved = await prisma.user.findUnique({
            where: { email },
        });

        expect(await bcrypt.compare(testPassword, saved.password)).toBe(true);
    });

    test("USER and MANAGER cannot create users", async () => {
        for (const token of [userToken, managerToken]) {
            const response = await api(
                token,
                "post",
                "/api/users"
            ).send({
                fullName: `${tag} Forbidden`,
                email: nextEmail("forbidden-create"),
                password: testPassword,
            });

            expect(response.statusCode).toBe(403);
        }
    });

    test("ADMIN create rejects missing required fields", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Missing Password`,
            email: nextEmail("missing-password"),
        });

        expect(response.statusCode).toBe(400);
    });

    test("ADMIN create rejects duplicate email", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Duplicate`,
            email: regularUser.email,
            password: testPassword,
        });

        expect(response.statusCode).toBe(409);
    });

    test("ADMIN cannot attach a nonexistent Person", async () => {
        const response = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Missing Person`,
            email: nextEmail("missing-person"),
            password: testPassword,
            personId: "00000000-0000-4000-8000-000000000021",
        });

        expect(response.statusCode).toBe(404);
    });

    test("ADMIN can attach a Person to a User", async () => {
        const person = await makePerson();
        const email = nextEmail("linked-person");

        const response = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Linked Account`,
            email,
            password: testPassword,
            personId: person.id,
        });

        expect(response.statusCode).toBe(201);
        expect(response.body.user.personId).toBe(person.id);

        const saved = await prisma.user.findUnique({
            where: { email },
        });

        expect(saved.personId).toBe(person.id);
    });

    test("a Person cannot be linked to two Users", async () => {
        const person = await makePerson();

        const first = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} First Link`,
            email: nextEmail("person-link-a"),
            password: testPassword,
            personId: person.id,
        });

        const second = await api(
            adminToken,
            "post",
            "/api/users"
        ).send({
            fullName: `${tag} Second Link`,
            email: nextEmail("person-link-b"),
            password: testPassword,
            personId: person.id,
        });

        expect(first.statusCode).toBe(201);
        expect(second.statusCode).toBe(409);

        expect(
            await prisma.user.count({
                where: { personId: person.id },
            })
        ).toBe(1);
    });

    test("profile returns the authenticated user's data but no password", async () => {
        const response = await api(
            userToken,
            "get",
            "/api/users/profile"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.user.id).toBe(regularUser.id);
        expect(response.body.user.email).toBe(regularUser.email);
        expect(response.body.user).not.toHaveProperty("password");
    });

    test("ADMIN gets a user by ID without exposing a password", async () => {
        const response = await api(
            adminToken,
            "get",
            `/api/users/${regularUser.id}`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.user.id).toBe(regularUser.id);
        expect(response.body.user).not.toHaveProperty("password");
    });

    test("ADMIN user list omits passwords and supports pagination", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/users?page=1&limit=2"
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(2);
        expect(response.body.data).toHaveLength(2);

        for (const user of response.body.data) {
            expect(user).not.toHaveProperty("password");
        }
    });

    test("ADMIN update changes allowed fields without returning password", async () => {
        const email = nextEmail("updated");
        const response = await api(
            adminToken,
            "patch",
            `/api/users/${regularUser.id}`
        ).send({
            fullName: `${tag} Updated Name`,
            email,
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.user.fullName).toBe(`${tag} Updated Name`);
        expect(response.body.user.email).toBe(email);
        expect(response.body.user).not.toHaveProperty("password");

        const saved = await prisma.user.findUnique({
            where: { id: regularUser.id },
        });

        expect(saved.email).toBe(email);
    });

    test("ADMIN cannot update a user's email to one already used", async () => {
        const original = await prisma.user.findUnique({
            where: { id: regularUser.id },
            select: { email: true },
        });

        const response = await api(
            adminToken,
            "patch",
            `/api/users/${regularUser.id}`
        ).send({
            email: manager.email,
        });

        expect(response.statusCode).toBe(409);

        const saved = await prisma.user.findUnique({
            where: { id: regularUser.id },
        });

        expect(saved.email).toBe(original.email);
    });

    test("updating a password stores a hash and accepts the new password", async () => {
        const currentAccount = await prisma.user.findUnique({
            where: { id: regularUser.id },
            select: { email: true },
        });

        const newPassword = "New-Test-Password-456!";

        const response = await api(
            adminToken,
            "patch",
            `/api/users/${regularUser.id}`
        ).send({
            password: newPassword,
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.user).not.toHaveProperty("password");

        const saved = await prisma.user.findUnique({
            where: { id: regularUser.id },
        });

        expect(saved.password).not.toBe(newPassword);
        expect(await bcrypt.compare(newPassword, saved.password)).toBe(true);

        const login = await request(app)
            .post("/api/auth/login")
            .send({
                email: currentAccount.email,
                password: newPassword,
            });

        expect(login.statusCode).toBe(200);
    });

    test("ADMIN cannot attach a nonexistent Person during update", async () => {
        const response = await api(
            adminToken,
            "patch",
            `/api/users/${regularUser.id}`
        ).send({
            personId: "00000000-0000-4000-8000-000000000022",
        });

        expect(response.statusCode).toBe(404);
    });

    test("deleting a User keeps its linked Person and clears the link", async () => {
        const person = await makePerson();
        const account = await makeStoredUser(
            "delete-linked",
            "USER",
            "ACTIVE",
            person.id
        );

        const response = await api(
            adminToken,
            "delete",
            `/api/users/${account.id}`
        );

        expect(response.statusCode).toBe(200);

        expect(
            await prisma.user.findUnique({
                where: { id: account.id },
            })
        ).toBeNull();

        const savedPerson = await prisma.person.findUnique({
            where: { id: person.id },
        });

        expect(savedPerson).not.toBeNull();
        expect(
            await prisma.user.findUnique({
                where: { personId: person.id },
            })
        ).toBeNull();
    });

    test("returns 404 when ADMIN requests a nonexistent user", async () => {
        const response = await api(
            adminToken,
            "get",
            "/api/users/00000000-0000-4000-8000-000000000023"
        );

        expect(response.statusCode).toBe(404);
    });
});
