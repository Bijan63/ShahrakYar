jest.mock("../../src/config/prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../src/repositories/chargePayment.repository", () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByChargeId: jest.fn(),
    findByUnitAccountId: jest.fn(),
    createWithClient: jest.fn(),
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

const journalEntryService = require("../../src/services/journalEntry.service");
const chargePaymentService =
    require("../../src/services/chargePayment.service");

const chargePaymentRepository =
    require("../../src/repositories/chargePayment.repository");

const chargeRepository =
    require("../../src/repositories/charge.repository");

const unitAccountRepository =
    require("../../src/repositories/unitAccount.repository");

const accessService =
    require("../../src/services/access.service");

const COMPLEX_A = "11111111-1111-4111-8111-111111111111";
const COMPLEX_B = "22222222-2222-4222-8222-222222222222";

const ACCOUNT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACCOUNT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const manager = {
    id: "33333333-3333-4333-8333-333333333333",
    role: "MANAGER",
    status: "ACTIVE",
};

const paymentA = {
    id: "payment-a",
    unitAccountId: ACCOUNT_A,
    amount: 1000,
};

const paymentB = {
    id: "payment-b",
    unitAccountId: ACCOUNT_B,
    amount: 2000,
};

const accountA = {
    id: ACCOUNT_A,
    unit: {
        building: { complexId: COMPLEX_A },
        property: { complexId: COMPLEX_A },
    },
};

const accountB = {
    id: ACCOUNT_B,
    unit: {
        building: { complexId: COMPLEX_B },
        property: { complexId: COMPLEX_B },
    },
};

function forbiddenError() {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    return error;
}

describe("ChargePaymentService access control for payment lists", () => {
    beforeEach(() => {
        jest.resetAllMocks();

        chargePaymentRepository.findAll.mockResolvedValue([
            paymentA,
            paymentB,
        ]);

        unitAccountRepository.findById.mockImplementation(
            async (id) => {
                if (id === ACCOUNT_A) return accountA;
                if (id === ACCOUNT_B) return accountB;
                return null;
            }
        );

        accessService.requireUnitAccountComplexAccess.mockImplementation(
            async (_user, unitAccount) => {
                const complexId =
                    unitAccount.unit.building?.complexId ||
                    unitAccount.unit.property?.complexId;

                if (complexId !== COMPLEX_A) {
                    throw forbiddenError();
                }

                return true;
            }
        );
    });

    test("returns only payments belonging to the manager's accessible complex", async () => {
        const filters = { page: 1, limit: 20 };

        const result = await chargePaymentService.getPayments(
            filters,
            manager
        );

        expect(chargePaymentRepository.findAll)
            .toHaveBeenCalledWith(filters);

        expect(unitAccountRepository.findById)
            .toHaveBeenCalledTimes(2);

        expect(
            accessService.requireUnitAccountComplexAccess
        ).toHaveBeenCalledTimes(2);

        expect(result).toEqual([paymentA]);

        expect(result).not.toContainEqual(paymentB);
    });

    test("does not hide internal errors as if they were access denials", async () => {
        const databaseError = new Error("Database unavailable");
        databaseError.statusCode = 500;

        chargePaymentRepository.findAll.mockResolvedValue([
            paymentA,
        ]);

        accessService.requireUnitAccountComplexAccess
            .mockRejectedValue(databaseError);

        await expect(
            chargePaymentService.getPayments({}, manager)
        ).rejects.toBe(databaseError);
    });

    test("propagates authentication errors instead of returning payments", async () => {
        const authError = new Error("Unauthorized.");
        authError.statusCode = 401;

        chargePaymentRepository.findAll.mockResolvedValue([
            paymentA,
        ]);

        accessService.requireUnitAccountComplexAccess
            .mockRejectedValue(authError);

        await expect(
            chargePaymentService.getPayments({}, manager)
        ).rejects.toBe(authError);
    });

    test("rejects reading a payment by ID outside the manager scope", async () => {
        chargePaymentRepository.findById.mockResolvedValue(paymentB);

        await expect(
            chargePaymentService.getPaymentById("payment-b", manager)
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(unitAccountRepository.findById)
            .toHaveBeenCalledWith(ACCOUNT_B, expect.anything());
    });

    test("rejects reading payments by an unauthorized unit account", async () => {
        await expect(
            chargePaymentService.getPaymentsByUnitAccount(
                ACCOUNT_B,
                manager
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(
            chargePaymentRepository.findByUnitAccountId
        ).not.toHaveBeenCalled();
    });

    test("rejects creating a payment before looking up its charge when access is denied", async () => {
        await expect(
            chargePaymentService.createPayment(
                {
                    unitAccountId: ACCOUNT_B,
                    financialAccountId:
                        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                    amount: 2000,
                },
                manager
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(chargeRepository.findById).not.toHaveBeenCalled();
    });


    test("allows a MANAGER to read payments for an accessible charge", async () => {
        chargeRepository.findById.mockResolvedValue({
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            unitAccountId: ACCOUNT_A,
        });

        chargePaymentRepository.findByChargeId.mockResolvedValue([
            paymentA,
        ]);

        await expect(
            chargePaymentService.getPaymentsByCharge(
                "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                manager
            )
        ).resolves.toEqual([paymentA]);

        expect(
            chargePaymentRepository.findByChargeId
        ).toHaveBeenCalledWith("dddddddd-dddd-4ddd-8ddd-dddddddddddd");
    });

    test("rejects reading payments by an unauthorized charge", async () => {
        chargeRepository.findById.mockResolvedValue({
            id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
            unitAccountId: ACCOUNT_B,
        });

        accessService.requireUnitAccountComplexAccess.mockRejectedValue(
            forbiddenError()
        );

        await expect(
            chargePaymentService.getPaymentsByCharge(
                "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                manager
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(
            chargePaymentRepository.findByChargeId
        ).not.toHaveBeenCalled();
    });


    test("allows a MANAGER to pass access check before the charge lookup", async () => {
        const chargeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

        // Stop safely before the database transaction: this test charge
        // does not exist, so no payment or journal entry can be created.
        chargeRepository.findById.mockResolvedValue(null);

        await expect(
            chargePaymentService.createPayment(
                {
                    unitAccountId: ACCOUNT_A,
                    chargeId,
                    financialAccountId:
                        "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                    amount: 2000,
                },
                manager
            )
        ).rejects.toMatchObject({
            statusCode: 404,
        });

        expect(
            accessService.requireUnitAccountComplexAccess
        ).toHaveBeenCalledWith(manager, accountA);

        expect(chargeRepository.findById)
            .toHaveBeenCalledWith(chargeId, prisma);

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });


    test("creates a payment and posts its journal entry for an authorized MANAGER", async () => {
        const chargeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
        const financialAccountId =
            "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
        const fiscalPeriodId =
            "77777777-7777-4777-8777-777777777777";
        const postingAccountId =
            "ffffffff-ffff-4fff-8fff-ffffffffffff";
        const receivableAccountId =
            "99999999-9999-4999-8999-999999999999";
        const revenueAccountId =
            "88888888-8888-4888-8888-888888888888";

        const charge = {
            id: chargeId,
            unitAccountId: ACCOUNT_A,
            fiscalPeriodId,
            status: "ISSUED",
            amount: 10000,
            payments: [],
        };

        const postingAccount = {
            id: postingAccountId,
            code: "1101",
            name: "Test bank posting account",
            type: "ASSET",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const receivableAccount = {
            id: receivableAccountId,
            code: "1201",
            name: "Charge receivables",
            type: "ASSET",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const revenueAccount = {
            id: revenueAccountId,
            code: "4100",
            name: "Charge revenue",
            type: "REVENUE",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const financialAccount = {
            id: financialAccountId,
            code: "TEST-BANK",
            name: "Test bank",
            type: "BANK",
            status: "ACTIVE",
            fiscalPeriodId,
            fundId: null,
            accountId: postingAccountId,
            account: postingAccount,
        };

        const tx = {
            charge: {
                findUnique: jest.fn().mockResolvedValue(charge),
            },
            financialAccount: {
                findUnique: jest.fn().mockResolvedValue(financialAccount),
            },
            accountingConfiguration: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "test-accounting-configuration",
                    fiscalPeriodId,
                    chargeReceivableAccountId: receivableAccountId,
                    chargeRevenueAccountId: revenueAccountId,
                    chargeReceivableAccount: receivableAccount,
                    chargeRevenueAccount: revenueAccount,
                }),
            },
        };

        const draftJournalEntry = {
            id: "draft-journal-entry",
            status: "DRAFT",
        };

        const postedJournalEntry = {
            id: "posted-journal-entry",
            status: "POSTED",
        };

        const createdPayment = {
            id: "created-test-payment",
            unitAccountId: ACCOUNT_A,
            chargeId,
            financialAccountId,
            amount: 2000,
            journalEntryId: postedJournalEntry.id,
        };

        const updatedCharge = {
            ...charge,
            status: "PARTIALLY_PAID",
        };

        chargeRepository.findById.mockResolvedValue(charge);

        prisma.$transaction.mockImplementation(
            async (callback) => callback(tx)
        );

        journalEntryService.createWithClient.mockResolvedValue(
            draftJournalEntry
        );
        journalEntryService.postWithClient.mockResolvedValue(
            postedJournalEntry
        );

        chargePaymentRepository.createWithClient.mockResolvedValue(
            createdPayment
        );
        chargeRepository.updateWithClient.mockResolvedValue(
            updatedCharge
        );

        const result = await chargePaymentService.createPayment(
            {
                unitAccountId: ACCOUNT_A,
                chargeId,
                financialAccountId,
                amount: 2000,
                description: "Mocked payment test",
            },
            manager
        );

        // The manager passed the complex-level authorization check.
        expect(
            accessService.requireUnitAccountComplexAccess
        ).toHaveBeenCalledWith(manager, accountA);

        // The financial flow ran entirely through the mocked transaction.
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(tx.charge.findUnique).toHaveBeenCalledTimes(1);
        expect(tx.financialAccount.findUnique).toHaveBeenCalledTimes(1);
        expect(tx.accountingConfiguration.findUnique)
            .toHaveBeenCalledTimes(1);

        // The accounting entry contains balanced debit and credit lines.
        expect(
            journalEntryService.createWithClient
        ).toHaveBeenCalledWith(
            expect.objectContaining({
                fiscalPeriodId,
                lines: expect.arrayContaining([
                    expect.objectContaining({
                        accountId: postingAccountId,
                        debit: 2000,
                        credit: 0,
                    }),
                    expect.objectContaining({
                        accountId: receivableAccountId,
                        debit: 0,
                        credit: 2000,
                    }),
                ]),
            }),
            tx
        );

        expect(
            journalEntryService.postWithClient
        ).toHaveBeenCalledWith(draftJournalEntry.id, tx);

        expect(
            chargePaymentRepository.createWithClient
        ).toHaveBeenCalledWith(
            tx,
            expect.objectContaining({
                unitAccountId: ACCOUNT_A,
                chargeId,
                financialAccountId,
                journalEntryId: postedJournalEntry.id,
                amount: 2000,
            })
        );

        expect(
            chargeRepository.updateWithClient
        ).toHaveBeenCalledWith(
            tx,
            chargeId,
            { status: "PARTIALLY_PAID" }
        );

        expect(result).toEqual({
            payment: createdPayment,
            journalEntry: postedJournalEntry,
            charge: updatedCharge,
        });
    });


    test("fails closed if the unit-account access checker is missing", async () => {
        const originalAccessCheck =
            accessService.requireUnitAccountComplexAccess;

        delete accessService.requireUnitAccountComplexAccess;

        try {
            await expect(
                chargePaymentService.createPayment(
                    {
                        unitAccountId: ACCOUNT_A,
                        chargeId:
                            "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
                        financialAccountId:
                            "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
                        amount: 2000,
                    },
                    manager
                )
            ).rejects.toMatchObject({
                message: "Unit account access control is not configured.",
                statusCode: 500,
            });

            expect(chargeRepository.findById).not.toHaveBeenCalled();
            expect(prisma.$transaction).not.toHaveBeenCalled();
        } finally {
            accessService.requireUnitAccountComplexAccess =
                originalAccessCheck;
        }
    });


    test("allows a MANAGER to read payments by an accessible unit account", async () => {
        chargePaymentRepository.findByUnitAccountId.mockResolvedValue([
            paymentA,
        ]);

        await expect(
            chargePaymentService.getPaymentsByUnitAccount(
                ACCOUNT_A,
                manager
            )
        ).resolves.toEqual([paymentA]);

        expect(
            accessService.requireUnitAccountComplexAccess
        ).toHaveBeenCalledWith(manager, accountA);

        expect(
            chargePaymentRepository.findByUnitAccountId
        ).toHaveBeenCalledWith(ACCOUNT_A);
    });

    test("rejects getPaymentsByCharge when chargeId is missing", async () => {
        await expect(
            chargePaymentService.getPaymentsByCharge(null, manager)
        ).rejects.toMatchObject({
            message: "chargeId is required",
            statusCode: 400,
        });

        expect(chargeRepository.findById).not.toHaveBeenCalled();
        expect(
            chargePaymentRepository.findByChargeId
        ).not.toHaveBeenCalled();
    });

    test("returns 404 when the requested charge does not exist", async () => {
        const chargeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
        chargeRepository.findById.mockResolvedValue(null);

        await expect(
            chargePaymentService.getPaymentsByCharge(
                chargeId,
                manager
            )
        ).rejects.toMatchObject({
            message: "Charge not found",
            statusCode: 404,
        });

        expect(
            chargePaymentRepository.findByChargeId
        ).not.toHaveBeenCalled();
    });

    test("returns 404 when the requested unit account does not exist", async () => {
        unitAccountRepository.findById.mockResolvedValue(null);

        await expect(
            chargePaymentService.getPaymentsByUnitAccount(
                ACCOUNT_B,
                manager
            )
        ).rejects.toMatchObject({
            message: "Unit account not found",
            statusCode: 404,
        });

        expect(
            accessService.requireUnitAccountComplexAccess
        ).not.toHaveBeenCalled();

        expect(
            chargePaymentRepository.findByUnitAccountId
        ).not.toHaveBeenCalled();
    });


    async function configureJournalFailureScenario(failureStage) {
        const chargeId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
        const financialAccountId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
        const fiscalPeriodId = "77777777-7777-4777-8777-777777777777";
        const postingAccountId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
        const receivableAccountId = "99999999-9999-4999-8999-999999999999";
        const revenueAccountId = "88888888-8888-4888-8888-888888888888";

        const charge = {
            id: chargeId,
            unitAccountId: ACCOUNT_A,
            fiscalPeriodId,
            status: "ISSUED",
            amount: 10000,
            payments: [],
        };

        const postingAccount = {
            id: postingAccountId,
            code: "1101",
            name: "Test bank posting account",
            type: "ASSET",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const receivableAccount = {
            id: receivableAccountId,
            code: "1201",
            name: "Charge receivables",
            type: "ASSET",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const revenueAccount = {
            id: revenueAccountId,
            code: "4100",
            name: "Charge revenue",
            type: "REVENUE",
            isActive: true,
            fiscalPeriodId,
            children: [],
        };

        const financialAccount = {
            id: financialAccountId,
            code: "TEST-BANK",
            name: "Test bank",
            type: "BANK",
            status: "ACTIVE",
            fiscalPeriodId,
            fundId: null,
            accountId: postingAccountId,
            account: postingAccount,
        };

        const tx = {
            charge: {
                findUnique: jest.fn().mockResolvedValue(charge),
            },
            financialAccount: {
                findUnique: jest.fn().mockResolvedValue(financialAccount),
            },
            accountingConfiguration: {
                findUnique: jest.fn().mockResolvedValue({
                    id: "test-accounting-configuration",
                    fiscalPeriodId,
                    chargeReceivableAccountId: receivableAccountId,
                    chargeRevenueAccountId: revenueAccountId,
                    chargeReceivableAccount: receivableAccount,
                    chargeRevenueAccount: revenueAccount,
                }),
            },
        };

        const journalError = new Error(
            failureStage === "create"
                ? "Simulated journal creation failure"
                : "Simulated journal posting failure"
        );

        chargeRepository.findById.mockResolvedValue(charge);

        prisma.$transaction.mockImplementation(
            async (callback) => callback(tx)
        );

        if (failureStage === "create") {
            journalEntryService.createWithClient.mockRejectedValue(
                journalError
            );
        } else {
            journalEntryService.createWithClient.mockResolvedValue({
                id: "draft-journal-entry",
                status: "DRAFT",
            });

            journalEntryService.postWithClient.mockRejectedValue(
                journalError
            );
        }

        chargePaymentRepository.createWithClient.mockResolvedValue({
            id: "created-test-payment",
        });

        chargeRepository.updateWithClient.mockResolvedValue({
            ...charge,
            status: "PARTIALLY_PAID",
        });

        return {
            chargeId,
            financialAccountId,
            journalError,
        };
    }

    test("does not create payment when journal entry creation fails", async () => {
        const {
            chargeId,
            financialAccountId,
            journalError,
        } = await configureJournalFailureScenario("create");

        await expect(
            chargePaymentService.createPayment(
                {
                    unitAccountId: ACCOUNT_A,
                    chargeId,
                    financialAccountId,
                    amount: 2000,
                    description: "Mocked rollback test",
                },
                manager
            )
        ).rejects.toBe(journalError);

        expect(
            journalEntryService.createWithClient
        ).toHaveBeenCalledTimes(1);

        expect(
            journalEntryService.postWithClient
        ).not.toHaveBeenCalled();

        expect(
            chargePaymentRepository.createWithClient
        ).not.toHaveBeenCalled();

        expect(
            chargeRepository.updateWithClient
        ).not.toHaveBeenCalled();
    });

    test("does not create payment when posting the journal entry fails", async () => {
        const {
            chargeId,
            financialAccountId,
            journalError,
        } = await configureJournalFailureScenario("post");

        await expect(
            chargePaymentService.createPayment(
                {
                    unitAccountId: ACCOUNT_A,
                    chargeId,
                    financialAccountId,
                    amount: 2000,
                    description: "Mocked rollback test",
                },
                manager
            )
        ).rejects.toBe(journalError);

        expect(
            journalEntryService.createWithClient
        ).toHaveBeenCalledTimes(1);

        expect(
            journalEntryService.postWithClient
        ).toHaveBeenCalledTimes(1);

        expect(
            chargePaymentRepository.createWithClient
        ).not.toHaveBeenCalled();

        expect(
            chargeRepository.updateWithClient
        ).not.toHaveBeenCalled();
    });

});
