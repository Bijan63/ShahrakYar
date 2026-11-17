"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const journalEntryService = require("../src/services/journalEntry.service");

const toIso = value =>
    journalEntryService.normalizeEntryDate(value).toISOString();

test("Normalize Jalali date to Tehran midnight", () => {
    assert.equal(
        toIso("1405/01/01"),
        "2026-03-20T20:30:00.000Z"
    );
});

test("Normalize Persian-digit Jalali date", () => {
    assert.equal(
        toIso("۱۴۰۵/۰۱/۰۱"),
        "2026-03-20T20:30:00.000Z"
    );
});

test("Normalize Jalali date and local time in Asia/Tehran", () => {
    assert.equal(
        toIso("1405/01/01 12:30:00"),
        "2026-03-21T09:00:00.000Z"
    );
});

test("Interpret Gregorian ISO date-only input at Tehran midnight", () => {
    assert.equal(
        toIso("2026-03-21"),
        "2026-03-20T20:30:00.000Z"
    );
});

test("Preserve ISO timestamps with explicit UTC offset", () => {
    assert.equal(
        toIso("2026-03-21T00:00:00.000Z"),
        "2026-03-21T00:00:00.000Z"
    );
});

test("Accept Date objects without changing the instant", () => {
    const input = new Date("2026-03-21T10:15:00.000Z");

    assert.equal(
        toIso(input),
        "2026-03-21T10:15:00.000Z"
    );
});

test("Reject invalid Jalali dates and times", () => {
    assert.throws(
        () => journalEntryService.normalizeEntryDate("1405/12/30"),
        /Invalid entryDate/
    );

    assert.throws(
        () => journalEntryService.normalizeEntryDate("1405/01/01 25:00"),
        /Invalid entryDate/
    );
});

test("Reject invalid Gregorian calendar dates", () => {
    assert.throws(
        () => journalEntryService.normalizeEntryDate("2026-02-30"),
        /Invalid entryDate/
    );
});

test("Accept leap-year Jalali Esfand 30", () => {
    assert.equal(
        toIso("1408/12/30"),
        "2030-03-19T20:30:00.000Z"
    );
});