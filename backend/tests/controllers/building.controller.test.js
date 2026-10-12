jest.mock("../../src/services/building.service", () => ({
    getBuildings: jest.fn(),
    getBuildingById: jest.fn(),
    deleteBuilding: jest.fn(),
}));

jest.mock("../../src/mappers/building.mapper", () => ({
    buildingMapper: jest.fn((building) => ({
        id: building.id,
        mapped: true,
    })),
}));

const buildingService =
    require("../../src/services/building.service");

const { buildingMapper } =
    require("../../src/mappers/building.mapper");

const buildingController =
    require("../../src/controllers/building.controller");

function makeResponse() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

describe("Building controller uncovered paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("forwards getBuildings errors to next", async () => {
        const error = new Error("Buildings list failed");

        buildingService.getBuildings.mockRejectedValue(error);

        const req = {
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await buildingController.getBuildings(req, res, next);

        expect(buildingService.getBuildings).toHaveBeenCalledWith(
            req.user
        );

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });

    test("returns a mapped building when getBuilding succeeds", async () => {
        const building = {
            id: "building-1",
            name: "Building A",
        };

        buildingService.getBuildingById.mockResolvedValue(building);

        const req = {
            params: { id: "building-1" },
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await buildingController.getBuilding(req, res, next);

        expect(buildingService.getBuildingById).toHaveBeenCalledWith(
            "building-1",
            req.user
        );

        expect(buildingMapper).toHaveBeenCalledWith(building);
        expect(res.status).toHaveBeenCalledWith(200);

        expect(res.json).toHaveBeenCalledWith({
            success: true,
            building: {
                id: "building-1",
                mapped: true,
            },
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("forwards deleteBuilding errors to next", async () => {
        const error = new Error("Building deletion failed");

        buildingService.deleteBuilding.mockRejectedValue(error);

        const req = {
            params: { id: "building-1" },
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await buildingController.deleteBuilding(req, res, next);

        expect(buildingService.deleteBuilding).toHaveBeenCalledWith(
            "building-1",
            req.user
        );

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
