"use strict";

const fiscalPeriodRepository =
    require("../repositories/fiscalPeriod.repository");

const {
    DEFAULT_TIME_ZONE,
    normalizeDigits,
    parseJalaliDate,
    formatJalaliDate,
    gregorianToJalali,
    jalaliToUtcDate,
    zonedDateTimeToUtc,
    getJalaliFiscalPeriodRange,
    jalaaliMonthLength,
} = require("../utils/jalaliDate");

const GREGORIAN_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIMESTAMP_WITH_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/i;

/**
 * Normalize a four-digit Jalali fiscal-year code to Latin digits.
 * Non-numeric/custom codes return null for backward compatibility.
 */
function getJalaliYearFromCode(code) {
    const normalized = normalizeDigits(String(code).trim());

    if (!/^\d{4}$/.test(normalized)) {
        return null;
    }

    const year = Number(normalized);

    try {
        getJalaliFiscalPeriodRange(year, DEFAULT_TIME_ZONE);
    } catch (error) {
        throw new Error(`Invalid Jalali fiscal period code: ${code}`);
    }

    return {
        code: normalized,
        year,
    };
}

function validateGregorianDateParts(year, month, day) {
    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {
        throw new Error("Invalid Gregorian date");
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() + 1 !== month ||
        date.getUTCDate() !== day
    ) {
        throw new Error("Invalid Gregorian date");
    }

    return { year, month, day };
}

function nextGregorianDate({ year, month, day }) {
    const date = new Date(Date.UTC(year, month - 1, day + 1));

    return {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
    };
}

function nextJalaliDate({ jy, jm, jd }) {
    const monthLength = jalaaliMonthLength(jy, jm);

    if (jd < monthLength) {
        return { jy, jm, jd: jd + 1 };
    }

    if (jm < 12) {
        return { jy, jm: jm + 1, jd: 1 };
    }

    return { jy: jy + 1, jm: 1, jd: 1 };
}

/**
 * Normalize a date boundary.
 *
 * Input contract:
 * - YYYY/MM/DD: Jalali date.
 * - YYYY-MM-DD: Gregorian date-only, interpreted in Asia/Tehran.
 * - ISO timestamp with Z/offset: absolute instant, preserved.
 * - Date / epoch milliseconds: absolute instant, preserved.
 *
 * For end boundaries, a date-only value means the final millisecond of
 * that calendar day in Asia/Tehran. This gives fiscal periods inclusive
 * start/end semantics compatible with existing comparisons.
 */
function normalizeBoundary(value, boundary) {
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            throw new Error("Invalid date");
        }

        return new Date(value.getTime());
    }

    if (typeof value === "number") {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            throw new Error("Invalid date");
        }

        return date;
    }

    if (typeof value !== "string" || !value.trim()) {
        throw new Error("Invalid date");
    }

    const normalized = normalizeDigits(value.trim());

    // Slash-separated values are explicitly Jalali.
    if (/^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(normalized)) {
        const jalali = parseJalaliDate(normalized);

        if (boundary === "start") {
            return jalaliToUtcDate(jalali, DEFAULT_TIME_ZONE);
        }

        const nextDay = nextJalaliDate(jalali);
        return new Date(
            jalaliToUtcDate(nextDay, DEFAULT_TIME_ZONE).getTime() - 1
        );
    }

    // Hyphenated date-only strings follow the journal-entry API contract:
    // they are Gregorian ISO dates, not Jalali dates.
    const dateOnlyMatch = GREGORIAN_DATE_ONLY.exec(normalized);

    if (dateOnlyMatch) {
        const [, rawYear, rawMonth, rawDay] = dateOnlyMatch;
        const parts = validateGregorianDateParts(
            Number(rawYear),
            Number(rawMonth),
            Number(rawDay)
        );

        if (boundary === "start") {
            return zonedDateTimeToUtc(
                parts.year,
                parts.month,
                parts.day,
                0, 0, 0, 0,
                DEFAULT_TIME_ZONE
            );
        }

        const nextDay = nextGregorianDate(parts);

        return new Date(
            zonedDateTimeToUtc(
                nextDay.year,
                nextDay.month,
                nextDay.day,
                0, 0, 0, 0,
                DEFAULT_TIME_ZONE
            ).getTime() - 1
        );
    }

    // Timestamp strings must specify a timezone to avoid machine-local
    // timezone dependence in the backend.
    if (!TIMESTAMP_WITH_OFFSET.test(normalized)) {
        throw new Error(
            "Date-time values must include Z or an explicit UTC offset"
        );
    }

    const date = new Date(normalized);

    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
    }

    return date;
}

function assertProvidedBoundaryMatches(
    value,
    boundary,
    expectedRange,
    fieldName
) {
    if (value === undefined || value === null || value === "") {
        return;
    }

    const normalized = typeof value === "string"
        ? normalizeDigits(value.trim())
        : value;

    if (
        typeof normalized === "string" &&
        /^\d{3,4}\/\d{1,2}\/\d{1,2}$/.test(normalized)
    ) {
        const actualJalali = parseJalaliDate(normalized);
        const actualText = formatJalaliDate(actualJalali);
        const expectedText = boundary === "start"
            ? expectedRange.startDateJalali
            : expectedRange.endDateJalali;

        if (actualText !== expectedText) {
            throw new Error(
                `${fieldName} must match the ${boundary} boundary of Jalali fiscal year ${expectedRange.jalaliYear}`
            );
        }

        return;
    }

    if (typeof normalized === "string") {
        const dateOnlyMatch = GREGORIAN_DATE_ONLY.exec(normalized);

        if (dateOnlyMatch) {
            validateGregorianDateParts(
                Number(dateOnlyMatch[1]),
                Number(dateOnlyMatch[2]),
                Number(dateOnlyMatch[3])
            );

            const expectedText = boundary === "start"
                ? expectedRange.startDateGregorian
                : expectedRange.endDateGregorian;

            if (normalized !== expectedText) {
                throw new Error(
                    `${fieldName} must match the ${boundary} boundary of Jalali fiscal year ${expectedRange.jalaliYear}`
                );
            }

            return;
        }
    }

    const actualDate = normalizeBoundary(value, boundary);
    const expectedDate = boundary === "start"
        ? expectedRange.startDate
        : expectedRange.endDate;

    if (actualDate.getTime() !== expectedDate.getTime()) {
        throw new Error(
            `${fieldName} must match the ${boundary} boundary of Jalali fiscal year ${expectedRange.jalaliYear}`
        );
    }
}

function getJalaliRangeForCode(code) {
    const yearInfo = getJalaliYearFromCode(code);

    if (!yearInfo) {
        return null;
    }

    return {
        ...yearInfo,
        ...getJalaliFiscalPeriodRange(
            yearInfo.year,
            DEFAULT_TIME_ZONE
        ),
    };
}

function serializeFiscalPeriod(period) {
    if (!period) {
        return period;
    }

    const result = { ...period };

    if (period.startDate) {
        result.startDateJalali = formatJalaliDate(
            gregorianToJalali(period.startDate, DEFAULT_TIME_ZONE)
        );
    }

    if (period.endDate) {
        result.endDateJalali = formatJalaliDate(
            gregorianToJalali(period.endDate, DEFAULT_TIME_ZONE)
        );
    }

    result.calendar = "JALALI";
    result.timeZone = DEFAULT_TIME_ZONE;

    return result;
}

class FiscalPeriodService {

    // ======================================================
    // Get All Fiscal Periods
    // ======================================================

    async getAll() {
        const periods = await fiscalPeriodRepository.findAll();
        return periods.map(serializeFiscalPeriod);
    }

    // ======================================================
    // Get Fiscal Period by ID
    // ======================================================

    async getById(id) {
        if (!id) {
            throw new Error("Fiscal period id is required");
        }

        const fiscalPeriod = await fiscalPeriodRepository.findById(id);

        if (!fiscalPeriod) {
            throw new Error("Fiscal period not found");
        }

        return serializeFiscalPeriod(fiscalPeriod);
    }

    // ======================================================
    // Get Fiscal Period by Code
    // ======================================================

    async getByCode(code) {
        if (!code) {
            throw new Error("code is required");
        }

        const normalizedCode = normalizeDigits(String(code).trim());
        const fiscalPeriod = await fiscalPeriodRepository.findByCode(
            normalizedCode
        );

        if (!fiscalPeriod) {
            throw new Error("Fiscal period not found");
        }

        return serializeFiscalPeriod(fiscalPeriod);
    }

    // ======================================================
    // Create Fiscal Period
    // ======================================================

    async create(data) {
        if (!data) {
            throw new Error("Request body is required");
        }

        if (typeof data.code !== "string" || !data.code.trim()) {
            throw new Error("code is required");
        }

        const code = normalizeDigits(data.code.trim());

        if (typeof data.name !== "string" || !data.name.trim()) {
            throw new Error("name is required");
        }

        const name = data.name.trim();
        const jalaliRange = getJalaliRangeForCode(code);

        let startDate;
        let endDate;

        if (jalaliRange) {
            // A four-digit Jalali year code is authoritative. Dates are
            // generated automatically; supplied boundaries are assertions.
            assertProvidedBoundaryMatches(
                data.startDate,
                "start",
                jalaliRange,
                "startDate"
            );
            assertProvidedBoundaryMatches(
                data.endDate,
                "end",
                jalaliRange,
                "endDate"
            );

            startDate = jalaliRange.startDate;
            endDate = jalaliRange.endDate;
        } else {
            // Backward compatibility for custom/non-year fiscal period codes.
            if (!data.startDate) {
                throw new Error("startDate is required");
            }

            if (!data.endDate) {
                throw new Error("endDate is required");
            }

            startDate = normalizeBoundary(data.startDate, "start");
            endDate = normalizeBoundary(data.endDate, "end");
        }

        if (startDate >= endDate) {
            throw new Error("startDate must be before endDate");
        }

        const status = data.status === undefined
            ? "ACTIVE"
            : data.status;

        this.validateStatus(status);

        const existing = await fiscalPeriodRepository.findByCode(code);

        if (existing) {
            throw new Error("Fiscal period code already exists");
        }

        if (status === "ACTIVE") {
            const activePeriod = await fiscalPeriodRepository.findActive();

            if (activePeriod) {
                throw new Error("Another active fiscal period already exists");
            }
        }

        const created = await fiscalPeriodRepository.create({
            code,
            name,
            startDate,
            endDate,
            status,
        });

        return serializeFiscalPeriod(created);
    }

    // ======================================================
    // Update Fiscal Period
    // ======================================================

    async update(id, data) {
        if (!id) {
            throw new Error("Fiscal period id is required");
        }

        if (!data) {
            throw new Error("Request body is required");
        }

        const existing = await this.getById(id);

        let finalCode = existing.code;

        if (data.code !== undefined) {
            if (typeof data.code !== "string" || !data.code.trim()) {
                throw new Error("code is required");
            }

            finalCode = normalizeDigits(data.code.trim());
        }

        let finalName = existing.name;

        if (data.name !== undefined) {
            if (typeof data.name !== "string" || !data.name.trim()) {
                throw new Error("name is required");
            }

            finalName = data.name.trim();
        }

        let finalStartDate = new Date(existing.startDate);
        let finalEndDate = new Date(existing.endDate);

        if (
            Number.isNaN(finalStartDate.getTime()) ||
            Number.isNaN(finalEndDate.getTime())
        ) {
            throw new Error("Existing fiscal period contains invalid dates");
        }

        const jalaliRange = getJalaliRangeForCode(finalCode);
        const codeChanged = finalCode !== existing.code;
        const dateBoundaryProvided =
            data.startDate !== undefined || data.endDate !== undefined;

        if (jalaliRange && (codeChanged || dateBoundaryProvided)) {
            assertProvidedBoundaryMatches(
                data.startDate,
                "start",
                jalaliRange,
                "startDate"
            );
            assertProvidedBoundaryMatches(
                data.endDate,
                "end",
                jalaliRange,
                "endDate"
            );

            finalStartDate = jalaliRange.startDate;
            finalEndDate = jalaliRange.endDate;
        } else if (!jalaliRange) {
            if (data.startDate !== undefined) {
                finalStartDate = normalizeBoundary(data.startDate, "start");
            }

            if (data.endDate !== undefined) {
                finalEndDate = normalizeBoundary(data.endDate, "end");
            }
        }

        if (finalStartDate >= finalEndDate) {
            throw new Error("startDate must be before endDate");
        }

        const finalStatus = data.status !== undefined
            ? data.status
            : existing.status;

        this.validateStatus(finalStatus);

        const datesChanged =
            finalStartDate.getTime() !== new Date(existing.startDate).getTime() ||
            finalEndDate.getTime() !== new Date(existing.endDate).getTime();

        if (datesChanged) {
            const usage = await fiscalPeriodRepository.getUsageCounts(id);

            if (!usage) {
                throw new Error("Fiscal period not found");
            }

            const hasFinancialHistory =
                (usage.journalEntries || 0) > 0 ||
                (usage.openingBalances || 0) > 0 ||
                (usage.chargePayments || 0) > 0 ||
                (usage.nonZeroFinancialAccountOpeningBalances || 0) > 0;

            if (hasFinancialHistory) {
                throw new Error(
                    "Fiscal period dates cannot be changed because the fiscal period has financial history"
                );
            }
        }

        if (finalCode !== existing.code) {
            const duplicate = await fiscalPeriodRepository.findByCode(finalCode);

            if (duplicate && duplicate.id !== id) {
                throw new Error("Fiscal period code already exists");
            }
        }

        if (
            finalStatus === "ACTIVE" &&
            existing.status !== "ACTIVE"
        ) {
            const activePeriod = await fiscalPeriodRepository.findActive();

            if (activePeriod && activePeriod.id !== id) {
                throw new Error("Another active fiscal period already exists");
            }
        }

        const updated = await fiscalPeriodRepository.update(id, {
            code: finalCode,
            name: finalName,
            startDate: finalStartDate,
            endDate: finalEndDate,
            status: finalStatus,
        });

        return serializeFiscalPeriod(updated);
    }

    // ======================================================
    // Delete Fiscal Period
    // ======================================================

    async delete(id) {
        const existing = await this.getById(id);
        const usage = await fiscalPeriodRepository.getUsageCounts(id);

        if (!usage) {
            throw new Error("Fiscal period not found");
        }

        const hasDependencies =
            (usage.accounts || 0) > 0 ||
            (usage.financialAccounts || 0) > 0 ||
            (usage.funds || 0) > 0 ||
            (usage.journalEntries || 0) > 0 ||
            (usage.openingBalances || 0) > 0 ||
            (usage.propertyAccounts || 0) > 0 ||
            (usage.chargePayments || 0) > 0 ||
            (usage.nonZeroFinancialAccountOpeningBalances || 0) > 0;

        if (hasDependencies) {
            throw new Error(
                "Fiscal period cannot be deleted because it has financial dependencies"
            );
        }

        return await fiscalPeriodRepository.delete(existing.id);
    }

    // ======================================================
    // Validate Status
    // ======================================================

    validateStatus(status) {
        if (status !== "ACTIVE" && status !== "INACTIVE") {
            throw new Error("Invalid status");
        }
    }
}

module.exports = new FiscalPeriodService();
