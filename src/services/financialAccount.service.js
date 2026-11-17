const prisma =
    require("../config/prisma");

const financialAccountRepository =
    require("../repositories/financialAccount.repository");


// ======================================================
// Financial Account Service
// ======================================================

class FinancialAccountService {


    // ======================================================
    // Get All Financial Accounts
    // ======================================================

    async getAll() {

        return await financialAccountRepository.findAll();

    }


    // ======================================================
    // Get Financial Account By ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const financialAccount =
            await financialAccountRepository.findById(id);


        if (!financialAccount) {

            throw new Error(
                "Financial account not found"
            );

        }


        return financialAccount;

    }


    // ======================================================
    // Get Financial Account By Code
    // ======================================================

    async getByCode(code) {

        if (!code) {

            throw new Error(
                "code is required"
            );

        }


        const financialAccount =
            await financialAccountRepository.findByCode(
                code
            );


        if (!financialAccount) {

            throw new Error(
                "Financial account not found"
            );

        }


        return financialAccount;

    }


    // ======================================================
    // Validate Account
    // ======================================================

    async validateAccount(accountId) {

        if (!accountId) {

            return null;

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


        if (!account.isActive) {

            throw new Error(
                "Account is inactive"
            );

        }


        return account;

    }


    // ======================================================
    // Validate Account Availability
    // ======================================================
    //
    // Account → FinancialAccount is now 1:1.
    //
    // One Account can be linked to at most one
    // FinancialAccount.
    //
    // During update, the current FinancialAccount itself
    // is allowed to keep its existing Account.
    //
    // ======================================================

    async validateAccountAvailability(
        accountId,
        financialAccountId = null
    ) {

        if (!accountId) {

            return null;

        }


        const existing =
            await financialAccountRepository.findByAccountId(
                accountId
            );


        if (
            existing &&
            existing.id !== financialAccountId
        ) {

            throw new Error(
                "Account is already linked to another financial account"
            );

        }


        return existing;

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriod(fiscalPeriodId) {

        if (!fiscalPeriodId) {

            return null;

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


    // ======================================================
    // Validate Fund
    // ======================================================

    async validateFund(fundId) {

        if (!fundId) {

            return null;

        }


        const fund =
            await prisma.fund.findUnique({

                where: {
                    id: fundId
                }

            });


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        return fund;

    }


    // ======================================================
    // Validate Fiscal Period Compatibility
    // ======================================================

    validateFiscalPeriodCompatibility(
        fiscalPeriodId,
        account,
        fund
    ) {

        // --------------------------------------------------
        // Account → Fiscal Period
        // --------------------------------------------------

        if (
            account &&
            fiscalPeriodId &&
            account.fiscalPeriodId !== fiscalPeriodId
        ) {

            throw new Error(
                "Account and Financial Account must belong to the same fiscal period"
            );

        }


        // --------------------------------------------------
        // Fund → Fiscal Period
        // --------------------------------------------------

        if (
            fund &&
            fund.fiscalPeriodId &&
            fiscalPeriodId &&
            fund.fiscalPeriodId !== fiscalPeriodId
        ) {

            throw new Error(
                "Fund and Financial Account must belong to the same fiscal period"
            );

        }

    }


    // ======================================================
    // Validate Financial Account Type
    // ======================================================

    validateType(type) {

        const allowedTypes = [
            "BANK",
            "CASH",
            "POS"
        ];


        if (!allowedTypes.includes(type)) {

            throw new Error(
                "Invalid financial account type"
            );

        }

    }


    // ======================================================
    // Validate Status
    // ======================================================

    validateStatus(status) {

        if (
            status !== "ACTIVE" &&
            status !== "INACTIVE"
        ) {

            throw new Error(
                "Invalid status"
            );

        }

    }


    // ======================================================
    // Validate Type Specific Fields
    // ======================================================

    validateTypeSpecificFields(
        type,
        bankName,
        cardNumber
    ) {

        // --------------------------------------------------
        // BANK
        // --------------------------------------------------

        if (
            type === "BANK" &&
            !bankName
        ) {

            throw new Error(
                "bankName is required for BANK account"
            );

        }


        // --------------------------------------------------
        // POS
        // --------------------------------------------------

        if (
            type === "POS" &&
            !cardNumber
        ) {

            throw new Error(
                "cardNumber is required for POS account"
            );

        }

    }


    // ======================================================
    // Check Financial History
    // ======================================================
    //
    // A FinancialAccount is considered to have financial
    // history when at least one of the following exists:
    //
    // 1. ChargePayment references the FinancialAccount.
    //
    // 2. Its linked General Ledger Account has at least
    //    one POSTED JournalEntryLine.
    ////    JournalEntryLine records.
    // 3. Its linked Account has OpeningBalance records.
    // 4. FinancialAccount has a non-zero openingBalance.
    // This method is intentionally centralized so that
    // UPDATE and DELETE use the same lifecycle rule.
    //
    // ======================================================

    async getFinancialHistory(
        financialAccount
    ) {

        if (!financialAccount) {

            throw new Error(
                "Financial account is required"
            );

        }


        // --------------------------------------------------
        // Charge Payment History
        // --------------------------------------------------

        const chargePaymentCount =
            await prisma.chargePayment.count({

                where: {
                    financialAccountId:
                        financialAccount.id
                }

            });


        // --------------------------------------------------
        // General Ledger History
        // --------------------------------------------------
        //
        // FinancialAccount itself is not directly linked
        // to JournalEntryLine.
        //
        // The accounting history is connected through:
        //
        // FinancialAccount
        //      ↓
        // accountId
        //      ↓
        // Account
        //      ↓
        // JournalEntryLine
        //      ↓
        // POSTED JournalEntry
        //
        // --------------------------------------------------

        let postedJournalEntryLineCount = 0;


        if (financialAccount.accountId) {

            postedJournalEntryLineCount =
                await prisma.journalEntryLine.count({

                    where: {

                        accountId:
                            financialAccount.accountId,

                        journalEntry: {
                            status: "POSTED"
                        }

                    }

                });

        }

        // --------------------------------------------------
        // Opening Balance Records History
        // --------------------------------------------------

        let openingBalanceRecordCount = 0;

        if (financialAccount.accountId) {

            openingBalanceRecordCount =
                await prisma.openingBalance.count({

                    where: {
                        accountId: financialAccount.accountId
                    }

                });

        }

        const hasOpeningBalanceRecords =

        openingBalanceRecordCount > 0;
        // --------------------------------------------------
        // Opening Balance History
        // --------------------------------------------------
        //
        // A non-zero FinancialAccount opening balance is
        // also treated as financial history.
        //
        // --------------------------------------------------

        const hasOpeningBalance =
            financialAccount.openingBalance !== null &&
            financialAccount.openingBalance !== undefined &&
            Number(financialAccount.openingBalance) !== 0;


        return {

            chargePaymentCount,

            postedJournalEntryLineCount,

            openingBalanceRecordCount,

            hasOpeningBalanceRecords,

            hasOpeningBalance,

            hasChargePaymentHistory:
                chargePaymentCount > 0,

            hasAccountingHistory:
                postedJournalEntryLineCount > 0,

            hasFinancialHistory:
            chargePaymentCount > 0 ||
            postedJournalEntryLineCount > 0 ||
            hasOpeningBalance ||
            hasOpeningBalanceRecords



        };

    }


    // ======================================================
    // Validate Lifecycle Changes
    // ======================================================
    //
    // Once a FinancialAccount has financial history,
    // its accounting identity must remain stable.
    //
    // Protected fields:
    //
    // - accountId
    // - fiscalPeriodId
    // - type
    // - openingBalance
    //
    // fundId is intentionally NOT protected here.
    //
    // Metadata such as name, bankName, accountNumber,
    // cardNumber and iban remains editable.
    //
    // status remains editable so that a used account can
    // safely be changed to INACTIVE instead of deleted.
    //
    // ======================================================

    async validateLifecycleChanges(
        existing,
        updateData
    ) {

        const history =
            await this.getFinancialHistory(
                existing
            );


        if (!history.hasFinancialHistory) {

            return history;

        }


        // --------------------------------------------------
        // Account ID
        // --------------------------------------------------

        if (
            updateData.accountId !== undefined &&
            updateData.accountId !== existing.accountId
        ) {

            throw new Error(
                "Account cannot be changed because the financial account has financial history"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (
            updateData.fiscalPeriodId !== undefined &&
            updateData.fiscalPeriodId !== existing.fiscalPeriodId
        ) {

            throw new Error(
                "Fiscal period cannot be changed because the financial account has financial history"
            );

        }


        // --------------------------------------------------
        // Financial Account Type
        // --------------------------------------------------

        if (
            updateData.type !== undefined &&
            updateData.type !== existing.type
        ) {

            throw new Error(
                "Financial account type cannot be changed because the financial account has financial history"
            );

        }


        // --------------------------------------------------
        // Opening Balance
        // --------------------------------------------------

        if (
            updateData.openingBalance !== undefined &&
            Number(updateData.openingBalance) !==
                Number(existing.openingBalance)
        ) {

            throw new Error(
                "Opening balance cannot be changed because the financial account has financial history"
            );

        }


        return history;

    }


    // ======================================================
    // Validate Delete
    // ======================================================

    async validateDelete(
        financialAccount
    ) {

        const history =
            await this.getFinancialHistory(
                financialAccount
            );


        if (history.hasFinancialHistory) {

            throw new Error(
                "Financial account cannot be deleted because it has financial history"
            );

        }


        return true;

    }


    // ======================================================
    // Create Financial Account
    // ======================================================

    async create(data) {

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Code
        // --------------------------------------------------

        if (!data.code) {

            throw new Error(
                "code is required"
            );

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (!data.name) {

            throw new Error(
                "name is required"
            );

        }


        // --------------------------------------------------
        // Type
        // --------------------------------------------------

        if (!data.type) {

            throw new Error(
                "type is required"
            );

        }


        this.validateType(
            data.type
        );


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        const status =
            data.status || "ACTIVE";


        this.validateStatus(
            status
        );


        // --------------------------------------------------
        // Normalize Type-Specific Fields
        // --------------------------------------------------

        let bankName = null;
        let accountNumber = null;
        let cardNumber = null;
        let iban = null;


        if (data.type === "BANK") {

            bankName =
                data.bankName || null;

            accountNumber =
                data.accountNumber || null;

            iban =
                data.iban || null;

            cardNumber =
                data.cardNumber || null;

        }


        else if (data.type === "POS") {

            cardNumber =
                data.cardNumber || null;

            bankName = null;

            accountNumber = null;

            iban = null;

        }


        else if (data.type === "CASH") {

            bankName = null;

            accountNumber = null;

            cardNumber = null;

            iban = null;

        }


        // --------------------------------------------------
        // Type Specific Validation
        // --------------------------------------------------

        this.validateTypeSpecificFields(
            data.type,
            bankName,
            cardNumber
        );


        // --------------------------------------------------
        // Duplicate Code
        // --------------------------------------------------

        const duplicate =
            await financialAccountRepository.findByCode(
                data.code
            );


        if (duplicate) {

            throw new Error(
                "Financial account code already exists"
            );

        }


        // --------------------------------------------------
        // Validate Account
        // --------------------------------------------------

        const account =
            data.accountId !== undefined &&
            data.accountId !== null
                ? await this.validateAccount(
                    data.accountId
                )
                : null;


        // --------------------------------------------------
        // Validate Account Availability
        // --------------------------------------------------

        if (
            data.accountId !== undefined &&
            data.accountId !== null
        ) {

            await this.validateAccountAvailability(
                data.accountId
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        const fiscalPeriod =
            data.fiscalPeriodId !== undefined &&
            data.fiscalPeriodId !== null
                ? await this.validateFiscalPeriod(
                    data.fiscalPeriodId
                )
                : null;


        // --------------------------------------------------
        // Validate Fund
        // --------------------------------------------------

        const fund =
            data.fundId !== undefined &&
            data.fundId !== null
                ? await this.validateFund(
                    data.fundId
                )
                : null;


        // --------------------------------------------------
        // Fiscal Period Compatibility
        // --------------------------------------------------

        this.validateFiscalPeriodCompatibility(
            data.fiscalPeriodId || null,
            account,
            fund
        );


        // --------------------------------------------------
        // Prepare Data
        // --------------------------------------------------

        const createData = {

            code:
                data.code,

            name:
                data.name,

            type:
                data.type,

            bankName:
                bankName,

            accountNumber:
                accountNumber,

            cardNumber:
                cardNumber,

            iban:
                iban,

            openingBalance:
                data.openingBalance !== undefined
                    ? data.openingBalance
                    : 0,

            status:
                status

        };


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined
        ) {

            createData.fiscalPeriodId =
                data.fiscalPeriodId || null;

        }


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        if (
            data.fundId !== undefined
        ) {

            createData.fundId =
                data.fundId || null;

        }


        // --------------------------------------------------
        // General Ledger Account
        // --------------------------------------------------
        //
        // accountId is intentionally nullable.
        //
        // When provided, one Account can be linked
        // to at most one FinancialAccount.
        //
        // --------------------------------------------------

        if (
            data.accountId !== undefined
        ) {

            createData.accountId =
                data.accountId || null;

        }


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await financialAccountRepository.create(
            createData
        );

    }


    // ======================================================
    // Update Financial Account
    // ======================================================

    async update(id, data) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Existing Financial Account
        // --------------------------------------------------

        const existing =
            await this.getById(id);


        const updateData = {};


        // --------------------------------------------------
        // Code
        // --------------------------------------------------

        if (
            data.code !== undefined
        ) {

            if (!data.code) {

                throw new Error(
                    "code is required"
                );

            }


            const duplicate =
                await financialAccountRepository.findByCode(
                    data.code
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Financial account code already exists"
                );

            }


            updateData.code =
                data.code;

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (
            data.name !== undefined
        ) {

            if (!data.name) {

                throw new Error(
                    "name is required"
                );

            }


            updateData.name =
                data.name;

        }


        // --------------------------------------------------
        // Type
        // --------------------------------------------------

        if (
            data.type !== undefined
        ) {

            this.validateType(
                data.type
            );


            updateData.type =
                data.type;

        }


        // --------------------------------------------------
        // Bank Name
        // --------------------------------------------------

        if (
            data.bankName !== undefined
        ) {

            updateData.bankName =
                data.bankName || null;

        }


        // --------------------------------------------------
        // Account Number
        // --------------------------------------------------

        if (
            data.accountNumber !== undefined
        ) {

            updateData.accountNumber =
                data.accountNumber || null;

        }


        // --------------------------------------------------
        // Card Number
        // --------------------------------------------------

        if (
            data.cardNumber !== undefined
        ) {

            updateData.cardNumber =
                data.cardNumber || null;

        }


        // --------------------------------------------------
        // IBAN
        // --------------------------------------------------

        if (
            data.iban !== undefined
        ) {

            updateData.iban =
                data.iban || null;

        }


        // --------------------------------------------------
        // Opening Balance
        // --------------------------------------------------

        if (
            data.openingBalance !== undefined
        ) {

            updateData.openingBalance =
                data.openingBalance;

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (
            data.status !== undefined
        ) {

            this.validateStatus(
                data.status
            );


            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined
        ) {

            updateData.fiscalPeriodId =
                data.fiscalPeriodId || null;

        }


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        if (
            data.fundId !== undefined
        ) {

            updateData.fundId =
                data.fundId || null;

        }


        // --------------------------------------------------
        // General Ledger Account
        // --------------------------------------------------

        if (
            data.accountId !== undefined
        ) {

            updateData.accountId =
                data.accountId || null;

        }


        // ==================================================
        // Financial Lifecycle Guard
        // ==================================================
        //
        // Must run after collecting all requested changes
        // and before validating the final state.
        //
        // ==================================================

        await this.validateLifecycleChanges(
            existing,
            updateData
        );


        // ==================================================
        // Determine Final State
        // ==================================================

        const finalType =
            updateData.type !== undefined
                ? updateData.type
                : existing.type;


        const finalBankName =
            updateData.bankName !== undefined
                ? updateData.bankName
                : existing.bankName;


        const finalAccountNumber =
            updateData.accountNumber !== undefined
                ? updateData.accountNumber
                : existing.accountNumber;


        const finalCardNumber =
            updateData.cardNumber !== undefined
                ? updateData.cardNumber
                : existing.cardNumber;


        const finalIban =
            updateData.iban !== undefined
                ? updateData.iban
                : existing.iban;


        const finalFiscalPeriodId =
            updateData.fiscalPeriodId !== undefined
                ? updateData.fiscalPeriodId
                : existing.fiscalPeriodId;


        const finalAccountId =
            updateData.accountId !== undefined
                ? updateData.accountId
                : existing.accountId;


        const finalFundId =
            updateData.fundId !== undefined
                ? updateData.fundId
                : existing.fundId;


        // ==================================================
        // Normalize Type-Specific Fields
        // ==================================================

        if (finalType === "BANK") {

            updateData.bankName =
                finalBankName;

            updateData.accountNumber =
                finalAccountNumber;

            updateData.iban =
                finalIban;

            updateData.cardNumber =
                finalCardNumber;

        }


        else if (finalType === "POS") {

            updateData.bankName =
                null;

            updateData.accountNumber =
                null;

            updateData.iban =
                null;

            updateData.cardNumber =
                finalCardNumber;

        }


        else if (finalType === "CASH") {

            updateData.bankName =
                null;

            updateData.accountNumber =
                null;

            updateData.cardNumber =
                null;

            updateData.iban =
                null;

        }


        // ==================================================
        // Validate Final Account
        // ==================================================

        const account =
            finalAccountId
                ? await this.validateAccount(
                    finalAccountId
                )
                : null;


        // ==================================================
        // Validate Account Availability
        // ==================================================

        if (finalAccountId) {

            await this.validateAccountAvailability(
                finalAccountId,
                id
            );

        }


        // ==================================================
        // Validate Final Fiscal Period
        // ==================================================

        const fiscalPeriod =
            finalFiscalPeriodId
                ? await this.validateFiscalPeriod(
                    finalFiscalPeriodId
                )
                : null;


        // ==================================================
        // Validate Final Fund
        // ==================================================

        const fund =
            finalFundId
                ? await this.validateFund(
                    finalFundId
                )
                : null;


        // ==================================================
        // Fiscal Period Compatibility
        // ==================================================

        this.validateFiscalPeriodCompatibility(
            finalFiscalPeriodId,
            account,
            fund
        );


        // ==================================================
        // Type Specific Validation
        // ==================================================

        this.validateTypeSpecificFields(
            finalType,
            finalBankName,
            finalCardNumber
        );


        // ==================================================
        // Update
        // ==================================================

        return await financialAccountRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Delete Financial Account
    // ======================================================

    async delete(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Existing Financial Account
        // --------------------------------------------------

        const financialAccount =
            await this.getById(id);


        // --------------------------------------------------
        // Lifecycle Delete Guard
        // --------------------------------------------------

        await this.validateDelete(
            financialAccount
        );


        // --------------------------------------------------
        // Delete
        // --------------------------------------------------

        return await financialAccountRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FinancialAccountService();