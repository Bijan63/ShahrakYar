"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    parseJalaliDate,
    formatJalaliDate,
    jalaliToGregorianParts,
    jalaliToUtcDate,
    gregorianToJalali,
    formatGregorianDateInTimeZone,
    getJalaliFiscalPeriodRange,
    isDateWithinRange,
    isLeapJalaaliYear,
    jalaaliMonthLength,
} = require("../src/utils/jalaliDate");

test("Parse Latin and Persian Jalali digits", () => {
    assert.deepEqual(parseJalaliDate("1405/01/01"), {
        jy: 1405,
        jm: 1,
        jd: 1,
    });

    assert.deepEqual(parseJalaliDate("۱۴۰۵/۰۱/۰۱"), {
        jy: 1405,
        jm: 1,
        jd: 1,
    });
});

test("Reject invalid Jalali dates", () => {
    assert.throws(() => parseJalaliDate("1405/13/01"), /Invalid Jalali date/);
    assert.throws(() => parseJalaliDate("1405/12/30"), /Invalid Jalali date/);
    assert.throws(() => parseJalaliDate("۱۴۰۵/۰۲/۳۲"), /Invalid Jalali date/);
    assert.throws(() => parseJalaliDate("not-a-date"), /Invalid Jalali date format/);
});

test("Convert the first day of 1405 in both directions", () => {
    const gregorian = jalaliToGregorianParts("1405/01/01");

    assert.deepEqual(gregorian, {
        gy: 2026,
        gm: 3,
        gd: 21,
    });

    const utcDate = jalaliToUtcDate("1405/01/01");
    assert.equal(utcDate.toISOString(), "2026-03-20T20:30:00.000Z");
    assert.deepEqual(gregorianToJalali(utcDate), {
        jy: 1405,
        jm: 1,
        jd: 1,
    });
});

test("Format Jalali dates consistently", () => {
    assert.equal(
        formatJalaliDate({ jy: 1405, jm: 1, jd: 1 }),
        "1405/01/01"
    );

    assert.equal(
        formatJalaliDate({ year: 1408, month: 12, day: 30 }, "-"),
        "1408-12-30"
    );
});

test("Recognize leap years and Esfand length", () => {
    assert.equal(isLeapJalaaliYear(1405), false);
    assert.equal(isLeapJalaaliYear(1406), false);
    assert.equal(isLeapJalaaliYear(1407), false);
    assert.equal(isLeapJalaaliYear(1408), true);
    assert.equal(jalaaliMonthLength(1405, 12), 29);
    assert.equal(jalaaliMonthLength(1408, 12), 30);
    assert.doesNotThrow(() => parseJalaliDate("1408/12/30"));
});

test("Calculate exact UTC boundaries for fiscal years 1405 to 1408", () => {
    const expected = [
        [1405, "2026-03-21", "2027-03-20", 365, "1405/12/29"],
        [1406, "2027-03-21", "2028-03-19", 365, "1406/12/29"],
        [1407, "2028-03-20", "2029-03-19", 365, "1407/12/29"],
        [1408, "2029-03-20", "2030-03-20", 366, "1408/12/30"],
    ];

    for (const [year, start, end, days, endJalali] of expected) {
        const range = getJalaliFiscalPeriodRange(year);

        assert.equal(range.startDateGregorian, start);
        assert.equal(range.endDateGregorian, end);
        assert.equal(range.days, days);
        const expectedStartUtc = new Date(new Date(`${start}T00:00:00.000Z`).getTime() - 210 * 60 * 1000);
        const expectedEndUtc = new Date(new Date(`${end}T23:59:59.999Z`).getTime() - 210 * 60 * 1000);
        assert.equal(range.startDate.toISOString(), expectedStartUtc.toISOString());
        assert.equal(range.endDate.toISOString(), expectedEndUtc.toISOString());
        assert.equal(range.startDateJalali, `${year}/01/01`);
        assert.equal(range.endDateJalali, endJalali);
        assert.equal(
            formatGregorianDateInTimeZone(range.startDate),
            start
        );
        assert.equal(
            formatGregorianDateInTimeZone(range.endDate),
            end
        );
    }
});

test("Check inclusive fiscal period boundaries", () => {
    const range = getJalaliFiscalPeriodRange(1405);

    assert.equal(isDateWithinRange(range.startDate, range.startDate, range.endDate), true);
    assert.equal(isDateWithinRange(range.endDate, range.startDate, range.endDate), true);
    assert.equal(
        isDateWithinRange(new Date(range.startDate.getTime() - 1), range.startDate, range.endDate),
        false
    );
    assert.equal(
        isDateWithinRange(new Date(range.endDate.getTime() + 1), range.startDate, range.endDate),
        false
    );
});
