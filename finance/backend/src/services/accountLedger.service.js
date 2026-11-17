const accountRepository =
    require("../repositories/account.repository");

const accountLedgerRepository =
    require("../repositories/accountLedger.repository");

const openingBalanceRepository =
    require("../repositories/openingBalance.repository");


// ======================================================
// Account Ledger Service
// ======================================================

class AccountLedgerService {


    // ======================================================
    // Get Account Ledger
    // ======================================================

    async getLedger(
        accountId,
        fiscalPeriodId = null
    ) {


        // --------------------------------------------------
        // Validate Account ID
        // --------------------------------------------------

        if (!accountId) {

            throw new Error(
                "accountId is required"
            );

        }


        // --------------------------------------------------
        // Validate Account
        // --------------------------------------------------

        const account =
            await accountRepository.findById(
                accountId
            );


        if (!account) {

            throw new Error(
                "Account not found"
            );

        }


        // --------------------------------------------------
        // Account must be Active
        // --------------------------------------------------

        if (!account.isActive) {

            throw new Error(
                `Account is inactive: ${account.code}`
            );

        }


        // --------------------------------------------------
        // Determine Fiscal Period
        // --------------------------------------------------

        const finalFiscalPeriodId =
            fiscalPeriodId ||
            account.fiscalPeriodId ||
            null;


        // --------------------------------------------------
        // Validate Fiscal Period if provided
        // --------------------------------------------------

        if (fiscalPeriodId) {

            if (
                account.fiscalPeriodId &&
                account.fiscalPeriodId !== fiscalPeriodId
            ) {

                throw new Error(
                    "Account does not belong to the selected fiscal period"
                );

            }

        }


        // --------------------------------------------------
        // Get Opening Balance
        // --------------------------------------------------

        let openingBalance = null;


        if (finalFiscalPeriodId) {

            openingBalance =
                await openingBalanceRepository
                    .findByFiscalPeriodAndAccount(
                        finalFiscalPeriodId,
                        accountId
                    );

        }


        // --------------------------------------------------
        // Validate Opening Balance Status
        // --------------------------------------------------

        if (
            openingBalance &&
            openingBalance.status !== "ACTIVE"
        ) {

            openingBalance = null;

        }


        // --------------------------------------------------
        // Opening Balance Amounts
        // --------------------------------------------------

        let openingDebit = 0;
        let openingCredit = 0;
        let openingNetBalance = 0;


        if (openingBalance) {

            openingDebit =
                Number(
                    openingBalance.debit || 0
                );

            openingCredit =
                Number(
                    openingBalance.credit || 0
                );

            openingNetBalance =
                openingDebit -
                openingCredit;

        }


        // --------------------------------------------------
        // Get Posted Ledger Lines
        // --------------------------------------------------

        const lines =
            await accountLedgerRepository.findByAccountId(
                accountId,
                finalFiscalPeriodId
            );


        // --------------------------------------------------
        // Calculate Totals
        // --------------------------------------------------

        let totalDebit =
            openingDebit;

        let totalCredit =
            openingCredit;

        let balance =
            openingNetBalance;


        // --------------------------------------------------
        // Prepare Ledger
        // --------------------------------------------------

        const ledger = [];


        // --------------------------------------------------
        // Add Opening Balance Row
        // --------------------------------------------------

        if (openingBalance) {

            ledger.push({

                id:
                    openingBalance.id,

                type:
                    "OPENING_BALANCE",

                journalEntryId:
                    null,

                entryNumber:
                    null,

                entryDate:
                    null,

                description:
                    openingBalance.description ||
                    "Opening Balance",

                debit:
                    openingDebit,

                credit:
                    openingCredit,

                balance:
                    balance

            });

        }


        // --------------------------------------------------
        // Add Journal Entry Lines
        // --------------------------------------------------

        for (
            const line of lines
        ) {

            const debit =
                Number(
                    line.debit || 0
                );

            const credit =
                Number(
                    line.credit || 0
                );


            totalDebit +=
                debit;

            totalCredit +=
                credit;


            // --------------------------------------------------
            // Account Balance
            // --------------------------------------------------

            balance +=
                debit -
                credit;


            ledger.push({

                id:
                    line.id,

                type:
                    "JOURNAL_ENTRY",

                journalEntryId:
                    line.journalEntryId,

                entryNumber:
                    line.journalEntry.entryNumber,

                entryDate:
                    line.journalEntry.entryDate,

                description:
                    line.description,

                debit,

                credit,

                balance

            });

        }


        // --------------------------------------------------
        // Return Ledger
        // --------------------------------------------------

        return {

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

            fiscalPeriodId:
                finalFiscalPeriodId,

            openingBalance: {

                id:
                    openingBalance
                        ? openingBalance.id
                        : null,

                debit:
                    openingDebit,

                credit:
                    openingCredit,

                balance:
                    openingNetBalance

            },

            totalDebit,

            totalCredit,

            balance,

            lines:
                ledger

        };

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new AccountLedgerService();