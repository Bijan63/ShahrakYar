const test = require("node:test");
const assert = require("node:assert/strict");

// ------------------------------------------------------
// Mock dependencies BEFORE loading the service.
// These tests must never connect to PostgreSQL.
// ------------------------------------------------------

const prismaPath = require.resolve("../src/config/prisma");
const ledgerPath = require.resolve("../src/services/accountLedger.service");
const reportPath = require.resolve("../src/services/financialReport.service");

const originalPrismaModule = require.cache[prismaPath];
const originalLedgerModule = require.cache[ledgerPath];
const originalReportModule = require.cache[reportPath];

const state = {
    fiscalPeriod: null,
    accounts: [],
    openingBalances: [],
    journalLines: [],
    account: null,
    childAccount: null,
    ledger: null,
};

const calls = {};

function recordCall(name, args) {
    calls[name] = args;
}

const fakePrisma = {
    fiscalPeriod: {
        async findUnique(args) {
            recordCall("fiscalPeriod.findUnique", args);
            return state.fiscalPeriod;
        },
    },

    account: {
        async findMany(args) {
            recordCall("account.findMany", args);
            return state.accounts;
        },

        async findUnique(args) {
            recordCall("account.findUnique", args);
            return state.account;
        },

        async findFirst(args) {
            recordCall("account.findFirst", args);
            return state.childAccount;
        },
    },

    openingBalance: {
        async findMany(args) {
            recordCall("openingBalance.findMany", args);

            if (args?.where?.status === "ACTIVE") {
                return state.openingBalances.filter(
                    (item) => item.status === "ACTIVE"
                );
            }

            return state.openingBalances;
        },
    },

    journalEntryLine: {
        async findMany(args) {
            recordCall("journalEntryLine.findMany", args);

            if (
                args?.where?.journalEntry?.status === "POSTED"
            ) {
                return state.journalLines.filter(
                    (line) => line.journalEntryStatus === "POSTED"
                );
            }

            return state.journalLines;
        },
    },
};

const fakeAccountLedgerService = {
    async getLedger(accountId, fiscalPeriodId) {
        recordCall("accountLedger.getLedger", {
            accountId,
            fiscalPeriodId,
        });

        return state.ledger;
    },
};

function installStub(path, exports) {
    require.cache[path] = {
        id: path,
        filename: path,
        loaded: true,
        exports,
    };
}

delete require.cache[reportPath];

installStub(prismaPath, fakePrisma);
installStub(ledgerPath, fakeAccountLedgerService);

const financialReportService = require(
    "../src/services/financialReport.service"
);

// Restore dependency caches. The loaded service retains its fake
// dependencies, so no real database connection can be made here.
if (originalPrismaModule) {
    require.cache[prismaPath] = originalPrismaModule;
} else {
    delete require.cache[prismaPath];
}

if (originalLedgerModule) {
    require.cache[ledgerPath] = originalLedgerModule;
} else {
    delete require.cache[ledgerPath];
}

if (originalReportModule) {
    require.cache[reportPath] = originalReportModule;
}


// ------------------------------------------------------
// Test Fixtures
// ------------------------------------------------------

const PERIOD_ID = "period-1405";
const ACCOUNT_ID = "account-cash";

function makeFiscalPeriod() {
    return {
        id: PERIOD_ID,
        code: "1405",
        name: "Fiscal Year 1405",
        startDate: new Date("2026-03-21T00:00:00.000Z"),
        endDate: new Date("2027-03-20T00:00:00.000Z"),
        status: "ACTIVE",
    };
}

function makeAccount(overrides = {}) {
    return {
        id: ACCOUNT_ID,
        code: "1101",
        name: "Cash",
        type: "ASSET",
        parentId: null,
        fiscalPeriodId: PERIOD_ID,
        isActive: true,
        ...overrides,
    };
}

function resetState() {
    for (const key of Object.keys(calls)) {
        delete calls[key];
    }

    state.fiscalPeriod = makeFiscalPeriod();
    state.accounts = [];
    state.openingBalances = [];
    state.journalLines = [];
    state.account = makeAccount();
    state.childAccount = null;

    state.ledger = {
        openingBalance: {
            id: "opening-1",
            debit: 100,
            credit: 0,
            balance: 100,
        },
        totalDebit: 125,
        totalCredit: 0,
        balance: 125,
        lines: [],
    };
}


// ------------------------------------------------------
// Financial Report Service Tests
// ------------------------------------------------------

test(
    "Financial Report Service - Trial Balance and General Ledger",
    async (t) => {

        // ==================================================
        // Trial Balance
        // ==================================================

        await t.test(
            "Reject Trial Balance without fiscalPeriodId",
            async () => {
                resetState();

                await assert.rejects(
                    financialReportService.getTrialBalance(),
                    /fiscalPeriodId is required/
                );

                assert.equal(
                    calls["fiscalPeriod.findUnique"],
                    undefined
                );
            }
        );


        await t.test(
            "Reject Trial Balance when fiscal period does not exist",
            async () => {
                resetState();
                state.fiscalPeriod = null;

                await assert.rejects(
                    financialReportService.getTrialBalance(PERIOD_ID),
                    /Fiscal period not found/
                );

                assert.deepEqual(
                    calls["fiscalPeriod.findUnique"],
                    {
                        where: {
                            id: PERIOD_ID,
                        },
                    }
                );
            }
        );


        await t.test(
            "Calculate Trial Balance using active opening balances and POSTED entries only",
            async () => {
                resetState();

                state.accounts = [
                    {
                        id: "parent",
                        code: "1000",
                        name: "Assets",
                        type: "ASSET",
                        parentId: null,
                        fiscalPeriodId: PERIOD_ID,
                    },
                    {
                        id: "cash",
                        code: "1101",
                        name: "Cash",
                        type: "ASSET",
                        parentId: "parent",
                        fiscalPeriodId: PERIOD_ID,
                    },
                    {
                        id: "equity",
                        code: "3000",
                        name: "Capital",
                        type: "EQUITY",
                        parentId: null,
                        fiscalPeriodId: PERIOD_ID,
                    },
                    {
                        id: "expense",
                        code: "5100",
                        name: "Operating Expense",
                        type: "EXPENSE",
                        parentId: null,
                        fiscalPeriodId: PERIOD_ID,
                    },
                ];

                state.openingBalances = [
                    {
                        accountId: "cash",
                        debit: 100,
                        credit: 0,
                        status: "ACTIVE",
                    },
                    {
                        accountId: "equity",
                        debit: 0,
                        credit: 100,
                        status: "ACTIVE",
                    },
                    {
                        accountId: "expense",
                        debit: 500,
                        credit: 0,
                        status: "INACTIVE",
                    },
                ];

                state.journalLines = [
                    {
                        accountId: "cash",
                        debit: 0,
                        credit: 30,
                        journalEntryStatus: "POSTED",
                    },
                    {
                        accountId: "expense",
                        debit: 30,
                        credit: 0,
                        journalEntryStatus: "POSTED",
                    },
                    {
                        accountId: "cash",
                        debit: 999,
                        credit: 0,
                        journalEntryStatus: "DRAFT",
                    },
                ];

                const result =
                    await financialReportService.getTrialBalance(
                        PERIOD_ID
                    );

                assert.equal(result.fiscalPeriod.id, PERIOD_ID);

                // Parent accounts must not appear in the report.
                assert.equal(
                    result.accounts.some(
                        (account) => account.accountId === "parent"
                    ),
                    false
                );

                assert.equal(result.accounts.length, 3);

                const cash = result.accounts.find(
                    (account) => account.accountId === "cash"
                );

                assert.equal(cash.openingDebit, 100);
                assert.equal(cash.openingCredit, 0);
                assert.equal(cash.periodDebit, 0);
                assert.equal(cash.periodCredit, 30);
                assert.equal(cash.debit, 100);
                assert.equal(cash.credit, 30);
                assert.equal(cash.balance, 70);
                assert.equal(cash.balanceSide, "DEBIT");

                const expense = result.accounts.find(
                    (account) => account.accountId === "expense"
                );

                assert.equal(expense.openingDebit, 0);
                assert.equal(expense.periodDebit, 30);
                assert.equal(expense.debit, 30);

                // Opening and journal totals must balance.
                assert.equal(result.totalDebit, 130);
                assert.equal(result.totalCredit, 130);
                assert.equal(result.difference, 0);
                assert.equal(result.isBalanced, true);

                // Verify that the service requests ACTIVE openings.
                assert.equal(
                    calls["openingBalance.findMany"].where.status,
                    "ACTIVE"
                );

                // Verify that journal query excludes non-POSTED entries.
                assert.equal(
                    calls["journalEntryLine.findMany"]
                        .where.journalEntry.status,
                    "POSTED"
                );
            }
        );


        // ==================================================
        // General Ledger
        // ==================================================

        await t.test(
            "Reject General Ledger without accountId",
            async () => {
                resetState();

                await assert.rejects(
                    financialReportService.getGeneralLedger(
                        PERIOD_ID,
                        undefined
                    ),
                    /accountId is required/
                );

                assert.equal(
                    calls["account.findUnique"],
                    undefined
                );
            }
        );


        await t.test(
            "Reject General Ledger for a non-existing account",
            async () => {
                resetState();
                state.account = null;

                await assert.rejects(
                    financialReportService.getGeneralLedger(
                        PERIOD_ID,
                        ACCOUNT_ID
                    ),
                    /Account not found/
                );
            }
        );


        await t.test(
            "Reject account belonging to another fiscal period",
            async () => {
                resetState();

                state.account = makeAccount({
                    fiscalPeriodId: "another-period",
                });

                await assert.rejects(
                    financialReportService.getGeneralLedger(
                        PERIOD_ID,
                        ACCOUNT_ID
                    ),
                    /Account does not belong to the selected fiscal period/
                );

                assert.equal(
                    calls["account.findFirst"],
                    undefined
                );
            }
        );


        await t.test(
            "Reject General Ledger for a parent account",
            async () => {
                resetState();

                state.childAccount = {
                    id: "child-account",
                    parentId: ACCOUNT_ID,
                };

                await assert.rejects(
                    financialReportService.getGeneralLedger(
                        PERIOD_ID,
                        ACCOUNT_ID
                    ),
                    /General ledger is only available for leaf accounts/
                );

                assert.equal(
                    calls["accountLedger.getLedger"],
                    undefined
                );
            }
        );


        await t.test(
            "Return General Ledger with correct opening and closing balances",
            async () => {
                resetState();

                const entryDate =
                    new Date("2026-04-01T10:00:00.000Z");

                state.ledger = {
                    openingBalance: {
                        id: "opening-1",
                        debit: 100,
                        credit: 0,
                        balance: 100,
                    },

                    totalDebit: 125,
                    totalCredit: 0,
                    balance: 125,

                    lines: [
                        {
                            id: "line-1",
                            type: "JOURNAL_ENTRY",
                            journalEntryId: "entry-1",
                            entryNumber: "JV-1405-001",
                            entryDate,
                            description: "Cash receipt",
                            debit: 25,
                            credit: 0,
                            balance: 125,
                        },
                    ],
                };

                const result =
                    await financialReportService.getGeneralLedger(
                        PERIOD_ID,
                        ACCOUNT_ID
                    );

                assert.equal(result.fiscalPeriod.id, PERIOD_ID);
                assert.equal(result.account.id, ACCOUNT_ID);

                assert.equal(result.openingBalance.debit, 100);
                assert.equal(result.openingBalance.credit, 0);
                assert.equal(result.openingBalance.balance, 100);
                assert.equal(result.openingBalance.balanceSide, "DEBIT");

                assert.equal(result.totalDebit, 125);
                assert.equal(result.totalCredit, 0);
                assert.equal(result.closingBalance, 125);
                assert.equal(result.closingBalanceSide, "DEBIT");

                assert.equal(result.lines.length, 1);
                assert.equal(result.lines[0].id, "line-1");
                assert.equal(result.lines[0].debit, 25);
                assert.equal(result.lines[0].credit, 0);
                assert.equal(result.lines[0].balance, 125);
                assert.equal(result.lines[0].balanceSide, "DEBIT");

                assert.deepEqual(
                    calls["accountLedger.getLedger"],
                    {
                        accountId: ACCOUNT_ID,
                        fiscalPeriodId: PERIOD_ID,
                    }
                );
            }
        );

    }
);

// ------------------------------------------------------
// Balance Sheet and Income Statement Tests
// ------------------------------------------------------

function prepareFinancialStatementFixture() {
    resetState();

    state.accounts = [
        {
            id: "assets-parent",
            code: "1000",
            name: "Assets",
            type: "ASSET",
            parentId: null,
            fiscalPeriodId: PERIOD_ID,
        },
        {
            id: "cash",
            code: "1101",
            name: "Cash",
            type: "ASSET",
            parentId: "assets-parent",
            fiscalPeriodId: PERIOD_ID,
        },
        {
            id: "liability",
            code: "2100",
            name: "Liabilities",
            type: "LIABILITY",
            parentId: null,
            fiscalPeriodId: PERIOD_ID,
        },
        {
            id: "equity",
            code: "3000",
            name: "Equity",
            type: "EQUITY",
            parentId: null,
            fiscalPeriodId: PERIOD_ID,
        },
        {
            id: "revenue",
            code: "4100",
            name: "Revenue",
            type: "REVENUE",
            parentId: null,
            fiscalPeriodId: PERIOD_ID,
        },
        {
            id: "expense",
            code: "5100",
            name: "Expense",
            type: "EXPENSE",
            parentId: null,
            fiscalPeriodId: PERIOD_ID,
        },
    ];

    state.openingBalances = [
        {
            accountId: "cash",
            debit: 1000,
            credit: 0,
            status: "ACTIVE",
        },
        {
            accountId: "liability",
            debit: 0,
            credit: 300,
            status: "ACTIVE",
        },
        {
            accountId: "equity",
            debit: 0,
            credit: 700,
            status: "ACTIVE",
        },
    ];

    state.journalLines = [
        {
            accountId: "cash",
            debit: 200,
            credit: 0,
            journalEntryStatus: "POSTED",
        },
        {
            accountId: "revenue",
            debit: 0,
            credit: 200,
            journalEntryStatus: "POSTED",
        },
        {
            accountId: "expense",
            debit: 50,
            credit: 0,
            journalEntryStatus: "POSTED",
        },
        {
            accountId: "cash",
            debit: 0,
            credit: 50,
            journalEntryStatus: "POSTED",
        },
        {
            accountId: "cash",
            debit: 5000,
            credit: 0,
            journalEntryStatus: "DRAFT",
        },
    ];
}


test(
    "Financial Report Service - Balance Sheet",
    async (t) => {

        await t.test(
            "Calculate assets, liabilities, equity and current net income",
            async () => {
                prepareFinancialStatementFixture();

                const result =
                    await financialReportService.getBalanceSheet(
                        PERIOD_ID
                    );

                assert.equal(result.fiscalPeriod.id, PERIOD_ID);

                assert.equal(result.assets.total, 1150);
                assert.equal(result.liabilities.total, 300);
                assert.equal(result.equity.total, 700);

                assert.equal(result.currentPeriod.revenue, 200);
                assert.equal(result.currentPeriod.expenses, 50);
                assert.equal(result.currentPeriod.netIncome, 150);

                assert.equal(result.totalAssets, 1150);
                assert.equal(result.totalLiabilitiesAndEquity, 1150);

                assert.equal(result.difference, 0);
                assert.equal(result.isBalanced, true);

                // Parent accounts must not be included.
                assert.equal(
                    result.assets.accounts.some(
                        account => account.accountId === "assets-parent"
                    ),
                    false
                );

                // DRAFT journal entries must not affect balances.
                assert.equal(
                    result.assets.total,
                    1150
                );
            }
        );


        await t.test(
            "Reject Balance Sheet when fiscal period does not exist",
            async () => {
                resetState();
                state.fiscalPeriod = null;

                await assert.rejects(
                    financialReportService.getBalanceSheet(PERIOD_ID),
                    /Fiscal period not found/
                );
            }
        );

    }
);


test(
    "Financial Report Service - Income Statement",
    async (t) => {

        await t.test(
            "Calculate revenue, expenses and net income using POSTED entries",
            async () => {
                prepareFinancialStatementFixture();

                const result =
                    await financialReportService.getIncomeStatement(
                        PERIOD_ID
                    );

                assert.equal(result.fiscalPeriod.id, PERIOD_ID);

                assert.equal(result.revenue.total, 200);
                assert.equal(result.expenses.total, 50);
                assert.equal(result.netIncome, 150);

                assert.equal(result.revenue.accounts.length, 1);
                assert.equal(result.expenses.accounts.length, 1);

                assert.equal(
                    result.revenue.accounts[0].accountId,
                    "revenue"
                );

                assert.equal(
                    result.expenses.accounts[0].accountId,
                    "expense"
                );
            }
        );


        await t.test(
            "Reject Income Statement when fiscal period does not exist",
            async () => {
                resetState();
                state.fiscalPeriod = null;

                await assert.rejects(
                    financialReportService.getIncomeStatement(PERIOD_ID),
                    /Fiscal period not found/
                );
            }
        );


        await t.test(
            "Document current behavior when revenue and expense opening balances exist",
            async () => {
                resetState();

                state.accounts = [
                    {
                        id: "revenue",
                        code: "4100",
                        name: "Revenue",
                        type: "REVENUE",
                        parentId: null,
                        fiscalPeriodId: PERIOD_ID,
                    },
                    {
                        id: "expense",
                        code: "5100",
                        name: "Expense",
                        type: "EXPENSE",
                        parentId: null,
                        fiscalPeriodId: PERIOD_ID,
                    },
                ];

                state.openingBalances = [
                    {
                        accountId: "revenue",
                        debit: 0,
                        credit: 20,
                        status: "ACTIVE",
                    },
                    {
                        accountId: "expense",
                        debit: 5,
                        credit: 0,
                        status: "ACTIVE",
                    },
                ];

                const result =
                    await financialReportService.getIncomeStatement(
                        PERIOD_ID
                    );

                // Current implementation includes opening balances
                // in revenue and expense totals.
                assert.equal(result.revenue.total, 20);
                assert.equal(result.expenses.total, 5);
                assert.equal(result.netIncome, 15);
            }
        );

    }
);
