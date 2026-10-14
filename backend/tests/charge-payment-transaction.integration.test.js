const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");
const journalEntryService = require("../src/services/journalEntry.service");

const tag = `charge-payment-it-${process.pid}-${Date.now()}`;

const fixture = {
    adminId: null,
    residentUserId: null,
    complexId: null,
    propertyId: null,
    unitId: null,
    unitAccountId: null,
    residentId: null,
    fiscalPeriodId: null,
    financialAccountId: null,
    accountIds: [],
};
let residentUserToken;
let adminToken;
let receivableAccount;
let revenueAccount;
let cashAccount;
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

function paymentPayload(chargeId, amount, description) {
    return {
        unitAccountId: fixture.unitAccountId,
        chargeId,
        residentId: fixture.residentId,
        financialAccountId: fixture.financialAccountId,
        amount,
        paymentDate: issueDate.toISOString(),
        description,
    };
}

async function createCharge(suffix, amount = 1000) {
    return prisma.charge.create({
        data: {
            unitAccountId: fixture.unitAccountId,
            fiscalPeriodId: fixture.fiscalPeriodId,
            type: "MONTHLY",
            periodYear: 1405,
            periodMonth: 7,
            amount,
            description: `${tag}-charge-${suffix}`,
            issueDate: issueDate,
            status: "ISSUED",
        },
    });
}

async function cleanupFixtures() {
    // Payment references its journal entry, so delete payments first.
    if (fixture.unitAccountId) {
        await prisma.chargePayment.deleteMany({
            where: {
                unitAccountId: fixture.unitAccountId,
                description: { startsWith: tag },
            },
        });
    }

    // Remove only journal entries created by this test.
    await prisma.journalEntry.deleteMany({
        where: {
            description: { startsWith: tag },
        },
    });

    if (fixture.unitAccountId) {
        await prisma.charge.deleteMany({
            where: {
                unitAccountId: fixture.unitAccountId,
                description: { startsWith: tag },
            },
        });
    }

    if (fixture.residentId) {
        await prisma.resident.deleteMany({
            where: { id: fixture.residentId },
        });
    }

    if (fixture.unitAccountId) {
        await prisma.unitAccount.deleteMany({
            where: { id: fixture.unitAccountId },
        });
    }

    if (fixture.financialAccountId) {
        await prisma.financialAccount.deleteMany({
            where: { id: fixture.financialAccountId },
        });
    }

    if (fixture.fiscalPeriodId) {
        await prisma.accountingConfiguration.deleteMany({
            where: { fiscalPeriodId: fixture.fiscalPeriodId },
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

    if (fixture.residentUserId) {
        await prisma.user.deleteMany({
            where: { id: fixture.residentUserId },
        });
    }

    if (fixture.adminId) {
        await prisma.user.deleteMany({
            where: { id: fixture.adminId },
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

    issueDate = new Date();

    const admin = await prisma.user.create({
        data: {
            fullName: `${tag}-admin`,
            email: `${tag}-admin@example.test`,
            password: "integration-test-only",
            role: "ADMIN",
            status: "ACTIVE",
        },
    });

    fixture.adminId = admin.id;
    adminToken = tokenFor(admin);

    const residentUser = await prisma.user.create({
        data: {
            fullName: `${tag}-resident`,
            email: `${tag}-resident@example.test`,
            password: "integration-test-only",
            role: "USER",
            status: "ACTIVE",
        },
    });

    fixture.residentUserId = residentUser.id;
	residentUserToken = tokenFor(residentUser);
    const complex = await prisma.complex.create({
        data: {
            name: `${tag}-complex`,
            description: "Charge payment transaction integration fixture",
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
            title: "Charge payment test account",
            isActive: true,
        },
    });

    fixture.unitAccountId = unitAccount.id;

    const resident = await prisma.resident.create({
        data: {
            fullName: `${tag}-resident`,
            mobile: "09000000000",
            userId: residentUser.id,
            unitId: unit.id,
        },
    });

    fixture.residentId = resident.id;

    const fiscalPeriod = await prisma.fiscalPeriod.create({
        data: {
            code: `${tag}-period`,
            name: `${tag} Fiscal Period`,
            status: "ACTIVE",
            startDate: new Date(
                issueDate.getTime() - 2 * 24 * 60 * 60 * 1000
            ),
            endDate: new Date(
                issueDate.getTime() + 365 * 24 * 60 * 60 * 1000
            ),
        },
    });

    fixture.fiscalPeriodId = fiscalPeriod.id;

    receivableAccount = await prisma.account.create({
        data: {
            code: `${tag}-receivable`,
            name: `${tag} Charge Receivable`,
            type: "ASSET",
            isActive: true,
            fiscalPeriodId: fiscalPeriod.id,
        },
    });

    fixture.accountIds.push(receivableAccount.id);

    revenueAccount = await prisma.account.create({
        data: {
            code: `${tag}-revenue`,
            name: `${tag} Charge Revenue`,
            type: "REVENUE",
            isActive: true,
            fiscalPeriodId: fiscalPeriod.id,
        },
    });

    fixture.accountIds.push(revenueAccount.id);

    cashAccount = await prisma.account.create({
        data: {
            code: `${tag}-cash-account`,
            name: `${tag} Cash Posting Account`,
            type: "ASSET",
            isActive: true,
            fiscalPeriodId: fiscalPeriod.id,
        },
    });

    fixture.accountIds.push(cashAccount.id);

    const financialAccount = await prisma.financialAccount.create({
        data: {
            code: `${tag}-cash`,
            name: `${tag} Test Cash Account`,
            type: "CASH",
            status: "ACTIVE",
            fiscalPeriodId: fiscalPeriod.id,
            accountId: cashAccount.id,
        },
    });

    fixture.financialAccountId = financialAccount.id;

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

describe("Charge payment transaction integration tests", () => {
    test("anonymous users and USER role cannot access UnitAccount management routes", async () => {
        const attemptedCode = `${tag}-forbidden-account`;
        const forbiddenId = "00000000-0000-4000-8000-000000000099";

        const before = await prisma.unitAccount.findUnique({
            where: { id: fixture.unitAccountId },
            select: {
                id: true,
                unitId: true,
                code: true,
                title: true,
                isActive: true,
            },
        });

        const endpoints = [
            {
                method: "get",
                path: "/api/unit-accounts",
            },
            {
                method: "post",
                path: "/api/unit-accounts",
                body: {
                    unitId: fixture.unitId,
                    code: attemptedCode,
                    title: "Unauthorized account",
                },
            },
            {
                method: "get",
                path: `/api/unit-accounts/unit/${fixture.unitId}`,
            },
            {
                method: "get",
                path: `/api/unit-accounts/${fixture.unitAccountId}`,
            },
            {
                method: "put",
                path: `/api/unit-accounts/${fixture.unitAccountId}`,
                body: {
                    title: "Unauthorized update",
                },
            },
            {
                method: "delete",
                path: `/api/unit-accounts/${forbiddenId}`,
            },
        ];

        for (const auth of [
            { token: null, expectedStatus: 401 },
            { token: residentUserToken, expectedStatus: 403 },
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

        const after = await prisma.unitAccount.findUnique({
            where: { id: fixture.unitAccountId },
            select: {
                id: true,
                unitId: true,
                code: true,
                title: true,
                isActive: true,
            },
        });

        expect(after).toEqual(before);

        const unexpectedAccount = await prisma.unitAccount.findFirst({
            where: { code: attemptedCode },
        });

        expect(unexpectedAccount).toBeNull();
    });
    test("anonymous users and USER role cannot access charge-payment routes", async () => {
        const charge = await createCharge("forbidden-access", 1000);
        const description = `${tag}-forbidden-payment`;
        const forbiddenId = "00000000-0000-4000-8000-000000000098";

        const endpoints = [
            {
                method: "get",
                path: "/api/charge-payments",
            },
            {
                method: "post",
                path: "/api/charge-payments",
                body: paymentPayload(charge.id, 100, description),
            },
            {
                method: "get",
                path: `/api/charge-payments/${forbiddenId}`,
            },
            {
                method: "get",
                path: `/api/charge-payments/charge/${charge.id}`,
            },
            {
                method: "get",
                path: `/api/charge-payments/unit-account/${fixture.unitAccountId}`,
            },
        ];

        for (const auth of [
            { token: null, expectedStatus: 401 },
            { token: residentUserToken, expectedStatus: 403 },
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

        const paymentCount = await prisma.chargePayment.count({
            where: {
                chargeId: charge.id,
                description,
            },
        });

        expect(paymentCount).toBe(0);

        const journalEntryCount = await prisma.journalEntry.count({
            where: { description },
        });

        expect(journalEntryCount).toBe(0);

        const persistedCharge = await prisma.charge.findUnique({
            where: { id: charge.id },
        });

        expect(persistedCharge.status).toBe("ISSUED");
    });

    test("records partial and final payments with balanced posted journal entries", async () => {
        const charge = await createCharge("partial-final", 1000);

        const partialDescription = `${tag}-partial-payment`;
        const partialResponse = await api(
            adminToken,
            "post",
            "/api/charge-payments"
        ).send(
            paymentPayload(charge.id, 400, partialDescription)
        );

        expect(partialResponse.statusCode).toBe(201);

        const partialPayment = await prisma.chargePayment.findFirst({
            where: {
                chargeId: charge.id,
                description: partialDescription,
            },
        });

        expect(partialPayment).not.toBeNull();
        expect(Number(partialPayment.amount)).toBe(400);
        expect(partialPayment.financialAccountId)
            .toBe(fixture.financialAccountId);

        let persistedCharge = await prisma.charge.findUnique({
            where: { id: charge.id },
        });

        expect(persistedCharge.status).toBe("PARTIALLY_PAID");

        const partialEntry = await prisma.journalEntry.findUnique({
            where: { id: partialPayment.journalEntryId },
            include: { lines: true },
        });

        expect(partialEntry.status).toBe("POSTED");
        expect(partialEntry.lines).toHaveLength(2);

        const partialDebit = partialEntry.lines.find(
            line => line.accountId === cashAccount.id
        );
        const partialCredit = partialEntry.lines.find(
            line => line.accountId === receivableAccount.id
        );

        expect(partialDebit).toBeDefined();
        expect(partialCredit).toBeDefined();
        expect(Number(partialDebit.debit)).toBe(400);
        expect(Number(partialDebit.credit)).toBe(0);
        expect(Number(partialCredit.debit)).toBe(0);
        expect(Number(partialCredit.credit)).toBe(400);

        expect(
            partialEntry.lines.reduce(
                (sum, line) => sum + Number(line.debit),
                0
            )
        ).toBe(
            partialEntry.lines.reduce(
                (sum, line) => sum + Number(line.credit),
                0
            )
        );

        const finalDescription = `${tag}-final-payment`;
        const finalResponse = await api(
            adminToken,
            "post",
            "/api/charge-payments"
        ).send(
            paymentPayload(charge.id, 600, finalDescription)
        );

        expect(finalResponse.statusCode).toBe(201);

        persistedCharge = await prisma.charge.findUnique({
            where: { id: charge.id },
        });

        expect(persistedCharge.status).toBe("PAID");

        const finalPayment = await prisma.chargePayment.findFirst({
            where: {
                chargeId: charge.id,
                description: finalDescription,
            },
        });

        expect(finalPayment).not.toBeNull();
        expect(Number(finalPayment.amount)).toBe(600);

        const finalEntry = await prisma.journalEntry.findUnique({
            where: { id: finalPayment.journalEntryId },
            include: { lines: true },
        });

        expect(finalEntry.status).toBe("POSTED");
        expect(finalEntry.lines).toHaveLength(2);

        const finalDebit = finalEntry.lines.find(
            line => line.accountId === cashAccount.id
        );
        const finalCredit = finalEntry.lines.find(
            line => line.accountId === receivableAccount.id
        );

        expect(Number(finalDebit.debit)).toBe(600);
        expect(Number(finalCredit.credit)).toBe(600);
        expect(
            finalEntry.lines.reduce(
                (sum, line) => sum + Number(line.debit),
                0
            )
        ).toBe(
            finalEntry.lines.reduce(
                (sum, line) => sum + Number(line.credit),
                0
            )
        );
    });

    test("rejects overpayment without creating payment or journal entry", async () => {
        const charge = await createCharge("overpayment", 1000);
        const description = `${tag}-overpayment-attempt`;

        const response = await api(
            adminToken,
            "post",
            "/api/charge-payments"
        ).send(
            paymentPayload(charge.id, 1001, description)
        );

        expect(response.statusCode).toBe(400);

        const paymentCount = await prisma.chargePayment.count({
            where: {
                chargeId: charge.id,
                description,
            },
        });

        expect(paymentCount).toBe(0);

        const entryCount = await prisma.journalEntry.count({
            where: { description },
        });

        expect(entryCount).toBe(0);

        const persistedCharge = await prisma.charge.findUnique({
            where: { id: charge.id },
        });

        expect(persistedCharge.status).toBe("ISSUED");
    });

    test("rolls back the draft journal entry and payment when posting fails", async () => {
        const charge = await createCharge("rollback", 1000);
        const description = `${tag}-rollback-payment`;

        const spy = jest
            .spyOn(journalEntryService, "postWithClient")
            .mockRejectedValueOnce(
                new Error("Forced journal posting failure for rollback test")
            );

        let response;

        try {
            response = await api(
                adminToken,
                "post",
                "/api/charge-payments"
            ).send(
                paymentPayload(charge.id, 250, description)
            );
        } finally {
            spy.mockRestore();
        }

        expect(response.statusCode).toBe(500);

        const paymentCount = await prisma.chargePayment.count({
            where: {
                chargeId: charge.id,
                description,
            },
        });

        expect(paymentCount).toBe(0);

        const entryCount = await prisma.journalEntry.count({
            where: { description },
        });

        expect(entryCount).toBe(0);

        const persistedCharge = await prisma.charge.findUnique({
            where: { id: charge.id },
        });

        expect(persistedCharge.status).toBe("ISSUED");
    });
});
