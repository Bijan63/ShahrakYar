jest.mock("../../src/config/prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../src/repositories/chargePayment.repository", () => ({
    createWithClient: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByChargeId: jest.fn(),
    findByUnitAccountId: jest.fn(),
}));

jest.mock("../../src/repositories/charge.repository", () => ({
    findById: jest.fn(),
    updateWithClient: jest.fn(),
}));

jest.mock("../../src/repositories/unitAccount.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/repositories/resident.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireUnitAccountComplexAccess: jest.fn(),
}));

jest.mock("../../src/services/journalEntry.service", () => ({
    createWithClient: jest.fn(),
    postWithClient: jest.fn(),
}));

const prisma = require("../../src/config/prisma");

const paymentRepository =
    require("../../src/repositories/chargePayment.repository");

const chargeRepository =
    require("../../src/repositories/charge.repository");

const unitAccountRepository =
    require("../../src/repositories/unitAccount.repository");

const residentRepository =
    require("../../src/repositories/resident.repository");

const accessService =
    require("../../src/services/access.service");

const journalEntryService =
    require("../../src/services/journalEntry.service");

const service =
    require("../../src/services/chargePayment.service");

const UNIT_ACCOUNT_ID =
    "11111111-1111-4111-8111-111111111111";

const CHARGE_ID =
    "22222222-2222-4222-8222-222222222222";

const RESIDENT_ID =
    "33333333-3333-4333-8333-333333333333";

const FISCAL_PERIOD_ID =
    "44444444-4444-4444-8444-444444444444";

const FINANCIAL_ACCOUNT_ID =
    "55555555-5555-4555-8555-555555555555";

const POSTING_ACCOUNT_ID =
    "66666666-6666-4666-8666-666666666666";

const RECEIVABLE_ACCOUNT_ID =
    "77777777-7777-4777-8777-777777777777";

const REVENUE_ACCOUNT_ID =
    "88888888-8888-4888-8888-888888888888";

const OTHER_PERIOD_ID =
    "99999999-9999-4999-8999-999999999999";

const USER = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    role: "ADMIN",
};

let tx;
let unitAccount;
let charge;
let transactionCharge;
let resident;
let financialAccount;
let accountingConfiguration;
let payment;
let draftJournalEntry;
let postedJournalEntry;
let updatedCharge;

function makeData(overrides = {}) {
    return {
        unitAccountId: UNIT_ACCOUNT_ID,
        chargeId: CHARGE_ID,
        financialAccountId: FINANCIAL_ACCOUNT_ID,
        amount: 1000,
        paymentDate: "2026-03-15T12:00:00.000Z",
        description: "Test payment",
        ...overrides,
    };
}

function makePostingAccount(overrides = {}) {
    return {
        id: POSTING_ACCOUNT_ID,
        code: "1101",
        name: "Bank",
        type: "ASSET",
        isActive: true,
        fiscalPeriodId: FISCAL_PERIOD_ID,
        children: [],
        ...overrides,
    };
}

function makeFinancialAccount(overrides = {}) {
    return {
        id: FINANCIAL_ACCOUNT_ID,
        code: "BANK-01",
        name: "Test bank account",
        status: "ACTIVE",
        bankName: "Test Bank",
        accountNumber: null,
        cardNumber: null,
        iban: null,
        openingBalance: 0,
        fiscalPeriodId: FISCAL_PERIOD_ID,
        fundId: null,
        accountId: POSTING_ACCOUNT_ID,
        account: makePostingAccount(),
        ...overrides,
    };
}

function makeConfiguration(overrides = {}) {
    return {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        fiscalPeriodId: FISCAL_PERIOD_ID,
        chargeReceivableAccountId: RECEIVABLE_ACCOUNT_ID,
        chargeRevenueAccountId: REVENUE_ACCOUNT_ID,
        chargeReceivableAccount: {
            id: RECEIVABLE_ACCOUNT_ID,
            code: "1201",
            name: "Charge receivable",
            type: "ASSET",
            isActive: true,
            fiscalPeriodId: FISCAL_PERIOD_ID,
            children: [],
        },
        chargeRevenueAccount: {
            id: REVENUE_ACCOUNT_ID,
            code: "4101",
            name: "Charge revenue",
            type: "REVENUE",
            isActive: true,
            fiscalPeriodId: FISCAL_PERIOD_ID,
            children: [],
        },
        ...overrides,
    };
}

function makeError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

beforeEach(() => {
    jest.clearAllMocks();

    unitAccount = {
        id: UNIT_ACCOUNT_ID,
        unitId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        unit: {
            building: {
                complexId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            },
        },
    };

    charge = {
        id: CHARGE_ID,
        unitAccountId: UNIT_ACCOUNT_ID,
        fiscalPeriodId: FISCAL_PERIOD_ID,
        amount: 1000,
        status: "ISSUED",
    };

    transactionCharge = {
        ...charge,
        payments: [],
    };

    resident = {
        id: RESIDENT_ID,
        unitId: unitAccount.unitId,
    };

    financialAccount = makeFinancialAccount();
    accountingConfiguration = makeConfiguration();

    payment = {
        id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
        unitAccountId: UNIT_ACCOUNT_ID,
        chargeId: CHARGE_ID,
        amount: 1000,
        paymentDate: new Date("2026-03-15T12:00:00.000Z"),
    };

    draftJournalEntry = {
        id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
        status: "DRAFT",
    };

    postedJournalEntry = {
        ...draftJournalEntry,
        status: "POSTED",
    };

    updatedCharge = {
        ...charge,
        status: "PAID",
    };

    tx = {
        charge: {
            findUnique: jest.fn(
                async () => transactionCharge
            ),
        },
        financialAccount: {
            findUnique: jest.fn(
                async () => financialAccount
            ),
        },
        accountingConfiguration: {
            findUnique: jest.fn(
                async () => accountingConfiguration
            ),
        },
    };

    unitAccountRepository.findById.mockResolvedValue(unitAccount);
    chargeRepository.findById.mockResolvedValue(charge);
    chargeRepository.updateWithClient.mockResolvedValue(updatedCharge);
    residentRepository.findById.mockResolvedValue(resident);

    paymentRepository.createWithClient.mockResolvedValue(payment);
    paymentRepository.findById.mockResolvedValue(payment);
    paymentRepository.findAll.mockResolvedValue([]);
    paymentRepository.findByChargeId.mockResolvedValue([]);
    paymentRepository.findByUnitAccountId.mockResolvedValue([]);

    accessService.requireUnitAccountComplexAccess.mockResolvedValue(true);

    journalEntryService.createWithClient.mockResolvedValue(
        draftJournalEntry
    );

    journalEntryService.postWithClient.mockResolvedValue(
        postedJournalEntry
    );

    prisma.$transaction.mockImplementation(
        async (callback) => callback(tx)
    );
});

describe("ChargePaymentService.createPayment - request validation", () => {
    test("rejects a missing user", async () => {
        await expect(
            service.createPayment(makeData(), null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Authentication required",
        });

        expect(unitAccountRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a missing request body", async () => {
        await expect(
            service.createPayment(null, USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Request body is required",
        });
    });

    test("rejects a missing unitAccountId", async () => {
        await expect(
            service.createPayment(
                makeData({ unitAccountId: undefined }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "unitAccountId is required",
        });
    });

    test("rejects a missing financialAccountId", async () => {
        await expect(
            service.createPayment(
                makeData({ financialAccountId: undefined }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "financialAccountId is required",
        });
    });

    test.each([
        ["not-a-number", "invalid"],
        [0, "zero"],
        [-10, "negative"],
        [null, "null"],
        [Infinity, "infinite"],
    ])("rejects %s payment amount (%s)", async (amount) => {
        await expect(
            service.createPayment(makeData({ amount }), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Payment amount must be greater than zero",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid unit account UUID", async () => {
        await expect(
            service.createPayment(
                makeData({ unitAccountId: "invalid" }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unitAccountId",
        });

        expect(unitAccountRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a missing unit account", async () => {
        unitAccountRepository.findById.mockResolvedValue(null);

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit account not found",
        });
    });

    test("rejects unit-account access before reading the charge", async () => {
        accessService.requireUnitAccountComplexAccess.mockRejectedValue(
            makeError("Forbidden", 403)
        );

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Forbidden",
        });

        expect(chargeRepository.findById).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid charge UUID", async () => {
        await expect(
            service.createPayment(
                makeData({ chargeId: "invalid" }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid chargeId",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects a charge that does not exist", async () => {
        chargeRepository.findById.mockResolvedValue(null);

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Charge not found",
        });
    });

    test("rejects a charge belonging to another unit account", async () => {
        chargeRepository.findById.mockResolvedValue({
            ...charge,
            unitAccountId: OTHER_PERIOD_ID,
        });

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Charge does not belong to the selected unit account",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid resident UUID", async () => {
        await expect(
            service.createPayment(
                makeData({ residentId: "invalid" }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid residentId",
        });

        expect(residentRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a resident that does not exist", async () => {
        residentRepository.findById.mockResolvedValue(null);

        await expect(
            service.createPayment(
                makeData({ residentId: RESIDENT_ID }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Resident not found",
        });
    });

    test("rejects a resident belonging to a different unit", async () => {
        residentRepository.findById.mockResolvedValue({
            ...resident,
            unitId: OTHER_PERIOD_ID,
        });

        await expect(
            service.createPayment(
                makeData({ residentId: RESIDENT_ID }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Resident does not belong to the selected unit",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects an invalid payment date", async () => {
        await expect(
            service.createPayment(
                makeData({ paymentDate: "not-a-date" }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid paymentDate",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("rejects if unit-account access control is not configured", async () => {
        const originalAccessChecker =
            accessService.requireUnitAccountComplexAccess;

        try {
            accessService.requireUnitAccountComplexAccess = undefined;

            await expect(
                service.createPayment(makeData(), USER)
            ).rejects.toMatchObject({
                statusCode: 500,
                message: "Unit account access control is not configured.",
            });

            expect(prisma.$transaction).not.toHaveBeenCalled();
        } finally {
            accessService.requireUnitAccountComplexAccess =
                originalAccessChecker;
        }
    });
});

describe("ChargePaymentService.createPayment - transaction charge validation", () => {
    test("rejects a charge that disappears before the transaction reads it", async () => {
        tx.charge.findUnique.mockResolvedValue(null);

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Charge not found",
        });
    });

    test("rejects a transaction charge linked to another unit account", async () => {
        transactionCharge.unitAccountId = OTHER_PERIOD_ID;

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Charge does not belong to the selected unit account",
        });
    });

    test("rejects a cancelled charge", async () => {
        transactionCharge.status = "CANCELLED";

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Cancelled charge cannot receive payment",
        });
    });

    test("rejects a charge without a fiscal period", async () => {
        transactionCharge.fiscalPeriodId = null;

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Charge is not assigned to a fiscal period",
        });
    });

    test("rejects a charge that is already fully paid", async () => {
        transactionCharge.payments = [
            { id: "payment-existing", amount: 1000 },
        ];

        await expect(
            service.createPayment(makeData({ amount: 1 }), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Charge is already fully paid",
        });
    });

    test("rejects a payment that exceeds the remaining amount", async () => {
        transactionCharge.payments = [
            { id: "payment-existing", amount: 700 },
        ];

        await expect(
            service.createPayment(makeData({ amount: 301 }), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message:
                "Payment amount exceeds remaining charge amount. Remaining: 300",
        });
    });
});

describe("ChargePaymentService.createPayment - financial account validation", () => {
    test.each([
        [
            "financial account not found",
            () => {
                financialAccount = null;
            },
            "Financial account not found",
            404,
        ],
        [
            "financial account inactive",
            () => {
                financialAccount.status = "INACTIVE";
            },
            "Financial account is not active: BANK-01",
        ],
        [
            "financial account without fiscal period",
            () => {
                financialAccount.fiscalPeriodId = null;
            },
            "Financial account BANK-01 is not assigned to a fiscal period",
        ],
        [
            "financial account from another fiscal period",
            () => {
                financialAccount.fiscalPeriodId = OTHER_PERIOD_ID;
            },
            "Financial account BANK-01 does not belong to the payment fiscal period",
        ],
        [
            "financial account without a linked accounting account",
            () => {
                financialAccount.accountId = null;
            },
            "Financial account BANK-01 is not linked to an accounting account",
        ],
        [
            "missing linked posting account",
            () => {
                financialAccount.account = null;
            },
            "Accounting account linked to financial account BANK-01 was not found",
        ],
        [
            "inactive posting account",
            () => {
                financialAccount.account.isActive = false;
            },
            "Accounting account is inactive: 1101",
        ],
        [
            "posting account from another fiscal period",
            () => {
                financialAccount.account.fiscalPeriodId = OTHER_PERIOD_ID;
            },
            "Accounting account 1101 does not belong to the payment fiscal period",
        ],
        [
            "posting account of the wrong type",
            () => {
                financialAccount.account.type = "LIABILITY";
            },
            "Financial account BANK-01 must be linked to an ASSET posting account",
        ],
        [
            "non-leaf posting account",
            () => {
                financialAccount.account.children = [{ id: "child-account" }];
            },
            "Financial account BANK-01 is linked to a non-leaf accounting account",
        ],
    ])("rejects %s", async (
        _name,
        changeAccount,
        expectedMessage,
        expectedStatus = 400
    ) => {
        changeAccount();

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: expectedStatus,
            message: expectedMessage,
        });

        expect(journalEntryService.createWithClient).not.toHaveBeenCalled();
        expect(paymentRepository.createWithClient).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentService.createPayment - accounting configuration validation", () => {
    test.each([
        [
            "missing configuration",
            () => {
                accountingConfiguration = null;
            },
            "Accounting configuration not found for the fiscal period",
        ],
        [
            "receivable account ID not configured",
            () => {
                accountingConfiguration.chargeReceivableAccountId = null;
            },
            "Charge receivable account is not configured",
        ],
        [
            "revenue account ID not configured",
            () => {
                accountingConfiguration.chargeRevenueAccountId = null;
            },
            "Charge revenue account is not configured",
        ],
        [
            "receivable account record missing",
            () => {
                accountingConfiguration.chargeReceivableAccount = null;
            },
            "Charge receivable account not found",
        ],
        [
            "receivable account inactive",
            () => {
                accountingConfiguration.chargeReceivableAccount.isActive = false;
            },
            "Charge receivable account is inactive: 1201",
        ],
        [
            "receivable account from another period",
            () => {
                accountingConfiguration.chargeReceivableAccount.fiscalPeriodId =
                    OTHER_PERIOD_ID;
            },
            "Charge receivable account 1201 does not belong to the selected fiscal period",
        ],
        [
            "receivable account with the wrong type",
            () => {
                accountingConfiguration.chargeReceivableAccount.type = "LIABILITY";
            },
            "Charge receivable account must be an ASSET account: 1201",
        ],
        [
            "receivable account is not a leaf",
            () => {
                accountingConfiguration.chargeReceivableAccount.children = [
                    { id: "receivable-child" },
                ];
            },
            "Charge receivable account must be a leaf account: 1201",
        ],
        [
            "revenue account record missing",
            () => {
                accountingConfiguration.chargeRevenueAccount = null;
            },
            "Charge revenue account not found",
        ],
        [
            "revenue account inactive",
            () => {
                accountingConfiguration.chargeRevenueAccount.isActive = false;
            },
            "Charge revenue account is inactive: 4101",
        ],
        [
            "revenue account from another period",
            () => {
                accountingConfiguration.chargeRevenueAccount.fiscalPeriodId =
                    OTHER_PERIOD_ID;
            },
            "Charge revenue account 4101 does not belong to the selected fiscal period",
        ],
        [
            "revenue account with the wrong type",
            () => {
                accountingConfiguration.chargeRevenueAccount.type = "EXPENSE";
            },
            "Charge revenue account must be a REVENUE account: 4101",
        ],
        [
            "revenue account is not a leaf",
            () => {
                accountingConfiguration.chargeRevenueAccount.children = [
                    { id: "revenue-child" },
                ];
            },
            "Charge revenue account must be a leaf account: 4101",
        ],
        [
            "receivable and revenue account IDs are identical",
            () => {
                accountingConfiguration.chargeRevenueAccount.id =
                    accountingConfiguration.chargeReceivableAccount.id;
            },
            "Charge receivable and charge revenue accounts cannot be the same",
        ],
    ])("rejects %s", async (_name, changeConfiguration, expectedMessage) => {
        changeConfiguration();

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expectedMessage,
        });

        expect(journalEntryService.createWithClient).not.toHaveBeenCalled();
        expect(paymentRepository.createWithClient).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentService.createPayment - successful transactions", () => {
    test("creates payment, posts a balanced journal entry, and marks the charge PAID", async () => {
        const result =
            await service.createPayment(makeData(), USER);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        expect(journalEntryService.createWithClient).toHaveBeenCalledWith(
            expect.objectContaining({
                entryDate: new Date("2026-03-15T12:00:00.000Z"),
                description: "Test payment",
                fiscalPeriodId: FISCAL_PERIOD_ID,
                fundId: null,
                lines: [
                    {
                        accountId: POSTING_ACCOUNT_ID,
                        description: "Test payment",
                        debit: 1000,
                        credit: 0,
                    },
                    {
                        accountId: RECEIVABLE_ACCOUNT_ID,
                        description: "Test payment",
                        debit: 0,
                        credit: 1000,
                    },
                ],
            }),
            tx
        );

        expect(journalEntryService.postWithClient).toHaveBeenCalledWith(
            draftJournalEntry.id,
            tx
        );

        expect(paymentRepository.createWithClient).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                unitAccountId: UNIT_ACCOUNT_ID,
                chargeId: CHARGE_ID,
                residentId: null,
                financialAccountId: FINANCIAL_ACCOUNT_ID,
                journalEntryId: postedJournalEntry.id,
                amount: 1000,
                description: "Test payment",
            })
        );

        expect(chargeRepository.updateWithClient).toHaveBeenCalledWith(
            tx,
            CHARGE_ID,
            { status: "PAID" }
        );

        expect(result).toEqual({
            payment,
            journalEntry: postedJournalEntry,
            charge: updatedCharge,
        });
    });

    test("marks a charge PARTIALLY_PAID when only part of its amount is received", async () => {
        const partialPayment = {
            ...payment,
            amount: 300,
        };

        paymentRepository.createWithClient.mockResolvedValue(partialPayment);

        await service.createPayment(
            makeData({ amount: "300" }),
            USER
        );

        expect(paymentRepository.createWithClient).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                amount: 300,
            })
        );

        expect(chargeRepository.updateWithClient).toHaveBeenCalledWith(
            tx,
            CHARGE_ID,
            { status: "PARTIALLY_PAID" }
        );
    });

    test("uses a fallback description when description is empty", async () => {
        await service.createPayment(
            makeData({ description: "" }),
            USER
        );

        expect(journalEntryService.createWithClient).toHaveBeenCalledWith(
            expect.objectContaining({
                description: `Charge payment - ${CHARGE_ID}`,
                lines: expect.arrayContaining([
                    expect.objectContaining({
                        description: `Charge payment - ${CHARGE_ID}`,
                    }),
                ]),
            }),
            tx
        );
    });

    test("converts a missing resident to null in the payment record", async () => {
        await service.createPayment(
            makeData({ residentId: undefined }),
            USER
        );

        expect(paymentRepository.createWithClient).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                residentId: null,
            })
        );
    });

    test("maps Prisma serializable transaction conflicts to HTTP 409", async () => {
        prisma.$transaction.mockRejectedValue({
            code: "P2034",
        });

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toMatchObject({
            statusCode: 409,
            message:
                "Payment could not be completed because another transaction modified the charge at the same time. Please retry.",
        });
    });

    test("propagates unexpected transaction errors", async () => {
        const dbError = new Error("Unexpected transaction failure");
        prisma.$transaction.mockRejectedValue(dbError);

        await expect(
            service.createPayment(makeData(), USER)
        ).rejects.toBe(dbError);
    });
});

describe("ChargePaymentService.getPaymentById", () => {
    test("rejects a missing payment ID", async () => {
        await expect(
            service.getPaymentById(null, USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "id is required",
        });

        expect(paymentRepository.findById).not.toHaveBeenCalled();
    });

    test("returns 404 when the payment does not exist", async () => {
        paymentRepository.findById.mockResolvedValue(null);

        await expect(
            service.getPaymentById(
                "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Charge payment not found",
        });
    });

    test("returns a payment after verifying unit-account access", async () => {
        await expect(
            service.getPaymentById(payment.id, USER)
        ).resolves.toBe(payment);

        expect(accessService.requireUnitAccountComplexAccess)
            .toHaveBeenCalledWith(USER, unitAccount);
    });
});

describe("ChargePaymentService.getPaymentsByUnitAccount", () => {
    test("rejects a missing unit-account ID", async () => {
        await expect(
            service.getPaymentsByUnitAccount(null, USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "unitAccountId is required",
        });
    });

    test("rejects a malformed unit-account UUID", async () => {
        await expect(
            service.getPaymentsByUnitAccount("invalid", USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unitAccountId",
        });

        expect(paymentRepository.findByUnitAccountId).not.toHaveBeenCalled();
    });

    test("returns payments for an accessible unit account", async () => {
        paymentRepository.findByUnitAccountId.mockResolvedValue([payment]);

        await expect(
            service.getPaymentsByUnitAccount(UNIT_ACCOUNT_ID, USER)
        ).resolves.toEqual([payment]);

        expect(paymentRepository.findByUnitAccountId)
            .toHaveBeenCalledWith(UNIT_ACCOUNT_ID);
    });
});

describe("ChargePaymentService - remaining validation paths", () => {
    test("rejects reading a payment without an authenticated user", async () => {
        await expect(
            service.getPaymentById(payment.id, null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Authentication required",
        });
    });

    test("rejects an invalid financial account UUID inside the transaction", async () => {
        await expect(
            service.createPayment(
                makeData({ financialAccountId: "not-a-uuid" }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid financialAccountId",
        });

        expect(tx.financialAccount.findUnique).not.toHaveBeenCalled();
        expect(journalEntryService.createWithClient).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentService - defensive input paths", () => {
    test("rejects a payment record without a unitAccountId", async () => {
        paymentRepository.findById.mockResolvedValue({
            ...payment,
            unitAccountId: null,
        });

        await expect(
            service.getPaymentById(payment.id, USER)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unitAccountId",
        });
    });

    test("rejects a missing chargeId when creating a payment", async () => {
        await expect(
            service.createPayment(
                makeData({ chargeId: undefined }),
                USER
            )
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Charge not found",
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });
});
