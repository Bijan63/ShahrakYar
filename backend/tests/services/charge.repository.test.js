jest.mock("../../src/config/prisma", () => ({
    charge: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const repository = require("../../src/repositories/charge.repository");

const CHARGE_ID = "charge-repository-test";
const UNIT_ACCOUNT_ID = "unit-account-repository-test";

const charge = {
    id: CHARGE_ID,
    unitAccountId: UNIT_ACCOUNT_ID,
    amount: 1000,
    status: "ISSUED",
};

beforeEach(() => {
    jest.resetAllMocks();

    prisma.charge.create.mockResolvedValue(charge);
    prisma.charge.findUnique.mockResolvedValue(charge);
    prisma.charge.findMany.mockResolvedValue([charge]);
    prisma.charge.update.mockResolvedValue(charge);
    prisma.charge.delete.mockResolvedValue(charge);
});

describe("ChargeRepository getInclude", () => {
    test("includes unit account relations and resident payment details", () => {
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
            payments: {
                include: {
                    resident: true,
                },
                orderBy: {
                    paymentDate: "desc",
                },
            },
        });
    });
});

describe("ChargeRepository create", () => {
    test("creates a charge with configured relations", async () => {
        const data = {
            unitAccountId: UNIT_ACCOUNT_ID,
            amount: 1000,
            description: "Repository test charge",
            status: "ISSUED",
        };

        await expect(repository.create(data)).resolves.toEqual(charge);

        expect(prisma.charge.create).toHaveBeenCalledWith({
            data,
            include: repository.getInclude(),
        });
    });
});

describe("ChargeRepository createWithClient", () => {
    test("uses the supplied transaction client", async () => {
        const client = {
            charge: {
                create: jest.fn().mockResolvedValue(charge),
            },
        };

        const data = {
            unitAccountId: UNIT_ACCOUNT_ID,
            amount: 2000,
            description: "Transaction client test",
        };

        await expect(
            repository.createWithClient(client, data)
        ).resolves.toEqual(charge);

        expect(client.charge.create).toHaveBeenCalledWith({
            data,
            include: repository.getInclude(),
        });

        expect(prisma.charge.create).not.toHaveBeenCalled();
    });
});

describe("ChargeRepository findById", () => {
    test("finds a charge by ID and includes its relations", async () => {
        await expect(repository.findById(CHARGE_ID)).resolves.toEqual(charge);

        expect(prisma.charge.findUnique).toHaveBeenCalledWith({
            where: {
                id: CHARGE_ID,
            },
            include: repository.getInclude(),
        });
    });
});

describe("ChargeRepository findByUnitAccountId", () => {
    test("filters by unit account and sorts newest charges first", async () => {
        await expect(
            repository.findByUnitAccountId(UNIT_ACCOUNT_ID)
        ).resolves.toEqual([charge]);

        expect(prisma.charge.findMany).toHaveBeenCalledWith({
            where: {
                unitAccountId: UNIT_ACCOUNT_ID,
            },
            include: repository.getInclude(),
            orderBy: [
                {
                    issueDate: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });
    });
});

describe("ChargeRepository findAll", () => {
    test("returns all charges with relations in descending date order", async () => {
        await expect(repository.findAll()).resolves.toEqual([charge]);

        expect(prisma.charge.findMany).toHaveBeenCalledWith({
            include: repository.getInclude(),
            orderBy: [
                {
                    issueDate: "desc",
                },
                {
                    createdAt: "desc",
                },
            ],
        });
    });
});

describe("ChargeRepository update", () => {
    test("updates a charge by ID and includes its relations", async () => {
        const data = {
            description: "Updated charge description",
            status: "PARTIALLY_PAID",
        };

        await expect(
            repository.update(CHARGE_ID, data)
        ).resolves.toEqual(charge);

        expect(prisma.charge.update).toHaveBeenCalledWith({
            where: {
                id: CHARGE_ID,
            },
            data,
            include: repository.getInclude(),
        });
    });
});

describe("ChargeRepository updateWithClient", () => {
    test("uses the supplied transaction client", async () => {
        const client = {
            charge: {
                update: jest.fn().mockResolvedValue(charge),
            },
        };

        const data = {
            status: "PAID",
        };

        await expect(
            repository.updateWithClient(client, CHARGE_ID, data)
        ).resolves.toEqual(charge);

        expect(client.charge.update).toHaveBeenCalledWith({
            where: {
                id: CHARGE_ID,
            },
            data,
            include: repository.getInclude(),
        });

        expect(prisma.charge.update).not.toHaveBeenCalled();
    });
});

describe("ChargeRepository delete", () => {
    test("deletes a charge by ID", async () => {
        await expect(repository.delete(CHARGE_ID)).resolves.toEqual(charge);

        expect(prisma.charge.delete).toHaveBeenCalledWith({
            where: {
                id: CHARGE_ID,
            },
        });
    });
});
