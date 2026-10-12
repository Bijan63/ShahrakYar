jest.mock("../../src/services/unitAccount.service", () => ({
    createUnitAccount: jest.fn(),
    getUnitAccounts: jest.fn(),
    getUnitAccountById: jest.fn(),
    getUnitAccountByUnitId: jest.fn(),
    updateUnitAccount: jest.fn(),
    deleteUnitAccount: jest.fn(),
}));

const unitAccountService =
    require("../../src/services/unitAccount.service");

const controller =
    require("../../src/controllers/unitAccount.controller");

function makeResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    };

    res.status.mockReturnValue(res);
    return res;
}

const user = {
    id: "unit-account-controller-test-user",
    role: "ADMIN",
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe("UnitAccountController createUnitAccount", () => {
    test("creates an account and returns HTTP 201", async () => {
        const req = {
            body: {
                unitId: "unit-1",
                code: "UNIT-001-ACCOUNT",
            },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const account = {
            id: "account-1",
            code: "UNIT-001-ACCOUNT",
        };

        unitAccountService.createUnitAccount.mockResolvedValue(account);

        await controller.createUnitAccount(req, res, next);

        expect(unitAccountService.createUnitAccount).toHaveBeenCalledWith(
            req.body,
            user
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Unit account created successfully",
            unitAccount: account,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController getUnitAccounts", () => {
    test("returns the accessible unit accounts", async () => {
        const req = { user };
        const res = makeResponse();
        const next = jest.fn();
        const accounts = [
            { id: "account-1" },
            { id: "account-2" },
        ];

        unitAccountService.getUnitAccounts.mockResolvedValue(accounts);

        await controller.getUnitAccounts(req, res, next);

        expect(unitAccountService.getUnitAccounts).toHaveBeenCalledWith(user);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            unitAccounts: accounts,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController getUnitAccountById", () => {
    test("returns the requested unit account", async () => {
        const req = {
            params: { id: "account-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const account = { id: "account-1" };

        unitAccountService.getUnitAccountById.mockResolvedValue(account);

        await controller.getUnitAccountById(req, res, next);

        expect(unitAccountService.getUnitAccountById).toHaveBeenCalledWith(
            "account-1",
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            unitAccount: account,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController getUnitAccountByUnitId", () => {
    test("returns the account associated with the requested unit", async () => {
        const req = {
            params: { unitId: "unit-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const account = {
            id: "account-1",
            unitId: "unit-1",
        };

        unitAccountService.getUnitAccountByUnitId.mockResolvedValue(account);

        await controller.getUnitAccountByUnitId(req, res, next);

        expect(
            unitAccountService.getUnitAccountByUnitId
        ).toHaveBeenCalledWith("unit-1", user);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            unitAccount: account,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController updateUnitAccount", () => {
    test("updates the account and returns HTTP 200", async () => {
        const req = {
            params: { id: "account-1" },
            body: { title: "Updated account title" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const account = {
            id: "account-1",
            title: "Updated account title",
        };

        unitAccountService.updateUnitAccount.mockResolvedValue(account);

        await controller.updateUnitAccount(req, res, next);

        expect(unitAccountService.updateUnitAccount).toHaveBeenCalledWith(
            "account-1",
            req.body,
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Unit account updated successfully",
            unitAccount: account,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController deleteUnitAccount", () => {
    test("deletes the account and returns the deleted account", async () => {
        const req = {
            params: { id: "account-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const account = { id: "account-1" };

        unitAccountService.deleteUnitAccount.mockResolvedValue(account);

        await controller.deleteUnitAccount(req, res, next);

        expect(unitAccountService.deleteUnitAccount).toHaveBeenCalledWith(
            "account-1",
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Unit account deleted successfully",
            unitAccount: account,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("UnitAccountController error propagation", () => {
    test.each([
        [
            "createUnitAccount",
            (req, res, next) =>
                controller.createUnitAccount(req, res, next),
        ],
        [
            "getUnitAccounts",
            (req, res, next) =>
                controller.getUnitAccounts(req, res, next),
        ],
        [
            "getUnitAccountById",
            (req, res, next) =>
                controller.getUnitAccountById(req, res, next),
        ],
        [
            "getUnitAccountByUnitId",
            (req, res, next) =>
                controller.getUnitAccountByUnitId(req, res, next),
        ],
        [
            "updateUnitAccount",
            (req, res, next) =>
                controller.updateUnitAccount(req, res, next),
        ],
        [
            "deleteUnitAccount",
            (req, res, next) =>
                controller.deleteUnitAccount(req, res, next),
        ],
    ])("%s forwards service errors to next(error)", async (
        serviceMethod,
        invoke
    ) => {
        const req = {
            params: {
                id: "account-1",
                unitId: "unit-1",
            },
            body: { code: "UNIT-001-ACCOUNT" },
            user,
        };

        const res = makeResponse();
        const next = jest.fn();
        const error = new Error(`Failure in ${serviceMethod}`);

        unitAccountService[serviceMethod].mockRejectedValue(error);

        await invoke(req, res, next);

        expect(unitAccountService[serviceMethod]).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
