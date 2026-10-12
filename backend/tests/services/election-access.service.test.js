jest.mock("../../src/config/prisma", () => ({
    ownership: {
        findMany: jest.fn(),
    },
}));

jest.mock("../../src/services/access.service", () => ({
    getCurrentUser: jest.fn(),
    getAccessibleComplexIds: jest.fn(),
    requireComplexAccess: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
    findByIdWithPerson: jest.fn(),
}));

const AppError = require("../../src/utils/AppError");
const prisma = require("../../src/config/prisma");
const accessService = require("../../src/services/access.service");
const userRepository = require("../../src/repositories/user.repository");
const electionAccessService =
    require("../../src/services/election-access.service");

const admin = { id: "admin-1", role: "ADMIN" };
const manager = { id: "manager-1", role: "MANAGER" };
const user = { id: "user-1", role: "USER" };

const activeAdmin = {
    id: "admin-1",
    role: "ADMIN",
    status: "ACTIVE",
};

const activeManager = {
    id: "manager-1",
    role: "MANAGER",
    status: "ACTIVE",
};

const activeUser = {
    id: "user-1",
    role: "USER",
    status: "ACTIVE",
};

const makeElection = (overrides = {}) => ({
    id: "election-1",
    complexId: "complex-1",
    status: "DRAFT",
    ...overrides,
});

const makeFullUser = (overrides = {}) => ({
    id: "user-1",
    status: "ACTIVE",
    person: {
        id: "person-1",
        status: "ACTIVE",
    },
    ...overrides,
});

describe("ElectionAccessService", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        accessService.getCurrentUser.mockResolvedValue(activeAdmin);
        accessService.getAccessibleComplexIds.mockResolvedValue([
            "complex-1",
        ]);
        accessService.requireComplexAccess.mockResolvedValue(undefined);

        userRepository.findByIdWithPerson.mockResolvedValue(
            makeFullUser()
        );

        prisma.ownership.findMany.mockResolvedValue([]);
    });

    describe("getReadableComplexIds", () => {
        test("returns an empty list for an inactive current user", async () => {
            accessService.getCurrentUser.mockResolvedValue({
                ...activeAdmin,
                status: "INACTIVE",
            });

            await expect(
                electionAccessService.getReadableComplexIds(admin)
            ).resolves.toEqual([]);

            expect(
                accessService.getAccessibleComplexIds
            ).not.toHaveBeenCalled();
            expect(
                userRepository.findByIdWithPerson
            ).not.toHaveBeenCalled();
        });

        test("returns null for an active ADMIN with global access", async () => {
            await expect(
                electionAccessService.getReadableComplexIds(admin)
            ).resolves.toBeNull();

            expect(
                accessService.getAccessibleComplexIds
            ).not.toHaveBeenCalled();
            expect(prisma.ownership.findMany).not.toHaveBeenCalled();
        });

        test("returns assigned complex IDs for an active MANAGER", async () => {
            const ids = ["complex-1", "complex-2"];

            accessService.getCurrentUser.mockResolvedValue(activeManager);
            accessService.getAccessibleComplexIds.mockResolvedValue(ids);

            await expect(
                electionAccessService.getReadableComplexIds(manager)
            ).resolves.toBe(ids);

            expect(
                accessService.getAccessibleComplexIds
            ).toHaveBeenCalledWith(manager);
            expect(
                userRepository.findByIdWithPerson
            ).not.toHaveBeenCalled();
        });

        test("returns an empty list for an unsupported role", async () => {
            accessService.getCurrentUser.mockResolvedValue({
                id: "auditor-1",
                role: "AUDITOR",
                status: "ACTIVE",
            });

            await expect(
                electionAccessService.getReadableComplexIds({
                    id: "auditor-1",
                })
            ).resolves.toEqual([]);

            expect(
                userRepository.findByIdWithPerson
            ).not.toHaveBeenCalled();
        });

        test("returns an empty list when the USER record is missing", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            userRepository.findByIdWithPerson.mockResolvedValue(null);

            await expect(
                electionAccessService.getReadableComplexIds(user)
            ).resolves.toEqual([]);
        });

        test("returns an empty list when the full user is inactive", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            userRepository.findByIdWithPerson.mockResolvedValue(
                makeFullUser({ status: "INACTIVE" })
            );

            await expect(
                electionAccessService.getReadableComplexIds(user)
            ).resolves.toEqual([]);
        });

        test("returns an empty list when the user has no person", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            userRepository.findByIdWithPerson.mockResolvedValue(
                makeFullUser({ person: null })
            );

            await expect(
                electionAccessService.getReadableComplexIds(user)
            ).resolves.toEqual([]);

            expect(prisma.ownership.findMany).not.toHaveBeenCalled();
        });

        test("returns an empty list when the linked person is inactive", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            userRepository.findByIdWithPerson.mockResolvedValue(
                makeFullUser({
                    person: {
                        id: "person-1",
                        status: "INACTIVE",
                    },
                })
            );

            await expect(
                electionAccessService.getReadableComplexIds(user)
            ).resolves.toEqual([]);

            expect(prisma.ownership.findMany).not.toHaveBeenCalled();
        });

        test("queries current ownerships and returns unique nonempty complex IDs", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            userRepository.findByIdWithPerson.mockResolvedValue(
                makeFullUser()
            );

            prisma.ownership.findMany.mockResolvedValue([
                { property: { complexId: "complex-1" } },
                { property: { complexId: "complex-2" } },
                { property: { complexId: "complex-1" } },
                { property: { complexId: null } },
                { property: null },
                {},
            ]);

            const result =
                await electionAccessService.getReadableComplexIds(user);

            expect(result).toEqual(["complex-1", "complex-2"]);
            expect(
                userRepository.findByIdWithPerson
            ).toHaveBeenCalledWith("user-1");

            const query = prisma.ownership.findMany.mock.calls[0][0];

            expect(query.where.personId).toBe("person-1");
            expect(query.where.percentage).toEqual({ gt: 0 });
            expect(query.where.startDate.lte).toBeInstanceOf(Date);
            expect(query.where.OR[0]).toEqual({ endDate: null });
            expect(query.where.OR[1].endDate.gt).toBeInstanceOf(Date);
            expect(query.select).toEqual({
                property: {
                    select: {
                        complexId: true,
                    },
                },
            });
        });

        test("returns an empty list when no qualifying ownerships exist", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);
            prisma.ownership.findMany.mockResolvedValue([]);

            await expect(
                electionAccessService.getReadableComplexIds(user)
            ).resolves.toEqual([]);
        });
    });

    describe("assertCanReadElection", () => {
        test("throws 404 when the election does not exist", async () => {
            await expect(
                electionAccessService.assertCanReadElection(admin, null)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(accessService.getCurrentUser).not.toHaveBeenCalled();
        });

        test("allows ADMIN to read a legacy election without complexId", async () => {
            await expect(
                electionAccessService.assertCanReadElection(
                    admin,
                    makeElection({ complexId: null })
                )
            ).resolves.toBe(true);
        });

        test("allows a user to read an election in an accessible complex", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);
            accessService.getAccessibleComplexIds.mockResolvedValue([
                "complex-1",
            ]);

            await expect(
                electionAccessService.assertCanReadElection(
                    manager,
                    makeElection()
                )
            ).resolves.toBe(true);
        });

        test("hides elections without a complexId from non-admin users", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);

            await expect(
                electionAccessService.assertCanReadElection(
                    manager,
                    makeElection({ complexId: null })
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });
        });

        test("hides elections belonging to inaccessible complexes", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);
            accessService.getAccessibleComplexIds.mockResolvedValue([
                "complex-other",
            ]);

            await expect(
                electionAccessService.assertCanReadElection(
                    manager,
                    makeElection({ complexId: "complex-1" })
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });
        });
    });

    describe("assertCanManageElection", () => {
        test("throws 404 when the election does not exist", async () => {
            await expect(
                electionAccessService.assertCanManageElection(admin, null)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Election not found.",
            });

            expect(accessService.getCurrentUser).not.toHaveBeenCalled();
        });

        test("rejects an inactive current user", async () => {
            accessService.getCurrentUser.mockResolvedValue({
                ...activeAdmin,
                status: "INACTIVE",
            });

            await expect(
                electionAccessService.assertCanManageElection(
                    admin,
                    makeElection()
                )
            ).rejects.toMatchObject({
                statusCode: 403,
                message: "Forbidden.",
            });

            expect(
                accessService.requireComplexAccess
            ).not.toHaveBeenCalled();
        });

        test("allows ADMIN to manage a legacy election without complexId", async () => {
            await expect(
                electionAccessService.assertCanManageElection(
                    admin,
                    makeElection({ complexId: null })
                )
            ).resolves.toBe(true);

            expect(
                accessService.requireComplexAccess
            ).not.toHaveBeenCalled();
        });

        test("rejects USER attempts to manage elections", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeUser);

            await expect(
                electionAccessService.assertCanManageElection(
                    user,
                    makeElection()
                )
            ).rejects.toMatchObject({
                statusCode: 403,
                message: "Forbidden.",
            });

            expect(
                accessService.requireComplexAccess
            ).not.toHaveBeenCalled();
        });

        test("rejects MANAGER when the election has no complex assigned", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);

            await expect(
                electionAccessService.assertCanManageElection(
                    manager,
                    makeElection({ complexId: null })
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "Election must be assigned to a Complex before it can be managed.",
            });

            expect(
                accessService.requireComplexAccess
            ).not.toHaveBeenCalled();
        });

        test("allows MANAGER when complex access is granted", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);

            await expect(
                electionAccessService.assertCanManageElection(
                    manager,
                    makeElection({ complexId: "complex-1" })
                )
            ).resolves.toBe(true);

            expect(
                accessService.requireComplexAccess
            ).toHaveBeenCalledWith(manager, "complex-1");
        });

        test("propagates a MANAGER complex access denial", async () => {
            accessService.getCurrentUser.mockResolvedValue(activeManager);
            const error = new AppError("Forbidden.", 403);

            accessService.requireComplexAccess.mockRejectedValue(error);

            await expect(
                electionAccessService.assertCanManageElection(
                    manager,
                    makeElection({ complexId: "complex-1" })
                )
            ).rejects.toBe(error);
        });
    });
});
