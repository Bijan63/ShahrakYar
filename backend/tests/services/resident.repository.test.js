jest.mock("../../src/config/prisma", () => ({
    resident: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const residentRepository = require("../../src/repositories/resident.repository");

const EXPECTED_INCLUDE = {
    user: true,
    person: true,
    unit: {
        include: {
            building: true,
            property: true,
        },
    },
};

const makeComplexWhere = (complexIds) => ({
    unit: {
        OR: [
            {
                building: {
                    complexId: {
                        in: complexIds,
                    },
                },
            },
            {
                property: {
                    complexId: {
                        in: complexIds,
                    },
                },
            },
        ],
    },
});

describe("ResidentRepository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getInclude", () => {
        test("returns the expected related entities", () => {
            expect(residentRepository.getInclude()).toEqual(
                EXPECTED_INCLUDE
            );
        });
    });

    describe("create", () => {
        test("creates a resident with related entities included", async () => {
            const data = {
                fullName: "Ali Test",
                mobile: "09123456789",
                userId: "user-1",
                unitId: "unit-1",
            };
            const created = { id: "resident-1", ...data };

            prisma.resident.create.mockResolvedValue(created);

            const result = await residentRepository.create(data);

            expect(prisma.resident.create).toHaveBeenCalledWith({
                data,
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(created);
        });

        test("propagates a Prisma create error", async () => {
            const error = new Error("Create failed");
            prisma.resident.create.mockRejectedValue(error);

            await expect(
                residentRepository.create({ fullName: "Ali" })
            ).rejects.toBe(error);
        });
    });

    describe("findById", () => {
        test("finds a resident by ID", async () => {
            const resident = { id: "resident-1" };
            prisma.resident.findUnique.mockResolvedValue(resident);

            const result = await residentRepository.findById("resident-1");

            expect(prisma.resident.findUnique).toHaveBeenCalledWith({
                where: { id: "resident-1" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(resident);
        });

        test("returns null when no resident matches the ID", async () => {
            prisma.resident.findUnique.mockResolvedValue(null);

            await expect(
                residentRepository.findById("missing-id")
            ).resolves.toBeNull();
        });
    });

    describe("findByUserId", () => {
        test("finds a resident by user ID", async () => {
            const resident = { id: "resident-1", userId: "user-1" };
            prisma.resident.findUnique.mockResolvedValue(resident);

            const result = await residentRepository.findByUserId("user-1");

            expect(prisma.resident.findUnique).toHaveBeenCalledWith({
                where: { userId: "user-1" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(resident);
        });
    });

    describe("findByMobile", () => {
        test("finds a resident by mobile number", async () => {
            const resident = {
                id: "resident-1",
                mobile: "09123456789",
            };
            prisma.resident.findFirst.mockResolvedValue(resident);

            const result =
                await residentRepository.findByMobile("09123456789");

            expect(prisma.resident.findFirst).toHaveBeenCalledWith({
                where: { mobile: "09123456789" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(resident);
        });
    });

    describe("findByPersonId", () => {
        test("finds a resident by person ID", async () => {
            const resident = {
                id: "resident-1",
                personId: "person-1",
            };
            prisma.resident.findUnique.mockResolvedValue(resident);

            const result =
                await residentRepository.findByPersonId("person-1");

            expect(prisma.resident.findUnique).toHaveBeenCalledWith({
                where: { personId: "person-1" },
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(resident);
        });
    });

    describe("findAll", () => {
        test("uses default pagination and sorts by full name", async () => {
            const residents = [{ id: "resident-1" }];
            prisma.resident.findMany.mockResolvedValue(residents);

            const result = await residentRepository.findAll();

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 20,
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
            expect(result).toBe(residents);
        });

        test("uses explicitly provided pagination values", async () => {
            prisma.resident.findMany.mockResolvedValue([]);

            await residentRepository.findAll(20, 10);

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 20,
                take: 10,
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
        });
    });

    describe("count", () => {
        test("returns the total resident count", async () => {
            prisma.resident.count.mockResolvedValue(12);

            await expect(residentRepository.count()).resolves.toBe(12);
            expect(prisma.resident.count).toHaveBeenCalledWith();
        });
    });

    describe("findByComplexIds", () => {
        test("filters by building or property complex and paginates", async () => {
            const complexIds = ["complex-1", "complex-2"];
            const residents = [{ id: "resident-1" }];
            prisma.resident.findMany.mockResolvedValue(residents);

            const result = await residentRepository.findByComplexIds(
                complexIds,
                5,
                10
            );

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 5,
                take: 10,
                where: makeComplexWhere(complexIds),
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
            expect(result).toBe(residents);
        });

        test("uses default pagination values", async () => {
            prisma.resident.findMany.mockResolvedValue([]);

            await residentRepository.findByComplexIds(["complex-1"]);

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 20,
                where: makeComplexWhere(["complex-1"]),
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
        });
    });

    describe("countByComplexIds", () => {
        test("counts residents within the specified complexes", async () => {
            const complexIds = ["complex-1"];
            prisma.resident.count.mockResolvedValue(3);

            const result =
                await residentRepository.countByComplexIds(complexIds);

            expect(prisma.resident.count).toHaveBeenCalledWith({
                where: makeComplexWhere(complexIds),
            });
            expect(result).toBe(3);
        });
    });

    describe("search", () => {
        test("forwards filters, pagination, includes and sorting", async () => {
            const args = {
                skip: 10,
                take: 5,
                where: {
                    fullName: {
                        contains: "Ali",
                        mode: "insensitive",
                    },
                },
                orderBy: { fullName: "asc" },
            };
            const residents = [{ id: "resident-1" }];
            prisma.resident.findMany.mockResolvedValue(residents);

            const result = await residentRepository.search(args);

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                ...args,
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(residents);
        });

        test("forwards an empty filter when provided", async () => {
            prisma.resident.findMany.mockResolvedValue([]);

            await residentRepository.search({
                skip: 0,
                take: 20,
                where: {},
                orderBy: { fullName: "asc" },
            });

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 20,
                where: {},
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
        });
    });

    describe("countSearch", () => {
        test("counts residents matching the supplied filter", async () => {
            const where = { unitId: "unit-1" };
            prisma.resident.count.mockResolvedValue(4);

            const result = await residentRepository.countSearch(where);

            expect(prisma.resident.count).toHaveBeenCalledWith({ where });
            expect(result).toBe(4);
        });
    });

    describe("searchByComplexIds", () => {
        test("combines search filters with complex access scope", async () => {
            const complexIds = ["complex-1", "complex-2"];
            const where = {
                fullName: {
                    contains: "Sara",
                    mode: "insensitive",
                },
            };
            const orderBy = { fullName: "asc" };
            const residents = [{ id: "resident-2" }];

            prisma.resident.findMany.mockResolvedValue(residents);

            const result = await residentRepository.searchByComplexIds({
                complexIds,
                skip: 5,
                take: 10,
                where,
                orderBy,
            });

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 5,
                take: 10,
                where: {
                    AND: [
                        where,
                        makeComplexWhere(complexIds),
                    ],
                },
                include: EXPECTED_INCLUDE,
                orderBy,
            });
            expect(result).toBe(residents);
        });

        test("defaults the search filter to an empty object", async () => {
            prisma.resident.findMany.mockResolvedValue([]);

            await residentRepository.searchByComplexIds({
                complexIds: ["complex-1"],
                skip: 0,
                take: 20,
                orderBy: { fullName: "asc" },
            });

            expect(prisma.resident.findMany).toHaveBeenCalledWith({
                skip: 0,
                take: 20,
                where: {
                    AND: [
                        {},
                        makeComplexWhere(["complex-1"]),
                    ],
                },
                include: EXPECTED_INCLUDE,
                orderBy: { fullName: "asc" },
            });
        });
    });

    describe("countSearchByComplexIds", () => {
        test("counts search matches within the specified complexes", async () => {
            const where = { unitId: "unit-1" };
            const complexIds = ["complex-1"];
            prisma.resident.count.mockResolvedValue(2);

            const result = await residentRepository.countSearchByComplexIds(
                where,
                complexIds
            );

            expect(prisma.resident.count).toHaveBeenCalledWith({
                where: {
                    AND: [
                        where,
                        makeComplexWhere(complexIds),
                    ],
                },
            });
            expect(result).toBe(2);
        });
    });

    describe("exists", () => {
        test("returns true when the resident exists", async () => {
            prisma.resident.findUnique.mockResolvedValue({
                id: "resident-1",
            });

            await expect(
                residentRepository.exists("resident-1")
            ).resolves.toBe(true);

            expect(prisma.resident.findUnique).toHaveBeenCalledWith({
                where: { id: "resident-1" },
                select: { id: true },
            });
        });

        test("returns false when the resident does not exist", async () => {
            prisma.resident.findUnique.mockResolvedValue(null);

            await expect(
                residentRepository.exists("missing-id")
            ).resolves.toBe(false);

            expect(prisma.resident.findUnique).toHaveBeenCalledWith({
                where: { id: "missing-id" },
                select: { id: true },
            });
        });
    });

    describe("update", () => {
        test("updates a resident and includes related entities", async () => {
            const id = "resident-1";
            const data = { fullName: "Ali Updated" };
            const updated = { id, ...data };

            prisma.resident.update.mockResolvedValue(updated);

            const result = await residentRepository.update(id, data);

            expect(prisma.resident.update).toHaveBeenCalledWith({
                where: { id },
                data,
                include: EXPECTED_INCLUDE,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        test("deletes the resident by ID", async () => {
            const deleted = { id: "resident-1" };
            prisma.resident.delete.mockResolvedValue(deleted);

            const result = await residentRepository.delete("resident-1");

            expect(prisma.resident.delete).toHaveBeenCalledWith({
                where: { id: "resident-1" },
            });
            expect(result).toBe(deleted);
        });
    });
});
