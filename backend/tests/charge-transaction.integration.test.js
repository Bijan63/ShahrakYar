const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");
const chargeService = require("../src/services/charge.service");

const tag = `charge-tx-it-${process.pid}-${Date.now()}`;

const fixture = {
    userId: null,
    regularUserId: null,
    complexId: null,
    propertyId: null,
    unitId: null,
    unitAccountId: null,
    fiscalPeriodId: null,
    accountIds: [],
};

let adminToken;
let regularUserToken;
let receivableAccount;
let revenueAccount;
let issueDate;

function api(token, method, path) {
    const req = request(app)[method](path);
    return token
        ? req.set("Authorization", `Bearer ${token}`)
        : req;
}

function tokenFor(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: "1h" }
    );
}

function chargePayload(description) {
    return {
        unitAccountId: fixture.unitAccountId,
        fiscalPeriodId: fixture.fiscalPeriodId,
        type: "MONTHLY",
        periodYear: 1405,
        periodMonth: 7,
        amount: 125000,
        description,
        issueDate: issueDate.toISOString(),
    };
}

async function cleanupFixtures() {
    // Remove only journal entries created by this test.
    const entries = await prisma.journalEntry.findMany({
        where: {
            description: { startsWith: tag },
        },
        select: { id: true },
    });

    if (entries.length) {
        await prisma.journalEntry.deleteMany({
            where: {
                id: { in: entries.map(entry => entry.id) },
            },
        });
    }

    // Charges are scoped to the exact test-created unit account
    // and the unique test-description prefix.
    if (fixture.unitAccountId) {
        await prisma.charge.deleteMany({
            where: {
                unitAccountId: fixture.unitAccountId,
                description: { startsWith: tag },
            },
        });

        await prisma.unitAccount.deleteMany({
            where: { id: fixture.unitAccountId },
        });
    }

    if (fixture.fiscalPeriodId) {
        await prisma.accountingConfiguration.deleteMany({
            where: {
                fiscalPeriodId: fixture.fiscalPeriodId,
            },
        });
    }

    if (fixture.accountIds.length) {
        await prisma.account.deleteMany({
            where: {
                id: { in: fixture.accountIds },
            },
        });
    }

    if (fixture.fiscalPeriodId) {
        await prisma.fiscalPeriod.deleteMany({
            where: { id: fixture.fiscalPeriodId },
        });
    }

    if (fixture.unitId) {
        await prisma.unit.deleteMany({
            where: { id: fixture.unitId },
        });
    }

    if (fixture.propertyId) {
        await prisma.property.deleteMany({
            where: { id: fixture.propertyId },
        });
    }

    if (fixture.complexId) {
        await prisma.complex.deleteMany({
            where: { id: fixture.complexId },
        });
    }

    if (fixture.regularUserId) {
        await prisma.user.deleteMany({
            where: { id: fixture.regularUserId },
        });
    }

    if (fixture.userId) {
        await prisma.user.deleteMany({
            where: { id: fixture.userId },
        });
    }
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT secret is not configured."
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

    const user = await prisma.user.create({
        data: {
            fullName: `${tag}-admin`,
            email: `${tag}@example.test`,
            password: "integration-test-only",
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    fixture.userId = user.id;
    adminToken = tokenFor(user);

    const regularUser = await prisma.user.create({
        data: {
            fullName: `${tag}-user`,
            email: `${tag}-user@example.test`,
            password: "integration-test-only",
            role: "USER",
            status: "ACTIVE",
        },
    });

    fixture.regularUserId = regularUser.id;
    regularUserToken = tokenFor(regularUser);

    const complex = await prisma.complex.create({
        data: {
            name: `${tag}-complex`,
            description: "Charge transaction integration fixture",
        },
    });
    fixture.complexId = complex.id;

    const property = await prisma.property.create({
        data: {
            complexId: complex.id,
            code: `${tag}-property`,
            propertyType: "VILLA",
            status: "BUILT",
        },
    });
    fixture.propertyId = property.id;

    const unit = await prisma.unit.create({
        data: {
            unitNumber: `${tag}-unit`,
            propertyId: property.id,
        },
    });
    fixture.unitId = unit.id;

    const unitAccount = await prisma.unitAccount.create({
        data: {
            unitId: unit.id,
            code: `${tag}-unit-account`,
            title: "Charge transaction test account",
            isActive: true,
        },
    });
    fixture.unitAccountId = unitAccount.id;

    issueDate = new Date();

    const fiscalPeriod = await prisma.fiscalPeriod.create({
        data: {
            code: `${tag}-period`,
            name: `${tag} Fiscal Period`,
            status: "ACTIVE",
            startDate: new Date(
                issueDate.getTime() - 24 * 60 * 60 * 1000
            ),
            endDate: new Date(
                issueDate.getTime() + 365 * 24 * 60 * 60 * 1000
            ),
        },
    });
    fixture.fiscalPeriodId = fiscalPeriod.id;

    receivableAccount = await prisma.account.create({
        data: {
            code: `${tag}-1201`,
            name: `${tag} Charge Receivable`,
            type: "ASSET",
            isActive: true,
            fiscalPeriodId: fiscalPeriod.id,
        },
    });
    fixture.accountIds.push(receivableAccount.id);

    revenueAccount = await prisma.account.create({
        data: {
            code: `${tag}-4001`,
            name: `${tag} Charge Revenue`,
            type: "REVENUE",
            isActive: true,
            fiscalPeriodId: fiscalPeriod.id,
        },
    });
    fixture.accountIds.push(revenueAccount.id);

    await prisma.accountingConfiguration.create({
        data: {
            fiscalPeriodId: fiscalPeriod.id,
            chargeReceivableAccountId: receivableAccount.id,
            chargeRevenueAccountId: revenueAccount.id,
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

describe("Charge creation transaction integration tests", () => {
    test("rejects anonymous users and USER role on all charge routes without side effects", async () => {
        const targetDescription = `${tag}-access-target`;
        const forbiddenDescription = `${tag}-forbidden-create`;

        // Create a real charge and accounting entry using ADMIN access.
        const seedResponse = await api(
            adminToken,
            "post",
            "/api/charges"
        ).send(chargePayload(targetDescription));

        expect(seedResponse.statusCode).toBe(201);

        const targetId = seedResponse.body.charge.id;

        const readTargetState = async () => {
            const charge = await prisma.charge.findUnique({
                where: { id: targetId },
            });

            if (!charge) {
                return null;
            }

            return {
                id: charge.id,
                unitAccountId: charge.unitAccountId,
                fiscalPeriodId: charge.fiscalPeriodId,
                type: charge.type,
                periodYear: charge.periodYear,
                periodMonth: charge.periodMonth,
                amount: Number(charge.amount),
                description: charge.description,
                issueDate: charge.issueDate.toISOString(),
                dueDate: charge.dueDate
                    ? charge.dueDate.toISOString()
                    : null,
                status: charge.status,
            };
        };

        const readFixtureChargeIds = async () => {
            const rows = await prisma.charge.findMany({
                where: { unitAccountId: fixture.unitAccountId },
                select: { id: true },
                orderBy: { id: "asc" },
            });

            return rows.map(row => row.id);
        };

        const readFixtureJournalEntryIds = async () => {
            const rows = await prisma.journalEntry.findMany({
                where: { fiscalPeriodId: fixture.fiscalPeriodId },
                select: { id: true },
                orderBy: { id: "asc" },
            });

            return rows.map(row => row.id);
        };

        const originalState = await readTargetState();
        const originalChargeIds = await readFixtureChargeIds();
        const originalJournalEntryIds =
            await readFixtureJournalEntryIds();

        expect(originalState).not.toBeNull();

        const endpoints = [
            {
                method: "get",
                path: "/api/charges",
            },
            {
                method: "post",
                path: "/api/charges",
                body: chargePayload(forbiddenDescription),
            },
            {
                method: "get",
                path: `/api/charges/unit-account/${fixture.unitAccountId}`,
            },
            {
                method: "get",
                path: `/api/charges/${targetId}`,
            },
            {
                method: "put",
                path: `/api/charges/${targetId}`,
                body: {
                    amount: 999999,
                    description: `${tag}-forbidden-update`,
                },
            },
            {
                method: "patch",
                path: `/api/charges/${targetId}/cancel`,
            },
            {
                method: "delete",
                path: `/api/charges/${targetId}`,
            },
        ];

        for (const auth of [
            { token: null, expectedStatus: 401 },
            { token: regularUserToken, expectedStatus: 403 },
        ]) {
            for (const endpoint of endpoints) {
                let req = api(
                    auth.token,
                    endpoint.method,
                    endpoint.path
                );

                if (endpoint.body) {
                    req = req.send(endpoint.body);
                }

                const response = await req;

                expect(response.statusCode).toBe(auth.expectedStatus);
            }
        }

        // Unauthorized attempts must not change or remove the target charge.
        expect(await readTargetState()).toEqual(originalState);

        // They must not create another charge or journal entry.
        expect(await readFixtureChargeIds()).toEqual(originalChargeIds);
        expect(await readFixtureJournalEntryIds()).toEqual(
            originalJournalEntryIds
        );

        const forbiddenCharge = await prisma.charge.findFirst({
            where: {
                unitAccountId: fixture.unitAccountId,
                description: forbiddenDescription,
            },
        });

        expect(forbiddenCharge).toBeNull();
    });

    test("creates an ISSUED charge and a balanced POSTED journal entry", async () => {
        const description = `${tag}-success`;

        const response = await api(
            adminToken,
            "post",
            "/api/charges"
        ).send(chargePayload(description));

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        const charge = response.body.charge;
        const journalEntry = response.body.journalEntry;

        expect(charge).toBeDefined();
        expect(journalEntry).toBeDefined();
        expect(charge.unitAccountId).toBe(fixture.unitAccountId);
        expect(charge.fiscalPeriodId).toBe(fixture.fiscalPeriodId);
        expect(charge.status).toBe("ISSUED");
        expect(Number(charge.amount)).toBe(125000);

        expect(journalEntry.status).toBe("POSTED");
        expect(journalEntry.fiscalPeriodId).toBe(fixture.fiscalPeriodId);
        expect(journalEntry.entryNumber).toBe(`JV-CHARGE-${charge.id}`);

        expect(journalEntry.lines).toHaveLength(2);

        const debitLine = journalEntry.lines.find(
            line => line.accountId === receivableAccount.id
        );

        const creditLine = journalEntry.lines.find(
            line => line.accountId === revenueAccount.id
        );

        expect(debitLine).toBeDefined();
        expect(creditLine).toBeDefined();

        expect(Number(debitLine.debit)).toBe(125000);
        expect(Number(debitLine.credit)).toBe(0);
        expect(Number(creditLine.debit)).toBe(0);
        expect(Number(creditLine.credit)).toBe(125000);

        const totalDebit = journalEntry.lines.reduce(
            (sum, line) => sum + Number(line.debit),
            0
        );

        const totalCredit = journalEntry.lines.reduce(
            (sum, line) => sum + Number(line.credit),
            0
        );

        expect(totalDebit).toBe(totalCredit);
    });

    test("rolls back the charge when journal-entry creation fails", async () => {
        const description = `${tag}-rollback`;

        // Force a failure after the charge row has been created
        // inside the transaction, but before journal-entry creation.
        const spy = jest
            .spyOn(chargeService, "createChargeJournalEntry")
            .mockRejectedValueOnce(
                new Error("Forced journal-entry failure for rollback test")
            );

        let response;

        try {
            response = await api(
                adminToken,
                "post",
                "/api/charges"
            ).send(chargePayload(description));
        } finally {
            spy.mockRestore();
        }

        expect(response.statusCode).toBe(500);

        const persistedCharges = await prisma.charge.findMany({
            where: {
                unitAccountId: fixture.unitAccountId,
                description,
            },
        });

        const persistedEntries = await prisma.journalEntry.findMany({
            where: { description },
        });

        expect(persistedCharges).toHaveLength(0);
        expect(persistedEntries).toHaveLength(0);
    });
});
