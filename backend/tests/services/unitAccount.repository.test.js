jest.mock("../../src/config/prisma", () => ({
    unitAccount: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const repository = require("../../src/repositories/unitAccount.repository");

const EXPECTED_INCLUDE = {
    unit: {
        include: {
            building: true,
            property: true,
            residents: {
                include: {
                    person: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            role: true,
                            status: true,
                            personId: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                    },
                },
            },
        },
    },
    charges: {
        orderBy: {
            issueDate: "desc",
        },
    },
    payments: {
        include: {
            resident: true,
            charge: true,
        },
        orderBy: {
            paymentDate: "desc",
        },
    },
};

describe("UnitAccountRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getInclude", () => {
        test("returns all required relations and sorting rules", () => {
            expect(repository.getInclude()).toEqual(EXPECTED_INCLUDE);
        });
    });

    describe("create", () => {
        test("creates an account and includes related records", async () => {
            const data = {
                unitId: "unit-1",
                code: "ACCOUNT-001",
            };
            const created = {
                id: "account-1",
                ...data,
            };

            prisma.unitAccount.create.mockResolvedValue(created);

            const result = await repository.create(data);

            expect(prisma.unitAccount.create).toHaveBeenCalledWith({
                data,
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(created);
        });

        test("propagates a Prisma creation error", async () => {
            const error = new Error("Create failed");
            prisma.unitAccount.create.mockRejectedValue(error);

            await expect(
                repository.create({ unitId: "unit-1" })
            ).rejects.toBe(error);
        });
    });

    describe("findById", () => {
        test("finds an account by ID with related records", async () => {
            const account = { id: "account-1" };
            prisma.unitAccount.findUnique.mockResolvedValue(account);

            const result = await repository.findById("account-1");

            expect(prisma.unitAccount.findUnique).toHaveBeenCalledWith({
                where: { id: "account-1" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(account);
        });

        test("returns null when the ID does not match", async () => {
            prisma.unitAccount.findUnique.mockResolvedValue(null);

            await expect(
                repository.findById("missing-id")
            ).resolves.toBeNull();
        });
    });

    describe("findByUnitId", () => {
        test("finds an account by unit ID", async () => {
            const account = {
                id: "account-1",
                unitId: "unit-1",
            };
            prisma.unitAccount.findUnique.mockResolvedValue(account);

            const result = await repository.findByUnitId("unit-1");

            expect(prisma.unitAccount.findUnique).toHaveBeenCalledWith({
                where: { unitId: "unit-1" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(account);
        });
    });

    describe("findByCode", () => {
        test("finds an account by code", async () => {
            const account = {
                id: "account-1",
                code: "ACCOUNT-001",
            };
            prisma.unitAccount.findUnique.mockResolvedValue(account);

            const result = await repository.findByCode("ACCOUNT-001");

            expect(prisma.unitAccount.findUnique).toHaveBeenCalledWith({
                where: { code: "ACCOUNT-001" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(account);
        });
    });

    describe("findAll", () => {
        test("returns all accounts in the required order", async () => {
            const accounts = [
                { id: "account-1", code: "ACCOUNT-001" },
                { id: "account-2", code: "ACCOUNT-002" },
            ];
            prisma.unitAccount.findMany.mockResolvedValue(accounts);

            const result = await repository.findAll();

            expect(prisma.unitAccount.findMany).toHaveBeenCalledWith({
                include: EXPECTED_INCLUDE,
                orderBy: [
                    { code: "asc" },
                    { createdAt: "asc" },
                ],
            });
            expect(result).toBe(accounts);
        });

        test("returns an empty list when there are no accounts", async () => {
            prisma.unitAccount.findMany.mockResolvedValue([]);

            await expect(repository.findAll()).resolves.toEqual([]);
        });
    });

    describe("update", () => {
        test("updates an account and includes related records", async () => {
            const id = "account-1";
            const data = {
                code: "ACCOUNT-UPDATED",
            };
            const updated = {
                id,
                ...data,
            };

            prisma.unitAccount.update.mockResolvedValue(updated);

            const result = await repository.update(id, data);

            expect(prisma.unitAccount.update).toHaveBeenCalledWith({
                where: { id },
                data,
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(updated);
        });

        test("propagates a Prisma update error", async () => {
            const error = new Error("Update failed");
            prisma.unitAccount.update.mockRejectedValue(error);

            await expect(
                repository.update("missing-id", { code: "NEW-CODE" })
            ).rejects.toBe(error);
        });
    });

    describe("delete", () => {
        test("deletes an account and includes its unit", async () => {
            const deleted = {
                id: "account-1",
                unit: {
                    id: "unit-1",
                },
            };
            prisma.unitAccount.delete.mockResolvedValue(deleted);

            const result = await repository.delete("account-1");

            expect(prisma.unitAccount.delete).toHaveBeenCalledWith({
                where: { id: "account-1" },
                include: {
                    unit: true,
                },
            });
            expect(result).toBe(deleted);
        });

        test("propagates a Prisma deletion error", async () => {
            const error = new Error("Delete failed");
            prisma.unitAccount.delete.mockRejectedValue(error);

            await expect(
                repository.delete("missing-id")
            ).rejects.toBe(error);
        });
    });
});
