jest.mock("../../src/config/prisma", () => ({
    ownership: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
}));

const prisma = require("../../src/config/prisma");
const ownershipRepository =
    require("../../src/repositories/ownership.repository");

describe("OwnershipRepository.buildComplexScope", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("allows global scope only when null is explicit", () => {
        expect(
            ownershipRepository.buildComplexScope(null)
        ).toEqual({});
    });

    test("restricts scope to the supplied complex IDs", () => {
        expect(
            ownershipRepository.buildComplexScope([
                "complex-A",
                "complex-B",
            ])
        ).toEqual({
            property: {
                complexId: {
                    in: ["complex-A", "complex-B"],
                },
            },
        });
    });

    test("an empty complex ID array grants access to no complexes", () => {
        expect(
            ownershipRepository.buildComplexScope([])
        ).toEqual({
            property: {
                complexId: {
                    in: [],
                },
            },
        });
    });

    test.each([
        undefined,
        "complex-A",
        {},
        42,
        false,
    ])("rejects invalid scope input: %p", (complexIds) => {
        expect(() =>
            ownershipRepository.buildComplexScope(complexIds)
        ).toThrow(TypeError);
    });

    test("getOwnerships fails closed when scope is omitted", async () => {
        await expect(
            ownershipRepository.getOwnerships()
        ).rejects.toThrow(
            "complexIds must be null or an array."
        );

        expect(prisma.ownership.findMany).not.toHaveBeenCalled();
    });

    test("getOwnershipById fails closed when scope is omitted", async () => {
        await expect(
            ownershipRepository.getOwnershipById("ownership-1")
        ).rejects.toThrow(
            "complexIds must be null or an array."
        );

        expect(prisma.ownership.findFirst).not.toHaveBeenCalled();
    });

    test("getOwnershipHistory fails closed when scope is omitted", async () => {
        await expect(
            ownershipRepository.getOwnershipHistory(
                new Date("2026-01-01T00:00:00.000Z"),
                new Date("2026-01-31T00:00:00.000Z")
            )
        ).rejects.toThrow(
            "complexIds must be null or an array."
        );

        expect(prisma.ownership.findMany).not.toHaveBeenCalled();
    });

    test("getOwnershipChanges fails closed when scope is omitted", async () => {
        await expect(
            ownershipRepository.getOwnershipChanges(
                new Date("2026-01-01T00:00:00.000Z"),
                new Date("2026-01-31T00:00:00.000Z")
            )
        ).rejects.toThrow(
            "complexIds must be null or an array."
        );

        expect(prisma.ownership.findMany).not.toHaveBeenCalled();
    });

    test("preserves explicit global scope in getOwnerships", async () => {
        prisma.ownership.findMany.mockResolvedValue([]);

        await ownershipRepository.getOwnerships(null);

        expect(prisma.ownership.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {},
            })
        );
    });

    test("preserves an empty scope as an empty allowlist", async () => {
        prisma.ownership.findMany.mockResolvedValue([]);

        await ownershipRepository.getOwnerships([]);

        expect(prisma.ownership.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    property: {
                        complexId: {
                            in: [],
                        },
                    },
                },
            })
        );
    });

    test("internal lookup retrieves a record for a subsequent access check", async () => {
        const ownership = {
            id: "ownership-1",
            property: {
                complexId: "complex-A",
            },
        };

        prisma.ownership.findFirst.mockResolvedValue(ownership);

        await expect(
            ownershipRepository.getOwnershipByIdForAccessCheck(
                "ownership-1"
            )
        ).resolves.toBe(ownership);

        expect(prisma.ownership.findFirst).toHaveBeenCalledWith({
            where: {
                id: "ownership-1",
            },
            include: {
                property: true,
                person: true,
            },
        });
    });
});
