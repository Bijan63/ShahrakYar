
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const errorMiddleware =
    require("../src/middleware/journalEntryError.middleware");


// ======================================================
// Test Helper
// ======================================================

function executeMiddleware(error, headersSent = false) {

    const result = {
        statusCode: null,
        body: null,
        nextError: null
    };

    const req = {};

    const res = {

        headersSent,

        status(code) {
            result.statusCode = code;
            return this;
        },

        json(body) {
            result.body = body;
            return this;
        }

    };

    errorMiddleware(
        error,
        req,
        res,
        (nextError) => {
            result.nextError = nextError;
        }
    );

    return result;
}


// ======================================================
// 400 - Bad Request
// ======================================================

test("Return 400 for invalid journal entry input", () => {

    const errors = [
        "Invalid entryDate",
        "Debit and credit cannot be negative",
        "Journal entry must have at least two lines",
        "Invalid journal entry status"
    ];

    for (const message of errors) {

        const result = executeMiddleware(
            new Error(message)
        );

        assert.equal(result.statusCode, 400);
        assert.equal(result.body.success, false);
        assert.equal(result.body.message, message);

    }

});


// ======================================================
// 404 - Not Found
// ======================================================

test("Return 404 when journal entry or related record is missing", () => {

    const errors = [
        "Journal entry not found",
        "Fiscal period not found",
        "Fund not found",
        "Account not found: account-123"
    ];

    for (const message of errors) {

        const result = executeMiddleware(
            new Error(message)
        );

        assert.equal(result.statusCode, 404);
        assert.equal(result.body.success, false);
        assert.equal(result.body.message, message);

    }

});


// ======================================================
// 409 - Conflict
// ======================================================

test("Return 409 for journal entry state conflicts", () => {

    const errors = [
        "Entry number already exists",
        "Only DRAFT journal entries can be modified",
        "Only DRAFT journal entries can be updated",
        "Only DRAFT journal entries can be deleted",
        "Only DRAFT journal entries can be posted",
        "Journal entry must be posted using the post operation",
        "Journal entry fiscal period cannot be changed",
        "Journal entry can only be posted in an active fiscal period"
    ];

    for (const message of errors) {

        const result = executeMiddleware(
            new Error(message)
        );

        assert.equal(result.statusCode, 409);
        assert.equal(result.body.success, false);
        assert.equal(result.body.message, message);

    }

});


// ======================================================
// Prisma Error Mapping
// ======================================================

test("Map Prisma errors to correct HTTP status codes", () => {

    const cases = [
        { code: "P2002", status: 409 },
        { code: "P2003", status: 409 },
        { code: "P2004", status: 409 },
        { code: "P2025", status: 404 },
        { code: "P2023", status: 400 }
    ];

    for (const item of cases) {

        const error = new Error("Database test error");

        error.code = item.code;

        const result = executeMiddleware(error);

        assert.equal(
            result.statusCode,
            item.status,
            `Unexpected status for Prisma ${item.code}`
        );

    }

});


// ======================================================
// 500 - Internal Server Error
// ======================================================

test("Return 500 without exposing internal error details", (t) => {

    t.mock.method(
        console,
        "error",
        () => {}
    );

    const result = executeMiddleware(
        new Error("Internal database connection details")
    );

    assert.equal(result.statusCode, 500);

    assert.deepEqual(result.body, {
        success: false,
        message: "Internal server error"
    });

});


// ======================================================
// Headers Already Sent
// ======================================================

test("Forward error when response headers have already been sent", () => {

    const error = new Error("Late error");

    const result = executeMiddleware(
        error,
        true
    );

    assert.equal(result.statusCode, null);
    assert.equal(result.body, null);
    assert.equal(result.nextError, error);

});
