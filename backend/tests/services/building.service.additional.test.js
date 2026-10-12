jest.mock("../../src/repositories/building.repository", () => ({
    createBuilding: jest.fn(),
    getBuildings: jest.fn(),
    getBuildingById: jest.fn(),
    updateBuilding: jest.fn(),
    deleteBuilding: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    getAccessibleComplexIds: jest.fn(),
    requireComplexAccess: jest.fn(),
}));

const buildingRepository =
    require("../../src/repositories/building.repository");

const accessService =
    require("../../src/services/access.service");

const buildingService =
    require("../../src/services/building.service");

const buildingId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

const admin = {
    id: "admin-1",
    role: "ADMIN",
};

const existingBuilding = {
    id: buildingId,
    name: "Building A",
    complexId: "a47ac10b-58cc-4372-a567-0e02b2c3d479",
};

describe("Building service additional error paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        buildingRepository.getBuildingById.mockResolvedValue(
            existingBuilding
        );

        accessService.requireComplexAccess.mockResolvedValue(true);
    });

    test("converts Prisma P2003 during update to a 404 AppError", async () => {
        const prismaError = new Error("Foreign key constraint failed");
        prismaError.code = "P2003";

        buildingRepository.updateBuilding.mockRejectedValue(
            prismaError
        );

        await expect(
            buildingService.updateBuilding(
                buildingId,
                { name: "Updated Building" },
                admin
            )
        ).rejects.toMatchObject({
            message: "Complex not found.",
            statusCode: 404,
        });

        expect(
            buildingRepository.getBuildingById
        ).toHaveBeenCalledWith(buildingId);

        expect(
            buildingRepository.updateBuilding
        ).toHaveBeenCalledWith(
            buildingId,
            { name: "Updated Building" }
        );
    });

    test("rethrows unexpected database errors during update", async () => {
        const databaseError = new Error(
            "Unexpected database failure"
        );

        buildingRepository.updateBuilding.mockRejectedValue(
            databaseError
        );

        await expect(
            buildingService.updateBuilding(
                buildingId,
                { name: "Updated Building" },
                admin
            )
        ).rejects.toBe(databaseError);
    });

    test("rejects an invalid building ID before deleting", async () => {
        await expect(
            buildingService.deleteBuilding(
                "not-a-valid-uuid",
                admin
            )
        ).rejects.toMatchObject({
            message: "Invalid building ID. Must be a valid UUID.",
            statusCode: 400,
        });

        expect(
            buildingRepository.getBuildingById
        ).not.toHaveBeenCalled();

        expect(
            buildingRepository.deleteBuilding
        ).not.toHaveBeenCalled();
    });

    test("passes address and description to the repository during update", async () => {
        const updatedBuilding = {
            ...existingBuilding,
            address: "Test Address",
            description: "Updated description",
        };

        buildingRepository.updateBuilding.mockResolvedValue(
            updatedBuilding
        );

        const result = await buildingService.updateBuilding(
            buildingId,
            {
                address: "Test Address",
                description: "Updated description",
            },
            admin
        );

        expect(
            buildingRepository.updateBuilding
        ).toHaveBeenCalledWith(buildingId, {
            address: "Test Address",
            description: "Updated description",
        });

        expect(result).toEqual(updatedBuilding);
    });

    test("converts Prisma P2002 during update to a 409 AppError", async () => {
        const prismaError = new Error("Unique constraint failed");
        prismaError.code = "P2002";

        buildingRepository.updateBuilding.mockRejectedValue(
            prismaError
        );

        await expect(
            buildingService.updateBuilding(
                buildingId,
                { name: "Duplicate Building" },
                admin
            )
        ).rejects.toMatchObject({
            message: "Building already exists.",
            statusCode: 409,
        });
    });

    test("deletes an accessible building successfully", async () => {
        buildingRepository.deleteBuilding.mockResolvedValue(
            existingBuilding
        );

        const result = await buildingService.deleteBuilding(
            buildingId,
            admin
        );

        expect(
            buildingRepository.getBuildingById
        ).toHaveBeenCalledWith(buildingId);

        expect(
            accessService.requireComplexAccess
        ).toHaveBeenCalledWith(
            admin,
            existingBuilding.complexId
        );

        expect(
            buildingRepository.deleteBuilding
        ).toHaveBeenCalledWith(buildingId);

        expect(result).toEqual(existingBuilding);
    });
});
