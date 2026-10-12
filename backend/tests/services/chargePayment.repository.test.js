jest.mock("../../src/config/prisma", () => ({
    chargePayment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const repository = require("../../src/repositories/chargePayment.repository");

const PAYMENT_ID = "payment-repository-test";
const UNIT_ACCOUNT_ID = "unit-account-test";
const CHARGE_ID = "charge-repository-test";

const payment = {
    id: PAYMENT_ID,
    unitAccountId: UNIT_ACCOUNT_ID,
    chargeId: CHARGE_ID,
    amount: 500,
};

beforeEach(() => {
    jest.resetAllMocks();

    prisma.chargePayment.create.mockResolvedValue(payment);
    prisma.chargePayment.findUnique.mockResolvedValue(payment);
    prisma.chargePayment.findMany.mockResolvedValue([payment]);
    prisma.chargePayment.update.mockResolvedValue(payment);
    prisma.chargePayment.delete.mockResolvedValue(payment);
});

describe("ChargePaymentRepository getInclude", () => {
    test("includes related unit, charge, resident, financial account and journal entry", () => {
        expect(repository.getInclude()).toEqual({
            unitAccount: {
                include: {
                    unit: {
                        include: {
                            building: true,
                            property: true,
                        },
                    },
                },
            },
            charge: true,
            resident: {
                include: {
                    person: true,
                },
            },
            financialAccount: {
                include: {
                    account: true,
                    fiscalPeriod: true,
                    fund: true,
                },
            },
            journalEntry: {
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
            },
        });
    });
});

describe("ChargePaymentRepository create", () => {
    test("creates a payment with all configured relations", async () => {
        const data = {
            unitAccountId: UNIT_ACCOUNT_ID,
            chargeId: CHARGE_ID,
            amount: 500,
            description: "Repository test payment",
        };

        await expect(repository.create(data)).resolves.toEqual(payment);

        expect(prisma.chargePayment.create).toHaveBeenCalledWith({
            data,
            include: repository.getInclude(),
        });
    });
});

describe("ChargePaymentRepository findById", () => {
    test("finds a payment by ID and includes relations", async () => {
        await expect(repository.findById(PAYMENT_ID)).resolves.toEqual(payment);

        expect(prisma.chargePayment.findUnique).toHaveBeenCalledWith({
            where: {
                id: PAYMENT_ID,
            },
            include: repository.getInclude(),
        });
    });
});

describe("ChargePaymentRepository findByUnitAccountId", () => {
    test("filters by unit account and orders by payment date then creation date descending", async () => {
        await expect(
            repository.findByUnitAccountId(UNIT_ACCOUNT_ID)
        ).resolves.toEqual([payment]);

        expect(prisma.chargePayment.findMany).toHaveBeenCalledWith({
            where: {
                unitAccountId: UNIT_ACCOUNT_ID,
            },
            include: repository.getInclude(),
            orderBy: [
                {
                    paymentDate: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });
    });
});

describe("ChargePaymentRepository findByChargeId", () => {
    test("filters by charge and applies the expected ordering", async () => {
        await expect(
            repository.findByChargeId(CHARGE_ID)
        ).resolves.toEqual([payment]);

        expect(prisma.chargePayment.findMany).toHaveBeenCalledWith({
            where: {
                chargeId: CHARGE_ID,
            },
            include: repository.getInclude(),
            orderBy: [
                {
                    paymentDate: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });
    });
});

describe("ChargePaymentRepository findAll", () => {
    test("returns payments with relations ordered newest first", async () => {
        await expect(repository.findAll()).resolves.toEqual([payment]);

        expect(prisma.chargePayment.findMany).toHaveBeenCalledWith({
            include: repository.getInclude(),
            orderBy: [
                {
                    paymentDate: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });
    });
});

describe("ChargePaymentRepository createWithClient", () => {
    test("uses the supplied transaction client instead of the global Prisma client", async () => {
        const tx = {
            chargePayment: {
                create: jest.fn().mockResolvedValue(payment),
            },
        };

        const data = {
            unitAccountId: UNIT_ACCOUNT_ID,
            chargeId: CHARGE_ID,
            amount: 500,
        };

        await expect(
            repository.createWithClient(tx, data)
        ).resolves.toEqual(payment);

        expect(tx.chargePayment.create).toHaveBeenCalledWith({
            data,
            include: repository.getInclude(),
        });

        expect(prisma.chargePayment.create).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentRepository update", () => {
    test("updates a payment by ID with its relations", async () => {
        const data = {
            description: "Updated payment description",
        };

        await expect(
            repository.update(PAYMENT_ID, data)
        ).resolves.toEqual(payment);

        expect(prisma.chargePayment.update).toHaveBeenCalledWith({
            where: {
                id: PAYMENT_ID,
            },
            data,
            include: repository.getInclude(),
        });
    });
});

describe("ChargePaymentRepository delete", () => {
    test("deletes a payment by ID", async () => {
        await expect(
            repository.delete(PAYMENT_ID)
        ).resolves.toEqual(payment);

        expect(prisma.chargePayment.delete).toHaveBeenCalledWith({
            where: {
                id: PAYMENT_ID,
            },
        });
    });
});
