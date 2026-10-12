jest.mock("../../src/services/charge.service", () => ({
    createCharge: jest.fn(),
    getCharges: jest.fn(),
    getChargeById: jest.fn(),
    getChargesByUnitAccount: jest.fn(),
    updateCharge: jest.fn(),
    cancelCharge: jest.fn(),
    deleteCharge: jest.fn(),
}));

const chargeService = require("../../src/services/charge.service");
const controller = require("../../src/controllers/charge.controller");

function makeResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    };

    res.status.mockReturnValue(res);

    return res;
}

const user = {
    id: "controller-test-user",
    role: "ADMIN",
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe("ChargeController createCharge", () => {
    test("returns 201 with the charge and journal entry", async () => {
        const req = {
            body: { description: "Test charge" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();

        const result = {
            charge: { id: "charge-1", status: "ISSUED" },
            journalEntry: { id: "entry-1", status: "POSTED" },
        };

        chargeService.createCharge.mockResolvedValue(result);

        await controller.createCharge(req, res, next);

        expect(chargeService.createCharge).toHaveBeenCalledWith(
            req.body,
            user
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Charge created successfully",
            charge: result.charge,
            journalEntry: result.journalEntry,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController getCharges", () => {
    test("returns the charges", async () => {
        const req = { user };
        const res = makeResponse();
        const next = jest.fn();
        const charges = [{ id: "charge-1" }, { id: "charge-2" }];

        chargeService.getCharges.mockResolvedValue(charges);

        await controller.getCharges(req, res, next);

        expect(chargeService.getCharges).toHaveBeenCalledWith(user);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            charges,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController getChargeById", () => {
    test("returns the requested charge", async () => {
        const req = {
            params: { id: "charge-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const charge = { id: "charge-1" };

        chargeService.getChargeById.mockResolvedValue(charge);

        await controller.getChargeById(req, res, next);

        expect(chargeService.getChargeById).toHaveBeenCalledWith(
            "charge-1",
            user
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            charge,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController getChargesByUnitAccount", () => {
    test("returns charges for the requested unit account", async () => {
        const req = {
            params: { unitAccountId: "unit-account-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const charges = [{ id: "charge-1" }];

        chargeService.getChargesByUnitAccount.mockResolvedValue(charges);

        await controller.getChargesByUnitAccount(req, res, next);

        expect(chargeService.getChargesByUnitAccount).toHaveBeenCalledWith(
            "unit-account-1",
            user
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            charges,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController updateCharge", () => {
    test("updates a charge and returns the result", async () => {
        const req = {
            params: { id: "charge-1" },
            body: { description: "Updated charge" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const charge = { id: "charge-1", description: "Updated charge" };

        chargeService.updateCharge.mockResolvedValue(charge);

        await controller.updateCharge(req, res, next);

        expect(chargeService.updateCharge).toHaveBeenCalledWith(
            "charge-1",
            req.body,
            user
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Charge updated successfully",
            charge,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController cancelCharge", () => {
    test("cancels a charge and returns the result", async () => {
        const req = {
            params: { id: "charge-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const charge = { id: "charge-1", status: "CANCELLED" };

        chargeService.cancelCharge.mockResolvedValue(charge);

        await controller.cancelCharge(req, res, next);

        expect(chargeService.cancelCharge).toHaveBeenCalledWith(
            "charge-1",
            user
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Charge cancelled successfully",
            charge,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController deleteCharge", () => {
    test("deletes a charge and returns a success response", async () => {
        const req = {
            params: { id: "charge-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();

        chargeService.deleteCharge.mockResolvedValue(undefined);

        await controller.deleteCharge(req, res, next);

        expect(chargeService.deleteCharge).toHaveBeenCalledWith(
            "charge-1",
            user
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Charge deleted successfully",
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargeController error propagation", () => {
    test.each([
        [
            "createCharge",
            "createCharge",
            (req, res, next) => controller.createCharge(req, res, next),
        ],
        [
            "getCharges",
            "getCharges",
            (req, res, next) => controller.getCharges(req, res, next),
        ],
        [
            "getChargeById",
            "getChargeById",
            (req, res, next) => controller.getChargeById(req, res, next),
        ],
        [
            "getChargesByUnitAccount",
            "getChargesByUnitAccount",
            (req, res, next) =>
                controller.getChargesByUnitAccount(req, res, next),
        ],
        [
            "updateCharge",
            "updateCharge",
            (req, res, next) => controller.updateCharge(req, res, next),
        ],
        [
            "cancelCharge",
            "cancelCharge",
            (req, res, next) => controller.cancelCharge(req, res, next),
        ],
        [
            "deleteCharge",
            "deleteCharge",
            (req, res, next) => controller.deleteCharge(req, res, next),
        ],
    ])("%s forwards service errors to next(error)", async (
        _label,
        serviceMethod,
        invoke
    ) => {
        const req = {
            params: {
                id: "charge-1",
                unitAccountId: "unit-account-1",
            },
            body: { description: "Test" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const error = new Error(`Failure in ${serviceMethod}`);

        chargeService[serviceMethod].mockRejectedValue(error);

        await invoke(req, res, next);

        expect(chargeService[serviceMethod]).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
