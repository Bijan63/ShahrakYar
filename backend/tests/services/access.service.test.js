jest.mock("../../src/repositories/complexManager.repository", () => ({
    findByUserAndComplex: jest.fn(),
    findByUserId: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
    findById: jest.fn(),
}));

const accessService = require("../../src/services/access.service");
const userRepository = require("../../src/repositories/user.repository");
const complexManagerRepository = require("../../src/repositories/complexManager.repository");

describe("AccessService", () => {
    const userId = "user-1";
    const complexA = "complex-A";
    const complexB = "complex-B";

    const makeUser = (overrides = {}) => ({
        id: userId,
        role: "MANAGER",
        status: "ACTIVE",
        ...overrides,
    });

    beforeEach(() => {
        jest.clearAllMocks();
        userRepository.findById.mockResolvedValue(makeUser());
        complexManagerRepository.findByUserAndComplex.mockResolvedValue(null);
        complexManagerRepository.findByUserId.mockResolvedValue([]);
    });

    test("rejects a missing user with 401", async () => {
        await expect(
            accessService.canAccessComplex(null, complexA)
        ).rejects.toMatchObject({
            message: "Unauthorized.",
            statusCode: 401,
        });

        expect(userRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a user who no longer exists with 401", async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "MANAGER" },
                complexA
            )
        ).rejects.toMatchObject({
            message: "Unauthorized.",
            statusCode: 401,
        });
    });

    test("allows an active ADMIN access to any complex", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ role: "ADMIN" })
        );

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "ADMIN" },
                complexB
            )
        ).resolves.toBe(true);

        expect(
            complexManagerRepository.findByUserAndComplex
        ).not.toHaveBeenCalled();
    });

    test("denies an inactive ADMIN access", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ role: "ADMIN", status: "INACTIVE" })
        );

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "ADMIN" },
                complexA
            )
        ).resolves.toBe(false);
    });

    test("allows a MANAGER to access an assigned complex", async () => {
        complexManagerRepository.findByUserAndComplex.mockResolvedValue({
            id: "assignment-1",
            userId,
            complexId: complexA,
        });

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "MANAGER" },
                complexA
            )
        ).resolves.toBe(true);

        expect(
            complexManagerRepository.findByUserAndComplex
        ).toHaveBeenCalledWith(userId, complexA);
    });

    test("denies a MANAGER access to an unassigned complex", async () => {
        complexManagerRepository.findByUserAndComplex.mockResolvedValue(null);

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "MANAGER" },
                complexB
            )
        ).resolves.toBe(false);
    });

    test("denies access to an inactive MANAGER", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ status: "BLOCKED" })
        );

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "MANAGER" },
                complexA
            )
        ).resolves.toBe(false);

        expect(
            complexManagerRepository.findByUserAndComplex
        ).not.toHaveBeenCalled();
    });

    test("denies a USER complex-level access", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ role: "USER" })
        );

        await expect(
            accessService.canAccessComplex(
                { id: userId, role: "USER" },
                complexA
            )
        ).resolves.toBe(false);

        expect(
            complexManagerRepository.findByUserAndComplex
        ).not.toHaveBeenCalled();
    });

    test("returns null for an ADMIN's accessible complex IDs", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ role: "ADMIN" })
        );

        await expect(
            accessService.getAccessibleComplexIds({
                id: userId,
                role: "ADMIN",
            })
        ).resolves.toBeNull();

        expect(
            complexManagerRepository.findByUserId
        ).not.toHaveBeenCalled();
    });

    test("returns assigned complex IDs for a MANAGER", async () => {
        complexManagerRepository.findByUserId.mockResolvedValue([
            { complex: { id: complexA } },
            { complex: { id: complexB } },
        ]);

        await expect(
            accessService.getAccessibleComplexIds({
                id: userId,
                role: "MANAGER",
            })
        ).resolves.toEqual([complexA, complexB]);
    });

    test("returns an empty list for an inactive MANAGER", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ status: "INACTIVE" })
        );

        await expect(
            accessService.getAccessibleComplexIds({
                id: userId,
                role: "MANAGER",
            })
        ).resolves.toEqual([]);

        expect(
            complexManagerRepository.findByUserId
        ).not.toHaveBeenCalled();
    });

    test("requireComplexAccess throws 403 when access is denied", async () => {
        complexManagerRepository.findByUserAndComplex.mockResolvedValue(null);

        await expect(
            accessService.requireComplexAccess(
                { id: userId, role: "MANAGER" },
                complexB
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });
    });

    test("requireComplexAccess resolves true when access is allowed", async () => {
        userRepository.findById.mockResolvedValue(
            makeUser({ role: "ADMIN" })
        );

        await expect(
            accessService.requireComplexAccess(
                { id: userId, role: "ADMIN" },
                complexB
            )
        ).resolves.toBe(true);
    });

    describe("requireUnitAccountComplexAccess", () => {
        const manager = { id: userId, role: "MANAGER" };

        test("allows ADMIN through a unit's building", async () => {
            userRepository.findById.mockResolvedValue(
                makeUser({ role: "ADMIN" })
            );

            const account = {
                id: "account-1",
                unit: {
                    building: { complexId: complexA },
                    property: null,
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    { id: userId, role: "ADMIN" },
                    account
                )
            ).resolves.toBe(true);

            expect(
                complexManagerRepository.findByUserAndComplex
            ).not.toHaveBeenCalled();
        });

        test("allows an assigned MANAGER through a unit's property", async () => {
            complexManagerRepository.findByUserAndComplex.mockResolvedValue({
                id: "assignment-1",
                userId,
                complexId: complexA,
            });

            const account = {
                id: "account-2",
                unit: {
                    building: null,
                    property: { complexId: complexA },
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    manager,
                    account
                )
            ).resolves.toBe(true);

            expect(
                complexManagerRepository.findByUserAndComplex
            ).toHaveBeenCalledWith(userId, complexA);
        });

        test("rejects a MANAGER who is not assigned to the account's complex", async () => {
            const account = {
                id: "account-3",
                unit: {
                    building: { complexId: complexB },
                    property: null,
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    manager,
                    account
                )
            ).rejects.toMatchObject({
                message: "Forbidden.",
                statusCode: 403,
            });
        });

        test("rejects an account with no associated unit", async () => {
            await expect(
                accessService.requireUnitAccountComplexAccess(
                    manager,
                    { id: "account-4" }
                )
            ).rejects.toMatchObject({
                message: "Unit account or associated unit not found.",
                statusCode: 404,
            });
        });

        test("rejects a unit whose complex cannot be determined", async () => {
            const account = {
                id: "account-5",
                unit: {
                    building: null,
                    property: null,
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    manager,
                    account
                )
            ).rejects.toMatchObject({
                message:
                    "Unable to determine the complex for this unit account.",
                statusCode: 403,
            });

            expect(userRepository.findById).not.toHaveBeenCalled();
        });

        test("rejects a unit linked to different complexes", async () => {
            const account = {
                id: "account-6",
                unit: {
                    building: { complexId: complexA },
                    property: { complexId: complexB },
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    manager,
                    account
                )
            ).rejects.toMatchObject({
                message: "Unit account is linked to different complexes.",
                statusCode: 403,
            });

            expect(userRepository.findById).not.toHaveBeenCalled();
        });

        test("denies a USER access to a unit account", async () => {
            userRepository.findById.mockResolvedValue(
                makeUser({ role: "USER" })
            );

            const account = {
                id: "account-7",
                unit: {
                    building: { complexId: complexA },
                    property: null,
                },
            };

            await expect(
                accessService.requireUnitAccountComplexAccess(
                    { id: userId, role: "USER" },
                    account
                )
            ).rejects.toMatchObject({
                message: "Forbidden.",
                statusCode: 403,
            });
        });
    });

});
