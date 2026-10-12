jest.mock("../../src/services/chargePayment.service", () => ({
    createPayment: jest.fn(),
    getPayments: jest.fn(),
    getPaymentById: jest.fn(),
    getPaymentsByCharge: jest.fn(),
    getPaymentsByUnitAccount: jest.fn(),
}));

const chargePaymentService =
    require("../../src/services/chargePayment.service");

const controller =
    require("../../src/controllers/chargePayment.controller");

function makeResponse() {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    };

    res.status.mockReturnValue(res);
    return res;
}

const user = {
    id: "payment-controller-test-user",
    role: "ADMIN",
};

beforeEach(() => {
    jest.resetAllMocks();
});

describe("ChargePaymentController createPayment", () => {
    test("returns 201 with payment, journal entry and charge", async () => {
        const req = {
            body: { amount: 500 },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();

        const result = {
            payment: { id: "payment-1", amount: 500 },
            journalEntry: { id: "entry-1", status: "POSTED" },
            charge: { id: "charge-1", status: "PARTIALLY_PAID" },
        };

        chargePaymentService.createPayment.mockResolvedValue(result);

        await controller.createPayment(req, res, next);

        expect(chargePaymentService.createPayment).toHaveBeenCalledWith(
            req.body,
            user
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Charge payment created successfully",
            payment: result.payment,
            journalEntry: result.journalEntry,
            charge: result.charge,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentController getPayments", () => {
    test("returns all payments using query filters", async () => {
        const req = {
            query: { page: "1", limit: "20" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const payments = [{ id: "payment-1" }, { id: "payment-2" }];

        chargePaymentService.getPayments.mockResolvedValue(payments);

        await controller.getPayments(req, res, next);

        expect(chargePaymentService.getPayments).toHaveBeenCalledWith(
            req.query,
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            payments,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentController getPaymentById", () => {
    test("returns the payment for the requested ID", async () => {
        const req = {
            params: { id: "payment-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const payment = { id: "payment-1", amount: 500 };

        chargePaymentService.getPaymentById.mockResolvedValue(payment);

        await controller.getPaymentById(req, res, next);

        expect(chargePaymentService.getPaymentById).toHaveBeenCalledWith(
            "payment-1",
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            payment,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentController getPaymentsByCharge", () => {
    test("returns payments belonging to the requested charge", async () => {
        const req = {
            params: { chargeId: "charge-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const payments = [{ id: "payment-1", chargeId: "charge-1" }];

        chargePaymentService.getPaymentsByCharge.mockResolvedValue(payments);

        await controller.getPaymentsByCharge(req, res, next);

        expect(chargePaymentService.getPaymentsByCharge).toHaveBeenCalledWith(
            "charge-1",
            user
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            payments,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentController getPaymentsByUnitAccount", () => {
    test("returns payments belonging to the requested unit account", async () => {
        const req = {
            params: { unitAccountId: "unit-account-1" },
            user,
        };
        const res = makeResponse();
        const next = jest.fn();
        const payments = [
            { id: "payment-1", unitAccountId: "unit-account-1" },
        ];

        chargePaymentService.getPaymentsByUnitAccount.mockResolvedValue(
            payments
        );

        await controller.getPaymentsByUnitAccount(req, res, next);

        expect(
            chargePaymentService.getPaymentsByUnitAccount
        ).toHaveBeenCalledWith("unit-account-1", user);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            payments,
        });
        expect(next).not.toHaveBeenCalled();
    });
});

describe("ChargePaymentController error propagation", () => {
    test.each([
        [
            "createPayment",
            (req, res, next) =>
                controller.createPayment(req, res, next),
        ],
        [
            "getPayments",
            (req, res, next) =>
                controller.getPayments(req, res, next),
        ],
        [
            "getPaymentById",
            (req, res, next) =>
                controller.getPaymentById(req, res, next),
        ],
        [
            "getPaymentsByCharge",
            (req, res, next) =>
                controller.getPaymentsByCharge(req, res, next),
        ],
        [
            "getPaymentsByUnitAccount",
            (req, res, next) =>
                controller.getPaymentsByUnitAccount(req, res, next),
        ],
    ])("%s forwards service errors to next(error)", async (
        serviceMethod,
        invoke
    ) => {
        const req = {
            body: { amount: 500 },
            query: { page: "1" },
            params: {
                id: "payment-1",
                chargeId: "charge-1",
                unitAccountId: "unit-account-1",
            },
            user,
        };

        const res = makeResponse();
        const next = jest.fn();
        const error = new Error(`Failure in ${serviceMethod}`);

        chargePaymentService[serviceMethod].mockRejectedValue(error);

        await invoke(req, res, next);

        expect(chargePaymentService[serviceMethod]).toHaveBeenCalled();
        expect(next).toHaveBeenCalledWith(error);
        expect(res.json).not.toHaveBeenCalled();
    });
});
