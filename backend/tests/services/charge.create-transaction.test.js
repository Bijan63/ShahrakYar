jest.mock("../../src/config/prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../src/repositories/charge.repository", () => ({
    createWithClient: jest.fn(),
}));

jest.mock("../../src/repositories/unitAccount.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireComplexAccess: jest.fn(),
}));

const { Prisma } = require("@prisma/client");

const prisma = require("../../src/config/prisma");
const chargeRepository =
    require("../../src/repositories/charge.repository");
const unitAccountRepository =
    require("../../src/repositories/unitAccount.repository");

const chargeService = require("../../src/services/charge.service");
const AppError = require("../../src/utils/AppError");

const CHARGE_ID =
    "11111111-1111-4111-8111-111111111111";

const UNIT_ACCOUNT_ID =
    "22222222-2222-4222-8222-222222222222";

const FISCAL_PERIOD_ID =
    "33333333-3333-4333-8333-333333333333";

const RECEIVABLE_ACCOUNT_ID =
    "44444444-4444-4444-8444-444444444444";

const REVENUE_ACCOUNT_ID =
    "55555555-5555-4555-8555-555555555555";

const admin = {
    id: "admin-test",
    role: "ADMIN",
};

let tx;
let fiscalPeriod;
let receivableAccount;
let revenueAccount;
let charge;
let journalEntry;
let unitAccount;

function makeData(overrides = {}) {
    return {
        unitAccountId: UNIT_ACCOUNT_ID,
        fiscalPeriodId: FISCAL_PERIOD_ID,
        type: "MONTHLY",
        periodYear: 1405,
        periodMonth: 3,
        amount: 1000,
        description: "Monthly service charge",
        issueDate: "2026-03-05T12:00:00.000Z",
        dueDate: "2026-03-20T12:00:00.000Z",
        ...overrides,
    };
}

beforeEach(() => {
    jest.clearAllMocks();

    fiscalPeriod = {
        id: FISCAL_PERIOD_ID,
        status: "ACTIVE",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-12-31T23:59:59.999Z"),
    };

    receivableAccount = {
        id: RECEIVABLE_ACCOUNT_ID,
        name: "Charge Receivable",
        type: "ASSET",
    };

    revenueAccount = {
        id: REVENUE_ACCOUNT_ID,
        name: "Charge Revenue",
        type: "REVENUE",
    };

    unitAccount = {
        id: UNIT_ACCOUNT_ID,
        isActive: true,
        unit: {
            building: {
                complexId: "complex-test",
            },
            property: null,
        },
    };

    charge = {
        id: CHARGE_ID,
        unitAccountId: UNIT_ACCOUNT_ID,
        fiscalPeriodId: FISCAL_PERIOD_ID,
        type: "MONTHLY",
        periodYear: 1405,
        periodMonth: 3,
        amount: 1000,
        description: "Monthly service charge",
        issueDate: new Date("2026-03-05T12:00:00.000Z"),
        dueDate: new Date("2026-03-20T12:00:00.000Z"),
        status: "ISSUED",
    };

    journalEntry = {
        id: "journal-entry-test",
        entryNumber: `JV-CHARGE-${CHARGE_ID}`,
        status: "POSTED",
    };

    tx = {
        journalEntry: {
            create: jest.fn().mockResolvedValue(journalEntry),
        },
    };

    unitAccountRepository.findById.mockResolvedValue(unitAccount);

    chargeRepository.createWithClient.mockResolvedValue(charge);

    prisma.$transaction.mockImplementation(
        async (callback) => callback(tx)
    );

    jest.spyOn(
        chargeService,
        "validateFiscalPeriod"
    ).mockResolvedValue(fiscalPeriod);

    jest.spyOn(
        chargeService,
        "getAccountingConfiguration"
    ).mockResolvedValue({
        chargeReceivableAccountId: RECEIVABLE_ACCOUNT_ID,
        chargeRevenueAccountId: REVENUE_ACCOUNT_ID,
    });

    jest.spyOn(
        chargeService,
        "validatePostingAccount"
    ).mockImplementation(async (client, accountId, periodId, expectedType) => {
        if (expectedType === "ASSET") {
            return receivableAccount;
        }

        if (expectedType === "REVENUE") {
            return revenueAccount;
        }

        throw new Error(`Unexpected account type: ${expectedType}`);
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("ChargeService.createChargeJournalEntry", () => {
    test("creates a POSTED journal entry with balanced debit and credit lines", async () => {
        const issueDate =
            new Date("2026-03-05T12:00:00.000Z");

        const result =
            await chargeService.createChargeJournalEntry(
                tx,
                {
                    charge,
                    amount: 1250,
                    receivableAccount,
                    revenueAccount,
                    issueDate,
                    description: "Test charge",
                }
            );

        expect(result).toBe(journalEntry);

        expect(tx.journalEntry.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    entryNumber: `JV-CHARGE-${CHARGE_ID}`,
                    entryDate: issueDate,
                    description: "Test charge",
                    status: "POSTED",
                    fiscalPeriodId: FISCAL_PERIOD_ID,
                    fundId: null,
                    lines: {
                        create: [
                            {
                                accountId: RECEIVABLE_ACCOUNT_ID,
                                description: "Test charge",
                                debit: 1250,
                                credit: 0,
                            },
                            {
                                accountId: REVENUE_ACCOUNT_ID,
                                description: "Test charge",
                                debit: 0,
                                credit: 1250,
                            },
                        ],
                    },
                }),
                include: {
                    fiscalPeriod: true,
                    fund: true,
                    lines: {
                        orderBy: {
                            createdAt: "asc",
                        },
                        include: {
                            account: true,
                        },
                    },
                },
            })
        );
    });

    test("uses the default description when no description is provided", async () => {
        await chargeService.createChargeJournalEntry(
            tx,
            {
                charge,
                amount: 1000,
                receivableAccount,
                revenueAccount,
                issueDate: charge.issueDate,
                description: "",
            }
        );

        const query =
            tx.journalEntry.create.mock.calls[0][0];

        expect(query.data.description).toBe(
            `Charge issuance - ${CHARGE_ID}`
        );

        expect(
            query.data.lines.create[0].description
        ).toBe(`Charge issuance - ${CHARGE_ID}`);

        expect(
            query.data.lines.create[1].description
        ).toBe(`Charge issuance - ${CHARGE_ID}`);
    });
});

describe("ChargeService.createCharge transaction", () => {
    test("creates the charge and accounting entry successfully", async () => {
        const result =
            await chargeService.createCharge(
                makeData(),
                admin
            );

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        expect(prisma.$transaction.mock.calls[0][1]).toEqual({
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
        });

        expect(
            chargeRepository.createWithClient
        ).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                unitAccountId: UNIT_ACCOUNT_ID,
                fiscalPeriodId: FISCAL_PERIOD_ID,
                type: "MONTHLY",
                periodYear: 1405,
                periodMonth: 3,
                amount: 1000,
                description: "Monthly service charge",
                status: "ISSUED",
                issueDate: new Date("2026-03-05T12:00:00.000Z"),
                dueDate: new Date("2026-03-20T12:00:00.000Z"),
            })
        );

        expect(tx.journalEntry.create).toHaveBeenCalledTimes(1);

        expect(result).toEqual({
            charge,
            journalEntry,
        });
    });

    test("stores null as periodMonth when it is omitted", async () => {
        await chargeService.createCharge(
            makeData({
                periodMonth: undefined,
            }),
            admin
        );

        expect(
            chargeRepository.createWithClient.mock.calls[0][1]
                .periodMonth
        ).toBeNull();
    });

    test("rejects an issue date outside the fiscal period", async () => {
        await expect(
            chargeService.createCharge(
                makeData({
                    issueDate: "2027-01-05T12:00:00.000Z",
                    dueDate: "2027-01-20T12:00:00.000Z",
                }),
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message:
                "Issue date must be within the selected fiscal period.",
        });

        expect(
            chargeRepository.createWithClient
        ).not.toHaveBeenCalled();

        expect(tx.journalEntry.create).not.toHaveBeenCalled();
    });

    test("does not create a charge when fiscal-period validation fails", async () => {
        const error = new AppError(
            "Fiscal period is not active.",
            400
        );

        chargeService.validateFiscalPeriod.mockRejectedValue(error);

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toBe(error);

        expect(
            chargeRepository.createWithClient
        ).not.toHaveBeenCalled();
    });

    test("does not create a charge when accounting configuration fails", async () => {
        const error = new AppError(
            "Accounting configuration is missing.",
            400
        );

        chargeService.getAccountingConfiguration
            .mockRejectedValue(error);

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toBe(error);

        expect(
            chargeRepository.createWithClient
        ).not.toHaveBeenCalled();
    });

    test("does not create a charge when the revenue account validation fails", async () => {
        const error = new AppError(
            "Revenue account is invalid.",
            400
        );

        chargeService.validatePostingAccount
            .mockImplementation(async (
                client,
                accountId,
                periodId,
                expectedType
            ) => {
                if (expectedType === "ASSET") {
                    return receivableAccount;
                }

                throw error;
            });

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toBe(error);

        expect(
            chargeRepository.createWithClient
        ).not.toHaveBeenCalled();

        expect(tx.journalEntry.create).not.toHaveBeenCalled();
    });

    test("maps Prisma P2034 transaction conflicts to HTTP 409", async () => {
        prisma.$transaction.mockRejectedValue({
            code: "P2034",
        });

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toMatchObject({
            statusCode: 409,
            message:
                "Charge could not be created because another transaction was processed concurrently. Please retry.",
        });
    });

    test("maps Prisma P2003 errors to HTTP 400", async () => {
        prisma.$transaction.mockRejectedValue({
            code: "P2003",
        });

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid related record.",
        });
    });

    test("rethrows unexpected transaction errors unchanged", async () => {
        const error = new Error("Unexpected database failure");

        prisma.$transaction.mockRejectedValue(error);

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toBe(error);
    });
});

describe("ChargeService.createCharge edge-case validation", () => {
    test("rejects a missing unitAccountId", async () => {
        await expect(
            chargeService.createCharge(
                makeData({ unitAccountId: undefined }),
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Unit account ID is required.",
        });

        expect(unitAccountRepository.findById).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an inactive unit account", async () => {
        unitAccount.isActive = false;

        await expect(
            chargeService.createCharge(makeData(), admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Unit account is inactive.",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid issue date", async () => {
        await expect(
            chargeService.createCharge(
                makeData({ issueDate: "not-a-valid-date" }),
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid issue date.",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid due date", async () => {
        await expect(
            chargeService.createCharge(
                makeData({ dueDate: "not-a-valid-date" }),
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid due date.",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects a due date earlier than the issue date", async () => {
        await expect(
            chargeService.createCharge(
                makeData({
                    issueDate: "2026-03-15T12:00:00.000Z",
                    dueDate: "2026-03-14T12:00:00.000Z",
                }),
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Due date cannot be earlier than issue date.",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});

describe("ChargeService.createCharge input validation", () => {
    test("rejects missing charge data", async () => {
        await expect(
            chargeService.createCharge(null, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Charge data is required.",
        });

        expect(unitAccountRepository.findById).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
