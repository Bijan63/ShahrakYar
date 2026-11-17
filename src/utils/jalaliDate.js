"use strict";

const {
    toJalaali,
    toGregorian,
    isValidJalaaliDate,
    isLeapJalaaliYear,
    jalaaliMonthLength,
} = require("jalaali-js");

const MIN_JALALI_YEAR = -61;
const MAX_JALALI_YEAR = 3177;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIME_ZONE = "Asia/Tehran";

const DIGIT_MAP = Object.freeze({
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
});

const FORMATTER_CACHE = new Map();

function normalizeDigits(value) {
    return String(value).replace(/[۰-۹٠-٩]/g, digit => DIGIT_MAP[digit]);
}

function assertJalaliYear(year) {
    if (!Number.isInteger(year) || year < MIN_JALALI_YEAR || year > MAX_JALALI_YEAR) {
        throw new RangeError(
            `Jalali year must be an integer between ${MIN_JALALI_YEAR} and ${MAX_JALALI_YEAR}`
        );
    }
}

function getFormatter(timeZone) {
    if (!FORMATTER_CACHE.has(timeZone)) {
        FORMATTER_CACHE.set(timeZone, new Intl.DateTimeFormat("en-US", {
            timeZone,
            calendar: "gregory",
            numberingSystem: "latn",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hourCycle: "h23",
        }));
    }

    return FORMATTER_CACHE.get(timeZone);
}

function getZonedParts(date, timeZone = DEFAULT_TIME_ZONE) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new TypeError("A valid Date is required");
    }

    const parts = Object.fromEntries(
        getFormatter(timeZone)
            .formatToParts(date)
            .filter(part => part.type !== "literal")
            .map(part => [part.type, Number(part.value)])
    );

    return {
        year: parts.year,
        month: parts.month,
        day: parts.day,
        hour: parts.hour,
        minute: parts.minute,
        second: parts.second,
    };
}

function getTimeZoneOffsetMilliseconds(date, timeZone) {
    const parts = getZonedParts(date, timeZone);
    const representedAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    );
    const wholeSecondTimestamp = Math.floor(date.getTime() / 1000) * 1000;

    return representedAsUtc - wholeSecondTimestamp;
}

/**
 * Convert a wall-clock date/time in an IANA time zone into a UTC instant.
 * Iteration avoids assuming that the zone has a fixed UTC offset.
 */
function zonedDateTimeToUtc(
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
    timeZone = DEFAULT_TIME_ZONE
) {
    const wallClockAsUtc = Date.UTC(
        year,
        month - 1,
        day,
        hour,
        minute,
        second,
        millisecond
    );

    let timestamp = wallClockAsUtc;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        const offset = getTimeZoneOffsetMilliseconds(
            new Date(timestamp),
            timeZone
        );
        const correctedTimestamp = wallClockAsUtc - offset;

        if (correctedTimestamp === timestamp) {
            break;
        }

        timestamp = correctedTimestamp;
    }

    return new Date(timestamp);
}

/**
 * Parse a Jalali date string. Accepted formats:
 *   1405/01/01
 *   1405-01-01
 * Persian and Arabic-Indic numerals are accepted.
 *
 * This function is explicitly Jalali; do not pass Gregorian ISO dates to it.
 */
function parseJalaliDate(value) {
    if (typeof value !== "string") {
        throw new TypeError("Jalali date must be a string in YYYY/MM/DD format");
    }

    const normalized = normalizeDigits(value.trim());
    const match = /^(\d{3,4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(normalized);

    if (!match) {
        throw new Error("Invalid Jalali date format; expected YYYY/MM/DD");
    }

    const jy = Number(match[1]);
    const jm = Number(match[2]);
    const jd = Number(match[3]);

    assertJalaliYear(jy);

    if (!isValidJalaaliDate(jy, jm, jd)) {
        throw new Error(`Invalid Jalali date: ${formatJalaliDate({ jy, jm, jd })}`);
    }

    return { jy, jm, jd };
}

function formatJalaliDate(parts, separator = "/") {
    if (!parts || typeof parts !== "object") {
        throw new TypeError("Jalali date parts are required");
    }

    const jy = Number(parts.jy ?? parts.year);
    const jm = Number(parts.jm ?? parts.month);
    const jd = Number(parts.jd ?? parts.day);

    assertJalaliYear(jy);

    if (!isValidJalaaliDate(jy, jm, jd)) {
        throw new Error("Invalid Jalali date parts");
    }

    return [jy, String(jm).padStart(2, "0"), String(jd).padStart(2, "0")]
        .join(separator);
}

function jalaliToGregorianParts(value) {
    const { jy, jm, jd } = typeof value === "string"
        ? parseJalaliDate(value)
        : parseJalaliDate(formatJalaliDate(value, "/"));

    return toGregorian(jy, jm, jd);
}

/**
 * Convert a Jalali date to the instant representing 00:00:00.000
 * in Asia/Tehran. This makes period comparisons independent of the
 * machine/server timezone while preserving the Iranian accounting day.
 */
function jalaliToUtcDate(value, timeZone = DEFAULT_TIME_ZONE) {
    const { gy, gm, gd } = jalaliToGregorianParts(value);
    return zonedDateTimeToUtc(gy, gm, gd, 0, 0, 0, 0, timeZone);
}

/**
 * Convert a Date (or Gregorian ISO date string) to Jalali using the selected
 * IANA time zone. A date-only Gregorian ISO string is interpreted at UTC
 * midnight, then converted using the selected time zone.
 */
function gregorianToJalali(value, timeZone = DEFAULT_TIME_ZONE) {
    let date;

    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
            date = new Date(`${value.trim()}T00:00:00.000Z`);
        } else {
            date = new Date(value);
        }
    } else {
        throw new TypeError("Gregorian date must be a Date or ISO date string");
    }

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid Gregorian date");
    }

    const parts = getZonedParts(date, timeZone);
    return toJalaali(parts.year, parts.month, parts.day);
}

function formatGregorianDateInTimeZone(date, timeZone = DEFAULT_TIME_ZONE) {
    const parts = getZonedParts(date, timeZone);
    return [
        String(parts.year).padStart(4, "0"),
        String(parts.month).padStart(2, "0"),
        String(parts.day).padStart(2, "0"),
    ].join("-");
}

/**
 * Return inclusive boundaries for a Jalali fiscal year, represented as UTC
 * instants corresponding to midnight and 23:59:59.999 in Asia/Tehran.
 * The next year's first day is used to derive the end, so leap years are safe.
 */
function getJalaliFiscalPeriodRange(jalaliYear, timeZone = DEFAULT_TIME_ZONE) {
    const year = typeof jalaliYear === "string"
        ? Number(normalizeDigits(jalaliYear.trim()))
        : jalaliYear;

    assertJalaliYear(year);
    assertJalaliYear(year + 1);

    const startDate = jalaliToUtcDate(
        { jy: year, jm: 1, jd: 1 },
        timeZone
    );
    const nextYearStart = jalaliToUtcDate(
        { jy: year + 1, jm: 1, jd: 1 },
        timeZone
    );
    const endDate = new Date(nextYearStart.getTime() - 1);

    return {
        jalaliYear: year,
        timeZone,
        startDate,
        endDate,
        startDateGregorian: formatGregorianDateInTimeZone(startDate, timeZone),
        endDateGregorian: formatGregorianDateInTimeZone(endDate, timeZone),
        startDateJalali: formatJalaliDate({ jy: year, jm: 1, jd: 1 }),
        endDateJalali: formatJalaliDate(gregorianToJalali(endDate, timeZone)),
        isLeapYear: isLeapJalaaliYear(year),
        days: Math.round((nextYearStart.getTime() - startDate.getTime()) / DAY_MS),
    };
}

function isDateWithinRange(value, startDate, endDate) {
    const date = value instanceof Date ? value : new Date(value);
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    if ([date, start, end].some(item => Number.isNaN(item.getTime()))) {
        throw new Error("Invalid date range input");
    }

    return date >= start && date <= end;
}

module.exports = {
    MIN_JALALI_YEAR,
    MAX_JALALI_YEAR,
    DEFAULT_TIME_ZONE,
    normalizeDigits,
    parseJalaliDate,
    formatJalaliDate,
    jalaliToGregorianParts,
    jalaliToUtcDate,
    gregorianToJalali,
    formatGregorianDateInTimeZone,
    zonedDateTimeToUtc,
    getJalaliFiscalPeriodRange,
    isDateWithinRange,
    isLeapJalaaliYear,
    jalaaliMonthLength,
};
