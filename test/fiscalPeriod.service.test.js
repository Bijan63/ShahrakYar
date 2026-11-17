"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const repositoryPath = path.resolve(
    __dirname,
    "../src/repositories/fiscalPeriod.repository.js"
);
const servicePath = path.resolve(
    __dirname,
    "../src/services/fiscalPeriod.service.js"
);

const originalRepositoryModule = require.cache[repositoryPath];
const originalServiceModule = require.cache[servicePath];

const state = {
    periods: [],
    activePeriod: null,
    usage: null,
    lastCreate: null,
    lastUpdate: null,
    lastDelete: null,
};

function clonePeriod(period) {
    if (!period) return period;
    return {
        ...period,
        startDate: new Date(period.startDate),
        endDate: new Date(period.endDate),
    };
}

const fakeRepository = {
    async findAll() {
        return state.periods.map(clonePeriod);
    },

    async findById(id) {
        return clonePeriod(state.periods.find(item => item.id === id) || null);
    },

    async findByCode(code) {
        return clonePeriod(state.periods.find(item => item.code === code) || null);
    },

    async findActive() {
        return clonePeriod(state.activePeriod);
    },

    async create(data) {
        state.lastCreate = data;
        const created = {
            id: "created-period",
            ...data,
        };
        state.periods.push(clonePeriod(created));
        if (created.status === "ACTIVE") state.activePeriod = created;
        return clonePeriod(created);
    },

    async update(id, data) {
        state.lastUpdate = { id, data };
        const index = state.periods.findIndex(item => item.id === id);
        if (index < 0) throw new Error("not found");
        state.periods[index] = {
            ...state.periods[index],
            ...data,
        };
        if (state.periods[index].status === "ACTIVE") {
            state.activePeriod = state.periods[index];
        }
        return clonePeriod(state.periods[index]);
    },

    async delete(id) {
        state.lastDelete = id;
        state.periods = state.periods.filter(item => item.id !== id);
        return { id };
    },

    async getUsageCounts() {
        return state.usage || {
            accounts: 0,
            financialAccounts: 0,
            funds: 0,
            journalEntries: 0,
            openingBalances: 0,
            propertyAccounts: 0,
            chargePayments: 0,
            nonZeroFinancialAccountOpeningBalances: 0,
        };
    },
};

require.cache[repositoryPath] = {
    id: repositoryPath,
    filename: repositoryPath,
    loaded: true,
    exports: fakeRepository,
};
delete require.cache[servicePath];

const service = require(servicePath);

if (originalRepositoryModule) {
    require.cache[repositoryPath] = originalRepositoryModule;
} else {
    delete require.cache[repositoryPath];
}

if (originalServiceModule) {
    require.cache[servicePath] = originalServiceModule;
}

function makePeriod(overrides = {}) {
    return {
        id: "period-1405",
        code: "1405",
        name: "دوره مالی سال ۱۴۰۵",
        startDate: new Date("2026-04-01T03:30:00.000Z"),
        endDate: new Date("2027-04-01T03:29:59.999Z"),
        status: "ACTIVE",
        ...overrides,
    };
}

function reset(overrides = {}) {
    state.periods = [];
    state.activePeriod = null;
    state.usage = {
        accounts: 0,
        financialAccounts: 0,
        funds: 0,
        journalEntries: 0,
        openingBalances: 0,
        propertyAccounts: 0,
        chargePayments: 0,
        nonZeroFinancialAccountOpeningBalances: 0,
        ...overrides.usage,
    };
    state.lastCreate = null;
    state.lastUpdate = null;
    state.lastDelete = null;

    if (overrides.period) {
        state.periods.push(clonePeriod(overrides.period));
    }
    if (overrides.activePeriod) {
        state.activePeriod = clonePeriod(overrides.activePeriod);
    }
}

test("Create Jalali fiscal period automatically from numeric year code", async () => {
    reset();

    const result = await service.create({
        code: "1405",
        name: "دوره مالی ۱۴۰۵",
        status: "INACTIVE",
    });

    assert.equal(result.startDate.toISOString(), "2026-03-20T20:30:00.000Z");
    assert.equal(result.endDate.toISOString(), "2027-03-20T20:29:59.999Z");
    assert.equal(result.startDateJalali, "1405/01/01");
    assert.equal(result.endDateJalali, "1405/12/29");
    assert.equal(result.calendar, "JALALI");
    assert.equal(state.lastCreate.code, "1405");
});

test("Normalize Persian-digit fiscal year code", async () => {
    reset();

    const result = await service.create({
        code: "۱۴۰۵",
        name: "دوره مالی ۱۴۰۵",
        status: "INACTIVE",
    });

    assert.equal(result.code, "1405");
    assert.equal(result.startDateJalali, "1405/01/01");
});

test("Accept matching explicit Jalali and Gregorian date-only boundaries", async () => {
    reset();

    const jalaliResult = await service.create({
        code: "1405",
        name: "Jalali dates",
        startDate: "۱۴۰۵/۰۱/۰۱",
        endDate: "۱۴۰۵/۱۲/۲۹",
        status: "INACTIVE",
    });

    assert.equal(jalaliResult.startDateJalali, "1405/01/01");
    assert.equal(jalaliResult.endDateJalali, "1405/12/29");

    reset();

    const gregorianResult = await service.create({
        code: "1405",
        name: "Gregorian ISO dates",
        startDate: "2026-03-21",
        endDate: "2027-03-20",
        status: "INACTIVE",
    });

    assert.equal(gregorianResult.startDateJalali, "1405/01/01");
    assert.equal(gregorianResult.endDateJalali, "1405/12/29");
});

test("Reject explicit dates that do not match Jalali year code", async () => {
    reset();

    await assert.rejects(
        service.create({
            code: "1405",
            name: "Wrong boundaries",
            startDate: "2026-04-01",
            endDate: "2027-04-01",
            status: "INACTIVE",
        }),
        /startDate must match the start boundary/
    );
});

test("Create leap-year fiscal period 1408 with 366 days", async () => {
    reset();

    const result = await service.create({
        code: "1408",
        name: "دوره مالی ۱۴۰۸",
        status: "INACTIVE",
    });

    assert.equal(result.startDateJalali, "1408/01/01");
    assert.equal(result.endDateJalali, "1408/12/30");
    assert.equal(
        result.endDate.getTime() - result.startDate.getTime() + 1,
        366 * 24 * 60 * 60 * 1000
    );
});

test("Require explicit dates for a custom non-year fiscal period code", async () => {
    reset();

    await assert.rejects(
        service.create({
            code: "CUSTOM-2026",
            name: "Custom period",
            status: "INACTIVE",
        }),
        /startDate is required/
    );

    const result = await service.create({
        code: "CUSTOM-2026",
        name: "Custom period",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        status: "INACTIVE",
    });

    assert.equal(result.startDateJalali, "1404/10/11");
    assert.equal(result.endDateJalali, "1405/10/10");
});

test("Correct existing Jalali fiscal period boundaries when no financial history exists", async () => {
    reset({
        period: makePeriod(),
        usage: {
            accounts: 16,
            financialAccounts: 1,
            funds: 1,
            propertyAccounts: 1,
        },
    });

    const result = await service.update("period-1405", {
        startDate: "1405/01/01",
        endDate: "1405/12/29",
    });

    assert.equal(result.startDateJalali, "1405/01/01");
    assert.equal(result.endDateJalali, "1405/12/29");
    assert.equal(state.lastUpdate.id, "period-1405");
});

test("Reject changing fiscal dates when financial history exists", async (t) => {
    const cases = [
        ["journal entries", { journalEntries: 1 }],
        ["opening balances", { openingBalances: 1 }],
        ["charge payments", { chargePayments: 1 }],
        ["non-zero financial-account opening balances", {
            nonZeroFinancialAccountOpeningBalances: 1,
        }],
    ];

    for (const [label, usage] of cases) {
        await t.test(label, async () => {
            reset({
                period: makePeriod(),
                usage,
            });

            await assert.rejects(
                service.update("period-1405", {
                    startDate: "1405/01/01",
                    endDate: "1405/12/29",
                }),
                /cannot be changed because the fiscal period has financial history/
            );

            assert.equal(state.lastUpdate, null);
        });
    }
});

test("Changing Jalali year code recalculates the boundaries", async () => {
    reset({ period: makePeriod({ status: "INACTIVE" }) });

    const result = await service.update("period-1405", {
        code: "1406",
    });

    assert.equal(result.code, "1406");
    assert.equal(result.startDateJalali, "1406/01/01");
    assert.equal(result.endDateJalali, "1406/12/29");
});

test("Do not block date correction for configuration-only dependencies", async () => {
    reset({
        period: makePeriod(),
        usage: {
            accounts: 20,
            financialAccounts: 2,
            funds: 1,
            propertyAccounts: 4,
        },
    });

    const result = await service.update("period-1405", {
        startDate: "1405/01/01",
        endDate: "1405/12/29",
    });

    assert.equal(result.startDateJalali, "1405/01/01");
});

test("Keep one-active-period rule", async () => {
    reset({
        activePeriod: makePeriod({ id: "other", code: "1404" }),
    });

    await assert.rejects(
        service.create({
            code: "1405",
            name: "دوره مالی ۱۴۰۵",
        }),
        /Another active fiscal period already exists/
    );
});

test("Delete remains blocked when the fiscal period has configuration dependencies", async () => {
    reset({
        period: makePeriod(),
        usage: {
            accounts: 1,
        },
    });

    await assert.rejects(
        service.delete("period-1405"),
        /cannot be deleted because it has financial dependencies/
    );

    assert.equal(state.lastDelete, null);
});
