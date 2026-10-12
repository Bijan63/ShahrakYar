jest.mock("../../src/services/unit.service", () => ({
    getUnits: jest.fn(),
    getUnitById: jest.fn(),
    deleteUnit: jest.fn(),
}));

jest.mock("../../src/mappers/unit.mapper", () => ({
    unitMapper: jest.fn((unit) => ({
        id: unit.id,
        mapped: true,
    })),
}));

const unitService = require("../../src/services/unit.service");
const { unitMapper } = require("../../src/mappers/unit.mapper");
const unitController = require("../../src/controllers/unit.controller");

function makeResponse() {
    const res = {};

    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);

    return res;
}

describe("Unit controller uncovered paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("forwards getUnits errors to next", async () => {
        const error = new Error("Units list failed");
        unitService.getUnits.mockRejectedValue(error);

        const req = {
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await unitController.getUnits(req, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });

    test("returns a mapped unit when getUnitById succeeds", async () => {
        const unit = { id: "unit-1", unitNumber: "101" };

        unitService.getUnitById.mockResolvedValue(unit);

        const req = {
            params: { id: "unit-1" },
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await unitController.getUnitById(req, res, next);

        expect(unitService.getUnitById).toHaveBeenCalledWith(
            "unit-1",
            req.user
        );

        expect(unitMapper).toHaveBeenCalledWith(unit);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            unit: {
                id: "unit-1",
                mapped: true,
            },
        });

        expect(next).not.toHaveBeenCalled();
    });

    test("forwards deleteUnit errors to next", async () => {
        const error = new Error("Unit deletion failed");
        unitService.deleteUnit.mockRejectedValue(error);

        const req = {
            params: { id: "unit-1" },
            user: { id: "admin-1", role: "ADMIN" },
        };

        const res = makeResponse();
        const next = jest.fn();

        await unitController.deleteUnit(req, res, next);

        expect(unitService.deleteUnit).toHaveBeenCalledWith(
            "unit-1",
            req.user
        );

        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
