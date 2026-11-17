const prisma =
    require("../config/prisma");

const accountLedgerService =
    require("./accountLedger.service");


// ======================================================
// Financial Report Service
// ======================================================

class FinancialReportService {


    // ==================================================
    // Constants
    // ==================================================

    // --------------------------------------------------
    // Only POSTED journal entries are valid for
    // financial reports.
    // --------------------------------------------------

    static POSTED_STATUS =
        "POSTED";


    // ==================================================
    // Helpers
    // ==================================================

    // --------------------------------------------------
    // Validate Fiscal Period
    // --------------------------------------------------

    async validateFiscalPeriod(
        fiscalPeriodId
    ) {

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const fiscalPeriod =
            await prisma.fiscalPeriod.findUnique({

                where: {
                    id: fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        return fiscalPeriod;

    }


    // --------------------------------------------------
    // Get Accounts
    // --------------------------------------------------

    async getAccounts(
        fiscalPeriodId
    ) {

        return prisma.account.findMany({

            where: {

                fiscalPeriodId

            },

            orderBy: {

                code: "asc"

            }

        });

    }


    // --------------------------------------------------
    // Find Parent Account IDs
    // --------------------------------------------------

    getParentIds(
        accounts
    ) {

        return new Set(

            accounts

                .filter(
                    account =>
                        account.parentId !== null
                )

                .map(
                    account =>
                        account.parentId
                )

        );

    }


    // --------------------------------------------------
    // Get Opening Balances
    // --------------------------------------------------

    async getOpeningBalances(
        fiscalPeriodId
    ) {

        return prisma.openingBalance.findMany({

            where: {

                fiscalPeriodId,

                status: "ACTIVE"

            }

        });

    }


    // --------------------------------------------------
    // Create Opening Balance Map
    // --------------------------------------------------

    createOpeningBalanceMap(
        openingBalances
    ) {

        const openingBalanceMap =
            new Map();


        for (
            const opening of openingBalances
        ) {

            openingBalanceMap.set(

                opening.accountId,

                opening

            );

        }


        return openingBalanceMap;

    }


    // --------------------------------------------------
    // Get POSTED Journal Lines
    // --------------------------------------------------
    //
    // IMPORTANT:
    // Only JournalEntry.status = POSTED is allowed
    // to participate in financial reports.
    // --------------------------------------------------

    async getPostedJournalLines(
        fiscalPeriodId,
        select
    ) {

        return prisma.journalEntryLine.findMany({

            where: {

                journalEntry: {

                    fiscalPeriodId,

                    status:
                        FinancialReportService.POSTED_STATUS

                }

            },

            select

        });

    }


    // --------------------------------------------------
    // Build Journal Totals Map
    // --------------------------------------------------

    buildJournalTotalsMap(
        journalLines
    ) {

        const journalTotalsMap =
            new Map();


        for (
            const line of journalLines
        ) {

            if (
                !journalTotalsMap.has(
                    line.accountId
                )
            ) {

                journalTotalsMap.set(

                    line.accountId,

                    {
                        debit: 0,
                        credit: 0
                    }

                );

            }


            const totals =
                journalTotalsMap.get(
                    line.accountId
                );


            totals.debit +=
                Number(
                    line.debit || 0
                );


            totals.credit +=
                Number(
                    line.credit || 0
                );

        }


        return journalTotalsMap;

    }


    // --------------------------------------------------
    // Build Account Balances
    // --------------------------------------------------

    buildAccountBalances(
        accounts,
        openingBalanceMap,
        journalTotalsMap
    ) {

        return accounts.map(

            account => {

                const opening =
                    openingBalanceMap.get(
                        account.id
                    );


                const openingDebit =
                    opening
                        ? Number(
                            opening.debit || 0
                        )
                        : 0;


                const openingCredit =
                    opening
                        ? Number(
                            opening.credit || 0
                        )
                        : 0;


                const journalTotals =
                    journalTotalsMap.get(
                        account.id
                    ) || {

                        debit: 0,
                        credit: 0

                    };


                const periodDebit =
                    Number(
                        journalTotals.debit || 0
                    );


                const periodCredit =
                    Number(
                        journalTotals.credit || 0
                    );


                const debit =
                    openingDebit +
                    periodDebit;


                const credit =
                    openingCredit +
                    periodCredit;


                const balance =
                    debit -
                    credit;


                return {

                    accountId:
                        account.id,

                    code:
                        account.code,

                    name:
                        account.name,

                    type:
                        account.type,

                    parentId:
                        account.parentId,

                    openingDebit,

                    openingCredit,

                    periodDebit,

                    periodCredit,

                    debit,

                    credit,

                    balance,

                    balanceSide:
                        balance > 0
                            ? "DEBIT"
                            : balance < 0
                                ? "CREDIT"
                                : "ZERO"

                };

            }

        );

    }


    // ==================================================
    // Trial Balance
    // ==================================================

    async getTrialBalance(
        fiscalPeriodId
    ) {

        const fiscalPeriod =
            await this.validateFiscalPeriod(
                fiscalPeriodId
            );


        const accounts =
            await this.getAccounts(
                fiscalPeriodId
            );


        const parentIds =
            this.getParentIds(
                accounts
            );


        const leafAccounts =
            accounts.filter(

                account =>
                    !parentIds.has(
                        account.id
                    )

            );


        const openingBalances =
            await this.getOpeningBalances(
                fiscalPeriodId
            );


        const openingBalanceMap =
            this.createOpeningBalanceMap(
                openingBalances
            );


        const journalLines =
            await this.getPostedJournalLines(

                fiscalPeriodId,

                {

                    accountId: true,

                    debit: true,

                    credit: true

                }

            );


        const journalTotalsMap =
            this.buildJournalTotalsMap(
                journalLines
            );


        const resultAccounts = [];


        let totalDebit = 0;

        let totalCredit = 0;


        for (
            const account of leafAccounts
        ) {

            const opening =
                openingBalanceMap.get(
                    account.id
                );


            const openingDebit =
                opening
                    ? Number(
                        opening.debit || 0
                    )
                    : 0;


            const openingCredit =
                opening
                    ? Number(
                        opening.credit || 0
                    )
                    : 0;


            const journalTotals =
                journalTotalsMap.get(
                    account.id
                ) || {

                    debit: 0,
                    credit: 0

                };


            const periodDebit =
                Number(
                    journalTotals.debit || 0
                );


            const periodCredit =
                Number(
                    journalTotals.credit || 0
                );


            const debit =
                openingDebit +
                periodDebit;


            const credit =
                openingCredit +
                periodCredit;


            const balance =
                debit -
                credit;


            const balanceSide =
                balance > 0
                    ? "DEBIT"
                    : balance < 0
                        ? "CREDIT"
                        : "ZERO";


            totalDebit +=
                debit;


            totalCredit +=
                credit;


            resultAccounts.push({

                accountId:
                    account.id,

                code:
                    account.code,

                name:
                    account.name,

                type:
                    account.type,

                parentId:
                    account.parentId,

                openingDebit,

                openingCredit,

                periodDebit,

                periodCredit,

                debit,

                credit,

                balance,

                balanceSide

            });

        }


        const difference =
            totalDebit -
            totalCredit;


        const isBalanced =
            Math.abs(
                difference
            ) < 0.000001;


        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            totalDebit,

            totalCredit,

            difference,

            isBalanced,

            accounts:
                resultAccounts

        };

    }


    // ==================================================
    // General Ledger
    // ==================================================

    async getGeneralLedger(
        fiscalPeriodId,
        accountId
    ) {

        const fiscalPeriod =
            await this.validateFiscalPeriod(
                fiscalPeriodId
            );


        if (!accountId) {

            throw new Error(
                "accountId is required"
            );

        }


        const account =
            await prisma.account.findUnique({

                where: {
                    id: accountId
                }

            });


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        if (
            account.fiscalPeriodId &&
            account.fiscalPeriodId !== fiscalPeriodId
        ) {

            throw new Error(
                "Account does not belong to the selected fiscal period"
            );

        }


        const childAccount =
            await prisma.account.findFirst({

                where: {

                    parentId:
                        accountId

                }

            });


        if (childAccount) {

            throw new Error(
                `General ledger is only available for leaf accounts: ${account.code}`
            );

        }


        const ledger =
            await accountLedgerService.getLedger(

                accountId,

                fiscalPeriodId

            );


        const lines =
            ledger.lines.map(

                line => {

                    const balance =
                        Number(
                            line.balance || 0
                        );


                    return {

                        id:
                            line.id,

                        type:
                            line.type,

                        journalEntryId:
                            line.journalEntryId,

                        entryNumber:
                            line.entryNumber,

                        entryDate:
                            line.entryDate,

                        description:
                            line.description,

                        debit:
                            Number(
                                line.debit || 0
                            ),

                        credit:
                            Number(
                                line.credit || 0
                            ),

                        balance,

                        balanceSide:
                            balance > 0
                                ? "DEBIT"
                                : balance < 0
                                    ? "CREDIT"
                                    : "ZERO"

                    };

                }

            );


        const closingBalance =
            Number(
                ledger.balance || 0
            );


        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            account: {

                id:
                    account.id,

                code:
                    account.code,

                name:
                    account.name,

                type:
                    account.type

            },

            openingBalance: {

                id:
                    ledger.openingBalance.id,

                debit:
                    Number(
                        ledger.openingBalance.debit || 0
                    ),

                credit:
                        Number(
                        ledger.openingBalance.credit || 0
                    ),

                balance:
                    Number(
                        ledger.openingBalance.balance || 0
                    ),

                balanceSide:
                    Number(
                        ledger.openingBalance.balance || 0
                    ) > 0
                        ? "DEBIT"
                        : Number(
                            ledger.openingBalance.balance || 0
                        ) < 0
                            ? "CREDIT"
                            : "ZERO"

            },

            totalDebit:
                Number(
                    ledger.totalDebit || 0
                ),

            totalCredit:
                Number(
                    ledger.totalCredit || 0
                ),

            closingBalance,

            closingBalanceSide:
                closingBalance > 0
                    ? "DEBIT"
                    : closingBalance < 0
                        ? "CREDIT"
                        : "ZERO",

            lines

        };

    }


    // ==================================================
    // Balance Sheet
    // ==================================================

    async getBalanceSheet(
        fiscalPeriodId
    ) {

        console.log(
            ">>> BALANCE SHEET SERVICE - POSTED ONLY <<<"
        );


        const fiscalPeriod =
            await this.validateFiscalPeriod(
                fiscalPeriodId
            );


        const accounts =
            await this.getAccounts(
                fiscalPeriodId
            );


        const parentIds =
            this.getParentIds(
                accounts
            );


        const openingBalances =
            await this.getOpeningBalances(
                fiscalPeriodId
            );


        const openingBalanceMap =
            this.createOpeningBalanceMap(
                openingBalances
            );


        const journalLines =
            await this.getPostedJournalLines(

                fiscalPeriodId,

                {

                    accountId: true,

                    debit: true,

                    credit: true

                }

            );


        const journalTotalsMap =
            this.buildJournalTotalsMap(
                journalLines
            );


        const accountBalances =
            this.buildAccountBalances(

                accounts,

                openingBalanceMap,

                journalTotalsMap

            );


        const leafAccounts =
            accountBalances.filter(

                account =>
                    !parentIds.has(
                        account.accountId
                    )

            );


        const assets = [];

        const liabilities = [];

        const equity = [];


        for (
            const account of leafAccounts
        ) {

            if (
                account.type === "ASSET"
            ) {

                assets.push(
                    account
                );

            }


            if (
                account.type === "LIABILITY"
            ) {

                liabilities.push(
                    account
                );

            }


            if (
                account.type === "EQUITY"
            ) {

                equity.push(
                    account
                );

            }

        }


        const totalAssets =
            assets.reduce(

                (sum, account) =>
                    sum + account.balance,

                0

            );


        const totalLiabilities =
            liabilities.reduce(

                (sum, account) =>
                    sum + (
                        -account.balance
                    ),

                0

            );


        const totalEquity =
            equity.reduce(

                (sum, account) =>
                    sum + (
                        -account.balance
                    ),

                0

            );


        const revenueAccounts =
            leafAccounts.filter(

                account =>
                    account.type === "REVENUE"

            );


        const totalRevenue =
            revenueAccounts.reduce(

                (sum, account) =>
                    sum + (
                        -account.balance
                    ),

                0

            );


        const expenseAccounts =
            leafAccounts.filter(

                account =>
                    account.type === "EXPENSE"

            );


        const totalExpenses =
            expenseAccounts.reduce(

                (sum, account) =>
                    sum + account.balance,

                0

            );


        const netIncome =
            totalRevenue -
            totalExpenses;


        const totalLiabilitiesAndEquity =
            totalLiabilities +
            totalEquity +
            netIncome;


        const difference =
            totalAssets -
            totalLiabilitiesAndEquity;


        console.log(
            ">>> BALANCE SHEET DEBUG <<<",
            {

                totalAssets,

                totalLiabilities,

                totalEquity,

                totalRevenue,

                totalExpenses,

                netIncome,

                totalLiabilitiesAndEquity,

                difference

            }
        );


        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            assets: {

                total:
                    totalAssets,

                accounts:
                    assets

            },

            liabilities: {

                total:
                    totalLiabilities,

                accounts:
                    liabilities

            },

            equity: {

                total:
                    totalEquity,

                accounts:
                    equity

            },

            currentPeriod: {

                revenue:
                    totalRevenue,

                expenses:
                    totalExpenses,

                netIncome

            },

            totalAssets,

            totalLiabilitiesAndEquity,

            difference,

            isBalanced:
                Math.abs(
                    difference
                ) < 0.000001

        };

    }


    // ==================================================
    // Income Statement
    // ==================================================

    async getIncomeStatement(
        fiscalPeriodId
    ) {

        console.log(
            ">>> INCOME STATEMENT SERVICE - POSTED ONLY <<<"
        );


        const fiscalPeriod =
            await this.validateFiscalPeriod(
                fiscalPeriodId
            );


        const accounts =
            await this.getAccounts(
                fiscalPeriodId
            );


        const parentIds =
            this.getParentIds(
                accounts
            );


        const openingBalances =
            await this.getOpeningBalances(
                fiscalPeriodId
            );


        const openingBalanceMap =
            this.createOpeningBalanceMap(
                openingBalances
            );


        const journalLines =
            await this.getPostedJournalLines(

                fiscalPeriodId,

                {

                    accountId: true,

                    debit: true,

                    credit: true

                }

            );


        const journalTotalsMap =
            this.buildJournalTotalsMap(
                journalLines
            );


        const accountBalances =
            this.buildAccountBalances(

                accounts,

                openingBalanceMap,

                journalTotalsMap

            );


        const leafAccounts =
            accountBalances.filter(

                account =>
                    !parentIds.has(
                        account.accountId
                    )

            );


        const revenueAccounts =
            leafAccounts.filter(

                account =>
                    account.type === "REVENUE"

            );


        const expenseAccounts =
            leafAccounts.filter(

                account =>
                    account.type === "EXPENSE"

            );


        const totalRevenue =
            revenueAccounts.reduce(

                (sum, account) =>
                    sum +
                    (
                        -account.balance
                    ),

                0

            );


        const totalExpenses =
            expenseAccounts.reduce(

                (sum, account) =>
                    sum +
                    account.balance,

                0

            );


        const netIncome =
            totalRevenue -
            totalExpenses;


        console.log(

            ">>> INCOME STATEMENT DEBUG <<<",

            {

                totalRevenue,

                totalExpenses,

                netIncome

            }

        );


        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            revenue: {

                total:
                    totalRevenue,

                accounts:
                    revenueAccounts

            },

            expenses: {

                total:
                    totalExpenses,

                accounts:
                    expenseAccounts

            },

            netIncome

        };

    }


    // ==================================================
    // Cash Flow Statement
    // ==================================================

    async getCashFlowStatement(
        fiscalPeriodId
    ) {

        console.log(
            ">>> CASH FLOW STATEMENT SERVICE - POSTED ONLY <<<"
        );


        const fiscalPeriod =
            await this.validateFiscalPeriod(
                fiscalPeriodId
            );


        const accounts =
            await this.getAccounts(
                fiscalPeriodId
            );


        const parentIds =
            this.getParentIds(
                accounts
            );


        // ------------------------------------------------
        // Cash / Bank Accounts
        // ------------------------------------------------
        //
        // 1100 = parent
        // 1101..1104 = leaf cash / bank accounts
        // ------------------------------------------------

        const cashAccounts =
            accounts.filter(
                account =>
                    account.code.startsWith("11") &&
                    !parentIds.has(account.id)
            );


        const cashAccountIds =
            new Set(
                cashAccounts.map(
                    account =>
                        account.id
                )
            );


        const cashAccountMap =
            new Map(
                cashAccounts.map(
                    account => [
                        account.id,
                        account
                    ]
                )
            );


        // ------------------------------------------------
        // Opening Balances
        // ------------------------------------------------

        const openingBalances =
            await prisma.openingBalance.findMany({

                where: {

                    fiscalPeriodId,

                    status: "ACTIVE",

                    accountId: {
                        in:
                            Array.from(
                                cashAccountIds
                            )
                    }

                }

            });


        const openingBalanceMap =
            new Map(
                openingBalances.map(
                    opening => [
                        opening.accountId,
                        opening
                    ]
                )
            );


        let openingCash = 0;

        const openingCashAccounts = [];


        for (
            const opening of openingBalances
        ) {

            const account =
                cashAccountMap.get(
                    opening.accountId
                );


            if (!account) {

                continue;

            }


            const debit =
                Number(
                    opening.debit || 0
                );


            const credit =
                Number(
                    opening.credit || 0
                );


            const balance =
                debit -
                credit;


            openingCash +=
                balance;


            openingCashAccounts.push({

                accountId:
                    account.id,

                code:
                    account.code,

                name:
                    account.name,

                debit,

                credit,

                balance,

                balanceSide:
                    balance > 0
                        ? "DEBIT"
                        : balance < 0
                            ? "CREDIT"
                            : "ZERO"

            });

        }


        // ------------------------------------------------
        // Get POSTED Cash Journal Lines
        // ------------------------------------------------

        const journalLines =
            await prisma.journalEntryLine.findMany({

                where: {

                    accountId: {
                        in:
                            Array.from(
                                cashAccountIds
                            )
                    },

                    journalEntry: {

                        fiscalPeriodId,

                        status:
                            FinancialReportService.POSTED_STATUS

                    }

                },

                select: {

                    id: true,

                    accountId: true,

                    debit: true,

                    credit: true,

                    journalEntry: {

                        select: {

                            id: true,

                            entryNumber: true,

                            entryDate: true,

                            description: true

                        }

                    }

                },

                orderBy: [

                    {

                        journalEntry: {

                            entryDate: "asc"

                        }

                    },

                    {

                        createdAt: "asc"

                    },

                    {

                        id: "asc"

                    }

                ]

            });
         // ------------------------------------------------
        // Related Journal Entries
        // ------------------------------------------------

        const journalEntryIds =
            Array.from(
                new Set(
                    journalLines.map(
                        line =>
                            line.journalEntry.id
                    )
                )
            );


        const allRelatedLines =
            journalEntryIds.length > 0

                ? await prisma.journalEntryLine.findMany({

                    where: {

                        journalEntryId: {
                            in:
                                journalEntryIds
                        },

                        journalEntry: {

                            fiscalPeriodId,

                            status:
                                FinancialReportService.POSTED_STATUS

                        }

                    },

                    select: {

                        id: true,

                        journalEntryId: true,

                        accountId: true,

                        debit: true,

                        credit: true,

                        createdAt: true,

                        account: {

                            select: {

                                id: true,

                                code: true,

                                name: true,

                                type: true,

                                cashFlowClassification: true

                            }

                        }

                    },

                    orderBy: [

                        {
                            createdAt: "asc"
                        },

                        {
                            id: "asc"
                        }

                    ]

                })

                : [];


        // ------------------------------------------------
        // Group Lines By Journal Entry
        // ------------------------------------------------

        const linesByEntry =
            new Map();


        for (
            const line of allRelatedLines
        ) {

            if (
                !linesByEntry.has(
                    line.journalEntryId
                )
            ) {

                linesByEntry.set(
                    line.journalEntryId,
                    []
                );

            }


            linesByEntry
                .get(
                    line.journalEntryId
                )
                .push(line);

        }


        // ------------------------------------------------
        // Cash Flow Buckets
        // ------------------------------------------------

        const operatingInflows = [];

        const operatingOutflows = [];

        const investingInflows = [];

        const investingOutflows = [];

        const financingInflows = [];

        const financingOutflows = [];

        const internalTransfers = [];

        const unmappedCashMovements = [];


        // ------------------------------------------------
        // Helper: Numeric Amount
        // ------------------------------------------------

        const getDebit =
            line =>
                Number(
                    line.debit || 0
                );


        const getCredit =
            line =>
                Number(
                    line.credit || 0
                );


        const getLineAmount =
            line =>
                getDebit(line) > 0
                    ? getDebit(line)
                    : getCredit(line);

// ------------------------------------------------
// Helper: Cash Flow Classification
// ------------------------------------------------
//
// Priority:
//
// 1. Explicit Account.cashFlowClassification
// 2. Revenue / Expense => OPERATING
// 3. NONE for unclassified accounts
//
// IMPORTANT:
// Asset / Liability / Equity accounts must NOT
// automatically become OPERATING.
//
// Their classification must be explicitly configured
// as INVESTING or FINANCING where applicable.
// ------------------------------------------------

const classifyCounterpart =
    counterpart => {

        if (!counterpart) {

            return "NONE";

        }


        const explicitClassification =
            counterpart.account
                ?.cashFlowClassification;


        // ------------------------------------------------
        // Explicit classification
        // ------------------------------------------------

        if (
            explicitClassification &&
            explicitClassification !== "NONE"
        ) {

            return explicitClassification;

        }


        // ------------------------------------------------
        // Existing operating accounts
        // ------------------------------------------------

        if (
            counterpart.account.type ===
            "REVENUE"
        ) {

            return "OPERATING";

        }


        if (
            counterpart.account.type ===
            "EXPENSE"
        ) {

            return "OPERATING";

        }


        // ------------------------------------------------
        // Unclassified balance-sheet account
        // ------------------------------------------------

        return "NONE";

    };


        // ------------------------------------------------
        // Add Movement To Bucket
        // ------------------------------------------------

        const addMovement =
            (
                classification,
                direction,
                movement
            ) => {

                if (
                    classification ===
                    "OPERATING"
                ) {

                    if (
                        direction ===
                        "INFLOW"
                    ) {

                        operatingInflows.push(
                            movement
                        );

                    }
                    else {

                        operatingOutflows.push(
                            movement
                        );

                    }

                    return;

                }


                if (
                    classification ===
                    "INVESTING"
                ) {

                    if (
                        direction ===
                        "INFLOW"
                    ) {

                        investingInflows.push(
                            movement
                        );

                    }
                    else {

                        investingOutflows.push(
                            movement
                        );

                    }

                    return;

                }


                if (
                    classification ===
                    "FINANCING"
                ) {

                    if (
                        direction ===
                        "INFLOW"
                    ) {

                        financingInflows.push(
                            movement
                        );

                    }
                    else {

                        financingOutflows.push(
                            movement
                        );

                    }

                    return;

                }


                // ------------------------------------------------
                // Unmapped Cash Movement
                // ------------------------------------------------
                //
                // NONE must not be silently discarded.
                // It is kept separately for audit / mapping review.
                // It does not participate in Operating / Investing /
                // Financing totals or netChangeInCash.
                // ------------------------------------------------

                if (
                    classification ===
                    "NONE"
                ) {

                    unmappedCashMovements.push(
                        movement
                    );

                    return;

                }

            };


        // ------------------------------------------------
        // Process Each Journal Entry ONCE
        // ------------------------------------------------
        //
        // Important:
        //
        // We process an entire Journal Entry as one
        // accounting event.
        //
        // This prevents:
        //
        // Cash 10M
        // Expense A 6M
        // Expense B 4M
        //
        // from becoming 20M in the report.
        // ------------------------------------------------

        const processedEntryIds =
            new Set();


        for (
            const cashLine of journalLines
        ) {

            const entry =
                cashLine.journalEntry;


            if (
                processedEntryIds.has(
                    entry.id
                )
            ) {

                continue;

            }


            processedEntryIds.add(
                entry.id
            );


            const relatedLines =
                linesByEntry.get(
                    entry.id
                ) || [];


            const entryCashLines =
                relatedLines.filter(
                    line =>
                        cashAccountIds.has(
                            line.accountId
                        )
                );


            const entryNonCashLines =
                relatedLines.filter(
                    line =>
                        !cashAccountIds.has(
                            line.accountId
                        )
                );


            // ------------------------------------------------
            // No Cash Lines
            // ------------------------------------------------

            if (
                entryCashLines.length === 0
            ) {

                continue;

            }


            // ------------------------------------------------
            // Build Cash Line Working State
            // ------------------------------------------------

            const cashWorking =
                entryCashLines.map(
                    line => ({

                        line,

                        account:
                            cashAccountMap.get(
                                line.accountId
                            ),

                        debit:
                            getDebit(line),

                        credit:
                            getCredit(line),

                        remainingDebit:
                            getDebit(line),

                        remainingCredit:
                            getCredit(line)

                    })
                );


            // ------------------------------------------------
            // STEP 1
            // Match Cash-to-Cash Amounts
            // ------------------------------------------------
            //
            // Example:
            //
            // Bank A       Debit  2M
            // Bank B       Credit 2M
            //
            // The 2M is an internal transfer.
            //
            // We remove the matched amount from both cash
            // lines before processing external counterparts.
            // ------------------------------------------------

            for (
                const debitCash of cashWorking
            ) {

                if (
                    debitCash.remainingDebit <= 0
                ) {

                    continue;

                }


                for (
                    const creditCash of cashWorking
                ) {

                    if (
                        creditCash ===
                        debitCash
                    ) {

                        continue;

                    }


                    if (
                        creditCash.remainingCredit <= 0
                    ) {

                        continue;

                    }


                    const matchedAmount =
                        Math.min(
                            debitCash.remainingDebit,
                            creditCash.remainingCredit
                        );


                    if (
                        matchedAmount <= 0
                    ) {

                        continue;

                    }


                    debitCash.remainingDebit -=
                        matchedAmount;


                    creditCash.remainingCredit -=
                        matchedAmount;


                    internalTransfers.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        entryDate:
                            entry.entryDate,

                        description:
                            entry.description,

                        cashAccountId:
                            debitCash.account.id,

                        cashAccountCode:
                            debitCash.account.code,

                        cashAccountName:
                            debitCash.account.name,

                        debit:
                            matchedAmount,

                        credit:
                            0,

                        transferType:
                            "IN"

                    });


                    internalTransfers.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        entryDate:
                            entry.entryDate,

                        description:
                            entry.description,

                        cashAccountId:
                            creditCash.account.id,

                        cashAccountCode:
                            creditCash.account.code,

                        cashAccountName:
                            creditCash.account.name,

                        debit:
                            0,

                        credit:
                            matchedAmount,

                        transferType:
                            "OUT"

                    });

                }

            }


            // ------------------------------------------------
            // STEP 2
            // External Cash Lines
            // ------------------------------------------------

            const externalCashLines =
                cashWorking.filter(
                    cash =>
                        cash.remainingDebit > 0 ||
                        cash.remainingCredit > 0
                );


            // ------------------------------------------------
            // No External Cash
            // ------------------------------------------------
            //
            // A pure cash-to-cash transfer is already fully
            // handled above.
            // ------------------------------------------------

            if (
                externalCashLines.length === 0
            ) {

                continue;

            }


            // ------------------------------------------------
            // Build Counterpart Pools
            // ------------------------------------------------
            //
            // For a cash DEBIT, the corresponding external
            // counterpart must normally be a CREDIT.
            //
            // For a cash CREDIT, the corresponding external
            // counterpart must normally be a DEBIT.
            // ------------------------------------------------

            const creditCounterparts =
                entryNonCashLines.filter(
                    line =>
                        getCredit(line) > 0
                );


            const debitCounterparts =
                entryNonCashLines.filter(
                    line =>
                        getDebit(line) > 0
                );


            const totalCreditCounterparts =
                creditCounterparts.reduce(
                    (
                        sum,
                        line
                    ) =>
                        sum +
                        getCredit(line),
                    0
                );


            const totalDebitCounterparts =
                debitCounterparts.reduce(
                    (
                        sum,
                        line
                    ) =>
                        sum +
                        getDebit(line),
                    0
                );


            const totalExternalCashDebit =
                externalCashLines.reduce(
                    (
                        sum,
                        cash
                    ) =>
                        sum +
                        cash.remainingDebit,
                    0
                );


            const totalExternalCashCredit =
                externalCashLines.reduce(
                    (
                        sum,
                        cash
                    ) =>
                        sum +
                        cash.remainingCredit,
                    0
                );


            // ------------------------------------------------
            // STEP 3
            // Allocate Cash DEBITS Against Credit
            // Counterparts
            // ------------------------------------------------
            //
            // Allocation is proportional.
            //
            // Example:
            //
            // Bank A Debit 6M
            // Bank B Debit 4M
            // Expense Credit 10M
            //
            // Result:
            //
            // Bank A -> Expense 6M
            // Bank B -> Expense 4M
            //
            // Total = 10M
            // ------------------------------------------------

            if (
                totalExternalCashDebit > 0
            ) {

                for (
                    const cash of externalCashLines
                ) {

                    if (
                        cash.remainingDebit <= 0
                    ) {

                        continue;

                    }


                    if (
                        totalCreditCounterparts <= 0
                    ) {

                        console.warn(
                            ">>> CASH FLOW WARNING: " +
                            `Entry ${entry.entryNumber} ` +
                            "has external cash debit " +
                            "without credit counterpart lines"
                        );


                        const amount =
                            cash.remainingDebit;


                        const movement = {

                            journalEntryId:
                                entry.id,

                            entryNumber:
                                entry.entryNumber,

                            entryDate:
                                entry.entryDate,

                            description:
                                entry.description,

                            cashAccountId:
                                cash.account.id,

                            cashAccountCode:
                                cash.account.code,

                            cashAccountName:
                                cash.account.name,

                            counterpartAccountId:
                                null,

                            counterpartAccountCode:
                                null,

                            counterpartAccountName:
                                null,

                            counterpartAccountType:
                                null,

                            amount,

                            classification:
                                "NONE",

                            direction:
                                "INFLOW",

                            allocation:
                                "FALLBACK"

                        };


                        addMovement(
                            "NONE",
                            "INFLOW",
                            movement
                        );


                        continue;
                     }


                    for (
                        const counterpart
                        of creditCounterparts
                    ) {

                        const counterpartAmount =
                            getCredit(
                                counterpart
                            );


                        if (
                            counterpartAmount <= 0
                        ) {

                            continue;

                        }


                        const allocation =
                            cash.remainingDebit *
                            (
                                counterpartAmount /
                                totalCreditCounterparts
                            );


                        if (
                            allocation <= 0
                        ) {

                            continue;

                        }


                        const classification =
                            classifyCounterpart(
                                counterpart
                            );


                        const movement = {

                            journalEntryId:
                                entry.id,

                            entryNumber:
                                entry.entryNumber,

                            entryDate:
                                entry.entryDate,

                            description:
                                entry.description,

                            cashAccountId:
                                cash.account.id,

                            cashAccountCode:
                                cash.account.code,

                            cashAccountName:
                                cash.account.name,

                            counterpartAccountId:
                                counterpart.accountId,

                            counterpartAccountCode:
                                counterpart.account.code,

                            counterpartAccountName:
                                counterpart.account.name,

                            counterpartAccountType:
                                counterpart.account.type,

                            amount:
                                allocation,

                            classification,

                            direction:
                                "INFLOW",

                            allocation:
                                "PROPORTIONAL"

                        };


                        addMovement(
                            classification,
                            "INFLOW",
                            movement
                        );

                    }

                }

            }


            // ------------------------------------------------
            // STEP 4
            // Allocate Cash CREDITS Against Debit
            // Counterparts
            // ------------------------------------------------

            if (
                totalExternalCashCredit > 0
            ) {

                for (
                    const cash of externalCashLines
                ) {

                    if (
                        cash.remainingCredit <= 0
                    ) {

                        continue;

                    }


                    if (
                        totalDebitCounterparts <= 0
                    ) {

                        console.warn(
                            ">>> CASH FLOW WARNING: " +
                            `Entry ${entry.entryNumber} ` +
                            "has external cash credit " +
                            "without debit counterpart lines"
                        );


                        const amount =
                            cash.remainingCredit;


                        const movement = {

                            journalEntryId:
                                entry.id,

                            entryNumber:
                                entry.entryNumber,

                            entryDate:
                                entry.entryDate,

                            description:
                                entry.description,

                            cashAccountId:
                                cash.account.id,

                            cashAccountCode:
                                cash.account.code,

                            cashAccountName:
                                cash.account.name,

                            counterpartAccountId:
                                null,

                            counterpartAccountCode:
                                null,

                            counterpartAccountName:
                                null,

                            counterpartAccountType:
                                null,

                            amount,

                            classification:
                                "NONE",

                            direction:
                                "OUTFLOW",

                            allocation:
                                "FALLBACK"

                        };


                        addMovement(
                            "NONE",
                            "OUTFLOW",
                            movement
                        );


                        continue;

                    }


                    for (
                        const counterpart
                        of debitCounterparts
                    ) {

                        const counterpartAmount =
                            getDebit(
                                counterpart
                            );


                        if (
                            counterpartAmount <= 0
                        ) {

                            continue;

                        }


                        const allocation =
                            cash.remainingCredit *
                            (
                                counterpartAmount /
                                totalDebitCounterparts
                            );


                        if (
                            allocation <= 0
                        ) {

                            continue;

                        }


                        const classification =
                            classifyCounterpart(
                                counterpart
                            );


                        const movement = {

                            journalEntryId:
                                entry.id,

                            entryNumber:
                                entry.entryNumber,

                            entryDate:
                                entry.entryDate,

                            description:
                                entry.description,

                            cashAccountId:
                                cash.account.id,

                            cashAccountCode:
                                cash.account.code,

                            cashAccountName:
                                cash.account.name,

                            counterpartAccountId:
                                counterpart.accountId,

                            counterpartAccountCode:
                                counterpart.account.code,

                            counterpartAccountName:
                                counterpart.account.name,

                            counterpartAccountType:
                                counterpart.account.type,

                            amount:
                                allocation,

                            classification,

                            direction:
                                "OUTFLOW",

                            allocation:
                                "PROPORTIONAL"

                        };


                        addMovement(
                            classification,
                            "OUTFLOW",
                            movement
                        );

                    }

                }

            }

        }


        // ------------------------------------------------
        // Sum Helper
        // ------------------------------------------------

        const sumAmounts =
            items =>
                items.reduce(
                    (
                        sum,
                        item
                    ) =>
                        sum +
                        Number(
                            item.amount || 0
                        ),
                    0
                );


        // ------------------------------------------------
        // Section Totals
        // ------------------------------------------------

        const operatingInflowTotal =
            sumAmounts(
                operatingInflows
            );


        const operatingOutflowTotal =
            sumAmounts(
                operatingOutflows
            );


        const investingInflowTotal =
            sumAmounts(
                investingInflows
            );


        const investingOutflowTotal =
            sumAmounts(
                investingOutflows
            );


        const financingInflowTotal =
            sumAmounts(
                financingInflows
            );


        const financingOutflowTotal =
            sumAmounts(
                financingOutflows
            );


        // ------------------------------------------------
        // Unmapped Cash Movement Totals
        // ------------------------------------------------

        const unmappedCashInflowTotal =
            sumAmounts(
                unmappedCashMovements
                    .filter(
                        item =>
                            item.direction ===
                            "INFLOW"
                    )
            );


        const unmappedCashOutflowTotal =
            sumAmounts(
                unmappedCashMovements
                    .filter(
                        item =>
                            item.direction ===
                            "OUTFLOW"
                    )
            );


        const unmappedCashMovementTotal =
            unmappedCashInflowTotal +
            unmappedCashOutflowTotal;


        const unmappedNetCashFlow =
            unmappedCashInflowTotal -
            unmappedCashOutflowTotal;


        const unmappedCashMovementCount =
            unmappedCashMovements.length;


        const isClassificationComplete =
            unmappedCashMovementCount === 0;


        // ------------------------------------------------
        // Internal Transfer Total
        // ------------------------------------------------
        //
        // Every matched transfer produces two lines:
        //
        // OUT = Debit cash
        // IN  = Credit cash
        //
        // Therefore total them by OUT side once per entry.
        // ------------------------------------------------

                const internalTransferTotal =
            Array.from(
                internalTransfers
                    .filter(
                        item =>
                            item.transferType === "OUT"
                    )
                    .reduce(
                        (
                            transferMap,
                            item
                        ) => {

                            const amount =
                                Math.max(
                                    Number(
                                        item.debit || 0
                                    ),
                                    Number(
                                        item.credit || 0
                                    )
                                );


                            transferMap.set(
                                item.journalEntryId,
                                (
                                    transferMap.get(
                                        item.journalEntryId
                                    ) || 0
                                ) + amount
                            );


                            return transferMap;

                        },
                        new Map()
                    )
                    .values()
            )
            .reduce(
                (
                    sum,
                    amount
                ) =>
                    sum + amount,
                0
            );

        // ------------------------------------------------
        // Net Cash Flow
        // ------------------------------------------------

        const netOperatingCashFlow =
            operatingInflowTotal -
            operatingOutflowTotal;


        const netInvestingCashFlow =
            investingInflowTotal -
            investingOutflowTotal;


        const netFinancingCashFlow =
            financingInflowTotal -
            financingOutflowTotal;


        const netChangeInCash =
            netOperatingCashFlow +
            netInvestingCashFlow +
            netFinancingCashFlow;


        // ------------------------------------------------
        // Total Cash Change Including Unmapped Movements
        // ------------------------------------------------
        //
        // Unmapped movements are excluded from the classified
        // cash-flow sections, but they are real cash movements
        // and therefore must be included when reconciling the
        // report to the ledger cash balance.
        // ------------------------------------------------

        const netChangeInCashIncludingUnmapped =
            netChangeInCash +
            unmappedNetCashFlow;


        // ------------------------------------------------
        // Calculated Closing Cash
        // ------------------------------------------------

        const closingCash =
            openingCash +
            netChangeInCash;


        const closingCashIncludingUnmapped =
            openingCash +
            netChangeInCashIncludingUnmapped;


        // ------------------------------------------------
        // Ledger Closing Cash
        // ------------------------------------------------

        const closingCashAccounts = [];

        let ledgerClosingCash = 0;


        for (
            const cashAccount of cashAccounts
        ) {

            const opening =
                openingBalanceMap.get(
                    cashAccount.id
                );


            const openingDebit =
                opening
                    ? Number(
                        opening.debit || 0
                    )
                    : 0;


            const openingCredit =
                opening
                    ? Number(
                        opening.credit || 0
                    )
                    : 0;


            const accountJournalLines =
                journalLines.filter(
                    line =>
                        line.accountId ===
                        cashAccount.id
                );


            let periodDebit = 0;

            let periodCredit = 0;


            for (
                const line
                of accountJournalLines
            ) {

                periodDebit +=
                    getDebit(line);


                periodCredit +=
                    getCredit(line);

            }


            const accountClosingBalance =
                openingDebit +
                periodDebit -
                openingCredit -
                periodCredit;


            ledgerClosingCash +=
                accountClosingBalance;


            closingCashAccounts.push({

                accountId:
                    cashAccount.id,

                code:
                    cashAccount.code,

                name:
                    cashAccount.name,

                openingDebit,

                openingCredit,

                periodDebit,

                periodCredit,

                closingBalance:
                    accountClosingBalance,

                balanceSide:
                    accountClosingBalance > 0
                        ? "DEBIT"
                        : accountClosingBalance < 0
                            ? "CREDIT"
                            : "ZERO"

            });

        }


        // ------------------------------------------------
        // Reconciliation
        // ------------------------------------------------

        const reconciliationDifference =
            closingCash -
            ledgerClosingCash;


        const reconciliationDifferenceAfterUnmapped =
            closingCashIncludingUnmapped -
            ledgerClosingCash;


        const isReconciled =
            Math.abs(
                reconciliationDifferenceAfterUnmapped
            ) < 0.000001;


        // ------------------------------------------------
        // Debug
        // ------------------------------------------------

        console.log(

            ">>> CASH FLOW STATEMENT DEBUG <<<",

            {

                openingCash,

                operatingInflowTotal,

                operatingOutflowTotal,

                netOperatingCashFlow,

                investingInflowTotal,

                investingOutflowTotal,

                netInvestingCashFlow,

                financingInflowTotal,

                financingOutflowTotal,

                netFinancingCashFlow,

                internalTransferTotal,

                unmappedCashMovementTotal,

                unmappedCashInflowTotal,

                unmappedCashOutflowTotal,

                unmappedNetCashFlow,

                unmappedCashMovementCount,

                isClassificationComplete,

                netChangeInCash,

                netChangeInCashIncludingUnmapped,

                closingCash,

                closingCashIncludingUnmapped,

                ledgerClosingCash,

                reconciliationDifference,

                isReconciled

            }

        );


        // ------------------------------------------------
        // Return Cash Flow Statement
        // ------------------------------------------------

        return {

            fiscalPeriod: {

                id:
                    fiscalPeriod.id,

                code:
                    fiscalPeriod.code,

                name:
                    fiscalPeriod.name,

                startDate:
                    fiscalPeriod.startDate,

                endDate:
                    fiscalPeriod.endDate,

                status:
                    fiscalPeriod.status

            },

            operatingActivities: {

                inflows: {

                    total:
                        operatingInflowTotal,

                    items:
                        operatingInflows

                },

                outflows: {

                    total:
                        operatingOutflowTotal,

                    items:
                        operatingOutflows

                },

                netCashFlow:
                    netOperatingCashFlow

            },

            investingActivities: {

                inflows: {

                    total:
                        investingInflowTotal,

                    items:
                        investingInflows

                },

                outflows: {

                    total:
                        investingOutflowTotal,

                    items:
                        investingOutflows

                },

                netCashFlow:
                    netInvestingCashFlow

            },

            financingActivities: {

                inflows: {

                    total:
                        financingInflowTotal,

                    items:
                        financingInflows

                },

                outflows: {

                    total:
                        financingOutflowTotal,

                    items:
                        financingOutflows

                },

                netCashFlow:
                    netFinancingCashFlow

            },

            unmappedCashMovements: {

                total:
                    unmappedCashMovementTotal,

                inflows: {

                    total:
                        unmappedCashInflowTotal,

                    items:
                        unmappedCashMovements.filter(
                            item =>
                                item.direction ===
                                "INFLOW"
                        )

                },

                outflows: {

                    total:
                        unmappedCashOutflowTotal,

                    items:
                        unmappedCashMovements.filter(
                            item =>
                                item.direction ===
                                "OUTFLOW"
                        )

                },

                netCashFlow:
                    unmappedNetCashFlow

            },

            internalTransfers: {

                total:
                    internalTransferTotal,

                items:
                    internalTransfers

            },

            openingCash,

            openingCashAccounts,

            netChangeInCash,

            netChangeInCashIncludingUnmapped,

            closingCash,

            closingCashIncludingUnmapped,

            closingCashAccounts,

            reconciliation: {

                ledgerClosingCash,

                difference:
                    reconciliationDifference,

                differenceAfterUnmapped:
                    reconciliationDifferenceAfterUnmapped,

                unmappedCashNetChange:
                    unmappedNetCashFlow,

                unmappedCashMovementCount,

                isClassificationComplete,

                isReconciled

            }

        };

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FinancialReportService();