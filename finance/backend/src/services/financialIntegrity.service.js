const prisma =
    require("../config/prisma");

const openingBalanceService =
    require("./openingBalance.service");

const financialReportService =
    require("./financialReport.service");


// ======================================================
// Financial Integrity Service
// ======================================================

class FinancialIntegrityService {


    // ==================================================
    // Validate Financial Integrity
    // ==================================================

    async validate(
        fiscalPeriodId
    ) {

        // ------------------------------------------------
        // Validate Fiscal Period ID
        // ------------------------------------------------

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        // ------------------------------------------------
        // Validate Fiscal Period
        // ------------------------------------------------

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


        // =================================================
        // 1. Validate Opening Balances
        // =================================================

        const openingBalances =
            await openingBalanceService
                .validateBalance(
                    fiscalPeriodId
                );


        // ------------------------------------------------
        // Detailed Opening Balance Validation
        // ------------------------------------------------

        const activeOpeningBalances =
            await prisma.openingBalance.findMany({

                where: {

                    fiscalPeriodId,

                    status: "ACTIVE"

                },

                include: {

                    account: true

                }

            });


        const invalidOpeningBalances = [];


        for (
            const opening of activeOpeningBalances
        ) {

            const debit =
                Number(
                    opening.debit || 0
                );

            const credit =
                Number(
                    opening.credit || 0
                );


            // --------------------------------------------
            // Account existence
            // --------------------------------------------

            if (!opening.account) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    reason:
                        "Account not found"

                });

                continue;

            }


            const account =
                opening.account;


            // --------------------------------------------
            // Account active
            // --------------------------------------------

            if (!account.isActive) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    reason:
                        "Account is inactive"

                });

            }


            // --------------------------------------------
            // Fiscal Period consistency
            // --------------------------------------------

            if (
                account.fiscalPeriodId !==
                fiscalPeriodId
            ) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    reason:
                        "Account does not belong to the selected fiscal period"

                });

            }


            // --------------------------------------------
            // Negative protection
            // --------------------------------------------

            if (
                debit < 0 ||
                credit < 0
            ) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    debit,

                    credit,

                    reason:
                        "Debit and credit cannot be negative"

                });

            }


            // --------------------------------------------
            // Both debit and credit
            // --------------------------------------------

            if (
                debit > 0 &&
                credit > 0
            ) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    debit,

                    credit,

                    reason:
                        "Opening balance cannot have both debit and credit"

                });

            }


            // --------------------------------------------
            // Empty balance
            // --------------------------------------------

            if (
                debit === 0 &&
                credit === 0
            ) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    debit,

                    credit,

                    reason:
                        "Opening balance cannot be zero"

                });

            }


            // --------------------------------------------
            // Leaf account validation
            // --------------------------------------------

            const childCount =
                await prisma.account.count({

                    where: {

                        parentId:
                            account.id

                    }

                });


            if (childCount > 0) {

                invalidOpeningBalances.push({

                    openingBalanceId:
                        opening.id,

                    accountId:
                        opening.accountId,

                    code:
                        account.code,

                    reason:
                        "Opening balance is assigned to a parent account"

                });

            }

        }


        const openingBalancesValid =
            invalidOpeningBalances.length === 0;


        // =================================================
        // 2. Validate Posted Journal Entries
        // =================================================

        const journalEntries =
            await prisma.journalEntry.findMany({

                where: {

                    fiscalPeriodId,

                    status: "POSTED"

                },

                include: {

                    lines: {

                        include: {

                            account: true

                        },

                        orderBy: {

                            createdAt: "asc"

                        }

                    },

                    fund: true

                },

                orderBy: {

                    entryDate: "asc"

                }

            });


        const unbalancedEntries = [];

        const invalidEntries = [];


        for (
            const entry of journalEntries
        ) {

            let debit = 0;

            let credit = 0;


            // --------------------------------------------
            // Entry Date
            // --------------------------------------------

            const entryDate =
                new Date(
                    entry.entryDate
                );


            if (
                Number.isNaN(
                    entryDate.getTime()
                )
            ) {

                invalidEntries.push({

                    journalEntryId:
                        entry.id,

                    entryNumber:
                        entry.entryNumber,

                    reason:
                        "Invalid journal entry date"

                });

            }
            else {

                if (
                    entryDate <
                    fiscalPeriod.startDate ||
                    entryDate >
                    fiscalPeriod.endDate
                ) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        reason:
                            "Journal entry date is outside the fiscal period",

                        entryDate:
                            entry.entryDate

                    });

                }

            }


            // --------------------------------------------
            // Fund Fiscal Period
            // --------------------------------------------

            if (
                entry.fund &&
                entry.fund.fiscalPeriodId !==
                fiscalPeriodId
            ) {

                invalidEntries.push({

                    journalEntryId:
                        entry.id,

                    entryNumber:
                        entry.entryNumber,

                    reason:
                        "Fund does not belong to the selected fiscal period",

                    fundId:
                        entry.fundId

                });

            }


            // --------------------------------------------
            // At least one line
            // --------------------------------------------

            if (
                !entry.lines ||
                entry.lines.length === 0
            ) {

                invalidEntries.push({

                    journalEntryId:
                        entry.id,

                    entryNumber:
                        entry.entryNumber,

                    reason:
                        "Journal entry has no lines"

                });

            }


            // --------------------------------------------
            // Validate Lines
            // --------------------------------------------

            for (
                const line of
                entry.lines || []
            ) {

                const lineDebit =
                    Number(
                        line.debit || 0
                    );

                const lineCredit =
                    Number(
                        line.credit || 0
                    );


                debit += lineDebit;

                credit += lineCredit;


                // ----------------------------------------
                // Negative values
                // ----------------------------------------

                if (
                    lineDebit < 0 ||
                    lineCredit < 0
                ) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            line.accountId,

                        debit:
                            lineDebit,

                        credit:
                            lineCredit,

                        reason:
                            "Journal entry line cannot contain negative amounts"

                    });

                }


                // ----------------------------------------
                // Both debit and credit
                // ----------------------------------------

                if (
                    lineDebit > 0 &&
                    lineCredit > 0
                ) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            line.accountId,

                        debit:
                            lineDebit,

                        credit:
                            lineCredit,

                        reason:
                            "Journal entry line cannot contain both debit and credit"

                    });

                }


                // ----------------------------------------
                // Empty line
                // ----------------------------------------

                if (
                    lineDebit === 0 &&
                    lineCredit === 0
                ) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            line.accountId,

                        reason:
                            "Journal entry line must contain debit or credit"

                    });

                }


                // ----------------------------------------
                // Account existence
                // ----------------------------------------

                if (!line.account) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            line.accountId,

                        reason:
                            "Journal entry line account not found"

                    });

                    continue;

                }


                const account =
                    line.account;


                // ----------------------------------------
                // Account active
                // ----------------------------------------

                if (!account.isActive) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            account.id,

                        code:
                            account.code,

                        reason:
                            "Journal entry uses an inactive account"

                    });

                }


                // ----------------------------------------
                // Account Fiscal Period
                // ----------------------------------------

                if (
                    account.fiscalPeriodId !==
                    fiscalPeriodId
                ) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            account.id,

                        code:
                            account.code,

                        reason:
                            "Journal entry account does not belong to the selected fiscal period"

                    });

                }


                // ----------------------------------------
                // Leaf Account
                // ----------------------------------------

                const childCount =
                    await prisma.account.count({

                        where: {

                            parentId:
                                account.id

                        }

                    });


                if (childCount > 0) {

                    invalidEntries.push({

                        journalEntryId:
                            entry.id,

                        entryNumber:
                            entry.entryNumber,

                        lineId:
                            line.id,

                        accountId:
                            account.id,

                        code:
                            account.code,

                        reason:
                            "Journal entry is posted to a parent account"

                    });

                }

            }


            // --------------------------------------------
            // Entry Balance
            // --------------------------------------------

            const difference =
                debit -
                credit;


            const isBalanced =
                Math.abs(
                    difference
                ) < 0.000001;


            if (!isBalanced) {

                unbalancedEntries.push({

                    journalEntryId:
                        entry.id,

                    entryNumber:
                        entry.entryNumber,

                    debit,

                    credit,

                    difference,

                    isBalanced

                });

            }

        }


        // =================================================
        // 3. Journal Entry Results
        // =================================================

        const journalEntriesBalanced =
            unbalancedEntries.length === 0;


        const journalEntriesStructurallyValid =
            invalidEntries.length === 0;


        const journalEntriesValid =
            journalEntriesBalanced &&
            journalEntriesStructurallyValid;


        // =================================================
        // 4. Trial Balance
        // =================================================

        const trialBalance =
            await financialReportService
                .getTrialBalance(
                    fiscalPeriodId
                );


        // =================================================
        // 5. Balance Sheet
        // =================================================

        const balanceSheet =
            await financialReportService
                .getBalanceSheet(
                    fiscalPeriodId
                );


        // =================================================
        // 6. Overall Integrity
        // =================================================

        const isValid =

            openingBalances.isBalanced &&

            openingBalancesValid &&

            journalEntriesValid &&

            trialBalance.isBalanced &&

            balanceSheet.isBalanced;


        // =================================================
        // 7. Return Result
        // =================================================

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


            isValid,


            openingBalances: {

                isBalanced:
                    openingBalances.isBalanced,

                isValid:
                    openingBalancesValid,

                openingBalanceCount:
                    openingBalances.openingBalanceCount,

                totalDebit:
                    openingBalances.totalDebit,

                totalCredit:
                    openingBalances.totalCredit,

                difference:
                    openingBalances.difference,

                invalidCount:
                    invalidOpeningBalances.length,

                invalidBalances:
                    invalidOpeningBalances

            },


            journalEntries: {

                totalEntries:
                    journalEntries.length,

                unbalancedCount:
                    unbalancedEntries.length,

                invalidCount:
                    invalidEntries.length,

                isBalanced:
                    journalEntriesBalanced,

                isValid:
                    journalEntriesValid,

                unbalancedEntries,

                invalidEntries

            },


            trialBalance: {

                totalDebit:
                    trialBalance.totalDebit,

                totalCredit:
                    trialBalance.totalCredit,

                difference:
                    trialBalance.difference,

                isBalanced:
                    trialBalance.isBalanced

            },


            balanceSheet: {

                totalAssets:
                    balanceSheet.totalAssets,

                totalLiabilitiesAndEquity:
                    balanceSheet.totalLiabilitiesAndEquity,

                difference:
                    balanceSheet.difference,

                isBalanced:
                    balanceSheet.isBalanced

            }

        };

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FinancialIntegrityService();