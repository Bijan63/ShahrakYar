
const test = require("node:test");
const assert = require("node:assert/strict");

const fiscalPeriodService = require("../src/services/fiscalPeriod.service");
const controller = require("../src/controllers/fiscalPeriod.controller");

// ======================================================
// Test Helpers
// ======================================================

const createResponse = () => {
    const res = {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };

    return res;
};

const runController = async (
    serviceMethod,
    serviceImplementation,
    controllerMethod,
    req = {}
) => {
    const originalServiceMethod = fiscalPeriodService[serviceMethod];
    const originalConsoleError = console.error;

    fiscalPeriodService[serviceMethod] = serviceImplementation;
    console.error = () => {};

    const res = createResponse();

    try {
        await controller[controllerMethod](req, res);
        return res;
    } finally {
        fiscalPeriodService[serviceMethod] = originalServiceMethod;
        console.error = originalConsoleError;
    }
};

// ======================================================
// GET Fiscal Periods
// ======================================================

test("GET fiscal periods returns 200", async () => {
    const data = [{ id: "period-1", code: "1405" }];

    const res = await runController(
        "getAll",
        async () => data,
        "getFiscalPeriods"
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, data);
});

// ======================================================
// GET Fiscal Period By ID
// ======================================================

test("GET fiscal period by ID returns 200", async () => {
    const data = { id: "period-1", code: "1405" };

    const res = await runController(
        "getById",
        async (id) => {
            assert.equal(id, "period-1");
            return data;
        },
        "getFiscalPeriodById",
        { params: { id: "period-1" } }
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, data);
});

test("GET fiscal period by ID returns 404 when not found", async () => {
    const res = await runController(
        "getById",
        async () => {
            throw new Error("Fiscal period not found");
        },
        "getFiscalPeriodById",
        { params: { id: "missing" } }
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.success, false);
});

// ======================================================
// GET Fiscal Period By Code
// ======================================================

test("GET fiscal period by code returns 200", async () => {
    const data = { id: "period-1", code: "1405" };

    const res = await runController(
        "getByCode",
        async (code) => {
            assert.equal(code, "1405");
            return data;
        },
        "getFiscalPeriodByCode",
        { params: { code: "1405" } }
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, data);
});

// ======================================================
// CREATE Fiscal Period
// ======================================================

test("CREATE fiscal period returns 201", async () => {
    const input = {
        code: "1406",
        name: "دوره مالی سال 1406"
    };

    const data = { id: "period-2", ...input };

    const res = await runController(
        "create",
        async (body) => {
            assert.deepEqual(body, input);
            return data;
        },
        "createFiscalPeriod",
        { body: input }
    );

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, data);
});

test("CREATE fiscal period returns 400 for invalid Jalali code", async () => {
    const res = await runController(
        "create",
        async () => {
            throw new Error("Invalid Jalali fiscal period code: 140A");
        },
        "createFiscalPeriod",
        { body: {} }
    );

    assert.equal(res.statusCode, 400);
});

// ======================================================
// UPDATE Fiscal Period
// ======================================================

test("UPDATE fiscal period returns 200", async () => {
    const input = { name: "دوره مالی اصلاح‌شده" };
    const data = { id: "period-1", ...input };

    const res = await runController(
        "update",
        async (id, body) => {
            assert.equal(id, "period-1");
            assert.deepEqual(body, input);
            return data;
        },
        "updateFiscalPeriod",
        {
            params: { id: "period-1" },
            body: input
        }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.deepEqual(res.body.data, data);
});

test("UPDATE fiscal period returns 409 when financial history exists", async () => {
    const res = await runController(
        "update",
        async () => {
            throw new Error(
                "Fiscal period dates cannot be changed because the fiscal period has financial history"
            );
        },
        "updateFiscalPeriod",
        {
            params: { id: "period-1" },
            body: {}
        }
    );

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.success, false);
});

test("UPDATE fiscal period returns 400 for invalid Gregorian date", async () => {
    const res = await runController(
        "update",
        async () => {
            throw new Error("Invalid Gregorian date");
        },
        "updateFiscalPeriod",
        {
            params: { id: "period-1" },
            body: { startDate: "2026-02-30" }
        }
    );

    assert.equal(res.statusCode, 400);
});

// ======================================================
// DELETE Fiscal Period
// ======================================================

test("DELETE fiscal period returns 200", async () => {
    const res = await runController(
        "delete",
        async (id) => {
            assert.equal(id, "period-1");
        },
        "deleteFiscalPeriod",
        { params: { id: "period-1" } }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
});

test("DELETE fiscal period returns 409 when dependencies exist", async () => {
    const res = await runController(
        "delete",
        async () => {
            throw new Error(
                "Fiscal period cannot be deleted because it has financial dependencies"
            );
        },
        "deleteFiscalPeriod",
        { params: { id: "period-1" } }
    );

    assert.equal(res.statusCode, 409);
});

// ======================================================
// Unexpected Server Error
// ======================================================

test("Unexpected controller error returns 500", async () => {
    const res = await runController(
        "getAll",
        async () => {
            throw new Error("Unexpected database failure");
        },
        "getFiscalPeriods"
    );

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
});
