const crypto = require("crypto");
const { Prisma } = require("@prisma/client");

const AppError =
    require("../utils/AppError");

const prisma =
    require("../config/prisma");

const chargePaymentRepository =
    require("../repositories/chargePayment.repository");

const chargeRepository =
    require("../repositories/charge.repository");

const unitAccountRepository =
    require("../repositories/unitAccount.repository");

const residentRepository =
    require("../repositories/resident.repository");

const accessService =
    require("./access.service");

const journalEntryService =
    require("./journalEntry.service");


// ======================================================
// Helpers
// ======================================================

function isValidUUID(value) {

    if (!value) {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );

}


// ======================================================
// Validate Amount
// ======================================================

function validateAmount(amount) {

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {

        throw new AppError(
            "Payment amount must be greater than zero",
            400
        );

    }

    return numericAmount;

}


// ======================================================
// Get Unit Account
// ======================================================

async function getUnitAccount(
    unitAccountId,
    client = prisma
) {

    if (
        !isValidUUID(unitAccountId)
    ) {

        throw new AppError(
            "Invalid unitAccountId",
            400
        );

    }

    const unitAccount =
        await unitAccountRepository.findById(
            unitAccountId,
            client
        );

    if (!unitAccount) {

        throw new AppError(
            "Unit account not found",
            404
        );

    }

    return unitAccount;

}


// ======================================================
// Get Charge
// ======================================================

async function getCharge(
    chargeId,
    client = prisma
) {

    if (!chargeId) {
        return null;
    }

    if (!isValidUUID(chargeId)) {

        throw new AppError(
            "Invalid chargeId",
            400
        );

    }

    return await chargeRepository.findById(
        chargeId,
        client
    );

}


// ======================================================
// Get Resident
// ======================================================

async function getResident(
    residentId,
    client = prisma
) {

    if (!residentId) {
        return null;
    }

    if (!isValidUUID(residentId)) {

        throw new AppError(
            "Invalid residentId",
            400
        );

    }

    const resident =
        await residentRepository.findById(
            residentId,
            client
        );

    if (!resident) {

        throw new AppError(
            "Resident not found",
            404
        );

    }

    return resident;

}




// ======================================================
// Validate Charge Ownership
// ======================================================

function validateChargeOwnership(
    charge,
    unitAccountId
) {

    if (!charge) {

        throw new AppError(
            "Charge not found",
            404
        );

    }

    if (
        charge.unitAccountId !==
        unitAccountId
    ) {

        throw new AppError(
            "Charge does not belong to the selected unit account",
            400
        );

    }

}


// ======================================================
// Validate Resident Ownership
// ======================================================

function validateResidentOwnership(
    resident,
    unitAccount
) {

    if (!resident) {
        return;
    }

    if (
        resident.unitId &&
        unitAccount.unitId &&
        resident.unitId !== unitAccount.unitId
    ) {

        throw new AppError(
            "Resident does not belong to the selected unit",
            400
        );

    }

}


// ======================================================
// Require Unit Account Complex Access
// ======================================================

async function requireUnitAccountComplexAccess(
    user,
    unitAccount
) {
    if (!user) {
        throw new AppError("Authentication required", 401);
    }

    if (!unitAccount) {
        throw new AppError("Unit account not found", 404);
    }

    // Fail closed: missing access-control code must never grant access.
    if (
        typeof accessService.requireUnitAccountComplexAccess !==
        "function"
    ) {
        throw new AppError(
            "Unit account access control is not configured.",
            500
        );
    }

    return await accessService.requireUnitAccountComplexAccess(
        user,
        unitAccount
    );
}

// ======================================================
// Validate Financial Account
// ======================================================

async function validateFinancialAccount(
    tx,
    financialAccountId,
    fiscalPeriodId
) {

    if (
        !financialAccountId
    ) {

        throw new AppError(
            "financialAccountId is required",
            400
        );

    }

    if (
        !isValidUUID(financialAccountId)
    ) {

        throw new AppError(
            "Invalid financialAccountId",
            400
        );

    }

    const financialAccount =
        await tx.financialAccount.findUnique({

            where: {
                id: financialAccountId
            },

            select: {

                id: true,
                code: true,
                name: true,
                type: true,
                status: true,

                bankName: true,
                accountNumber: true,
                cardNumber: true,
                iban: true,

                openingBalance: true,

                fiscalPeriodId: true,
                fundId: true,
                accountId: true,

                account: {

                    select: {

                        id: true,
                        code: true,
                        name: true,
                        type: true,
                        isActive: true,
                        fiscalPeriodId: true,

                        children: {

                            select: {
                                id: true
                            }

                        }

                    }

                }

            }

        });


    if (!financialAccount) {

        throw new AppError(
            "Financial account not found",
            404
        );

    }


    // --------------------------------------------------
    // Financial Account must be ACTIVE
    // --------------------------------------------------

    if (
        financialAccount.status !==
        "ACTIVE"
    ) {

        throw new AppError(
            `Financial account is not active: ${financialAccount.code}`,
            400
        );

    }


    // --------------------------------------------------
    // Financial Account must belong to Fiscal Period
    // --------------------------------------------------

    if (
        !financialAccount.fiscalPeriodId
    ) {

        throw new AppError(
            `Financial account ${financialAccount.code} is not assigned to a fiscal period`,
            400
        );

    }


    if (
        financialAccount.fiscalPeriodId !==
        fiscalPeriodId
    ) {

        throw new AppError(
            `Financial account ${financialAccount.code} does not belong to the payment fiscal period`,
            400
        );

    }


    // --------------------------------------------------
    // Financial Account must have Posting Account
    // --------------------------------------------------

    if (
        !financialAccount.accountId
    ) {

        throw new AppError(
            `Financial account ${financialAccount.code} is not linked to an accounting account`,
            400
        );

    }


    // --------------------------------------------------
    // Linked Account
    // --------------------------------------------------

    const postingAccount =
        financialAccount.account;


    if (!postingAccount) {

        throw new AppError(
            `Accounting account linked to financial account ${financialAccount.code} was not found`,
            400
        );

    }


    // --------------------------------------------------
    // Account must be Active
    // --------------------------------------------------

    if (
        !postingAccount.isActive
    ) {

        throw new AppError(
            `Accounting account is inactive: ${postingAccount.code}`,
            400
        );

    }


    // --------------------------------------------------
    // Account Fiscal Period
    // --------------------------------------------------

    if (
        postingAccount.fiscalPeriodId !==
        fiscalPeriodId
    ) {

        throw new AppError(
            `Accounting account ${postingAccount.code} does not belong to the payment fiscal period`,
            400
        );

    }


    // --------------------------------------------------
    // Account Type
    // --------------------------------------------------

    if (
        postingAccount.type !==
        "ASSET"
    ) {

        throw new AppError(
            `Financial account ${financialAccount.code} must be linked to an ASSET posting account`,
            400
        );

    }


    // --------------------------------------------------
    // Account must be Leaf
    // --------------------------------------------------

    if (
        postingAccount.children &&
        postingAccount.children.length > 0
    ) {

        throw new AppError(
            `Financial account ${financialAccount.code} is linked to a non-leaf accounting account`,
            400
        );

    }


    return {

        financialAccount,

        postingAccount

    };

}


// ======================================================
// Get Accounting Configuration
// ======================================================

async function getAccountingConfiguration(
    tx,
    fiscalPeriodId
) {

    const configuration =
        await tx.accountingConfiguration.findUnique({

            where: {
                fiscalPeriodId
            },

            select: {

                id: true,

                fiscalPeriodId: true,

                chargeReceivableAccountId: true,

                chargeRevenueAccountId: true,

                chargeReceivableAccount: {

                    select: {

                        id: true,
                        code: true,
                        name: true,
                        type: true,
                        isActive: true,
                        fiscalPeriodId: true,

                        children: {

                            select: {
                                id: true
                            }

                        }

                    }

                },

                chargeRevenueAccount: {

                    select: {

                        id: true,
                        code: true,
                        name: true,
                        type: true,
                        isActive: true,
                        fiscalPeriodId: true,

                        children: {

                            select: {
                                id: true
                            }

                        }

                    }

                }

            }

        });


    if (!configuration) {

        throw new AppError(
            "Accounting configuration not found for the fiscal period",
            400
        );

    }


    if (
        !configuration.chargeReceivableAccountId
    ) {

        throw new AppError(
            "Charge receivable account is not configured",
            400
        );

    }


    if (
        !configuration.chargeRevenueAccountId
    ) {

        throw new AppError(
            "Charge revenue account is not configured",
            400
        );

    }


    // --------------------------------------------------
    // Receivable Account
    // --------------------------------------------------

    const receivableAccount =
        configuration.chargeReceivableAccount;


    if (!receivableAccount) {

        throw new AppError(
            "Charge receivable account not found",
            400
        );

    }


    if (
        !receivableAccount.isActive
    ) {

        throw new AppError(
            `Charge receivable account is inactive: ${receivableAccount.code}`,
            400
        );

    }


    if (
        receivableAccount.fiscalPeriodId !==
        fiscalPeriodId
    ) {

        throw new AppError(
            `Charge receivable account ${receivableAccount.code} does not belong to the selected fiscal period`,
            400
        );

    }


    if (
        receivableAccount.type !==
        "ASSET"
    ) {

        throw new AppError(
            `Charge receivable account must be an ASSET account: ${receivableAccount.code}`,
            400
        );

    }


    if (
        receivableAccount.children &&
        receivableAccount.children.length > 0
    ) {

        throw new AppError(
            `Charge receivable account must be a leaf account: ${receivableAccount.code}`,
            400
        );

    }


    // --------------------------------------------------
    // Revenue Account
    // --------------------------------------------------

    const revenueAccount =
        configuration.chargeRevenueAccount;


    if (!revenueAccount) {

        throw new AppError(
            "Charge revenue account not found",
            400
        );

    }


    if (
        !revenueAccount.isActive
    ) {

        throw new AppError(
            `Charge revenue account is inactive: ${revenueAccount.code}`,
            400
        );

    }


    if (
        revenueAccount.fiscalPeriodId !==
        fiscalPeriodId
    ) {

        throw new AppError(
            `Charge revenue account ${revenueAccount.code} does not belong to the selected fiscal period`,
            400
        );

    }


    if (
        revenueAccount.type !==
        "REVENUE"
    ) {

        throw new AppError(
            `Charge revenue account must be a REVENUE account: ${revenueAccount.code}`,
            400
        );

    }


    if (
        revenueAccount.children &&
        revenueAccount.children.length > 0
    ) {

        throw new AppError(
            `Charge revenue account must be a leaf account: ${revenueAccount.code}`,
            400
        );

    }


    // --------------------------------------------------
    // Receivable and Revenue must differ
    // --------------------------------------------------

    if (
        receivableAccount.id ===
        revenueAccount.id
    ) {

        throw new AppError(
            "Charge receivable and charge revenue accounts cannot be the same",
            400
        );

    }


    return {

        configuration,

        receivableAccount,

        revenueAccount

    };

}


// ======================================================
// Validate Charge for Transaction
// ======================================================

function validateChargeForTransaction(
    charge,
    unitAccountId
) {

    if (!charge) {

        throw new AppError(
            "Charge not found",
            404
        );

    }


    if (
        charge.unitAccountId !==
        unitAccountId
    ) {

        throw new AppError(
            "Charge does not belong to the selected unit account",
            400
        );

    }


    if (
        charge.status ===
        "CANCELLED"
    ) {

        throw new AppError(
            "Cancelled charge cannot receive payment",
            400
        );

    }


    if (
        !charge.fiscalPeriodId
    ) {

        throw new AppError(
            "Charge is not assigned to a fiscal period",
            400
        );

    }

}


// ======================================================
// Charge Payment Service
// ======================================================

class ChargePaymentService {


    // ==================================================
    // Create Payment
    // ==================================================

    async createPayment(
        data,
        user
    ) {

        // ------------------------------------------------
        // Authentication
        // ------------------------------------------------

        if (!user) {

            throw new AppError(
                "Authentication required",
                401
            );

        }


        // ------------------------------------------------
        // Request Body
        // ------------------------------------------------

        if (!data) {

            throw new AppError(
                "Request body is required",
                400
            );

        }


        // ------------------------------------------------
        // Required Fields
        // ------------------------------------------------

        const {
            unitAccountId,
            chargeId,
            residentId,
            financialAccountId,
            amount,
            paymentDate,
            description
        } = data;


        if (!unitAccountId) {

            throw new AppError(
                "unitAccountId is required",
                400
            );

        }


        if (!financialAccountId) {

            throw new AppError(
                "financialAccountId is required",
                400
            );

        }


        const numericAmount =
            validateAmount(amount);


        // ------------------------------------------------
        // Unit Account
        // ------------------------------------------------

        const unitAccount =
            await getUnitAccount(
                unitAccountId
            );


        // ------------------------------------------------
        // Access
        // ------------------------------------------------

        await requireUnitAccountComplexAccess(
            user,
            unitAccount
        );


        // ------------------------------------------------
        // Charge
        // ------------------------------------------------

        const charge =
            await getCharge(
                chargeId
            );


        validateChargeOwnership(
            charge,
            unitAccountId
        );


        // ------------------------------------------------
        // Resident
        // ------------------------------------------------

        const resident =
            await getResident(
                residentId
            );


        validateResidentOwnership(
            resident,
            unitAccount
        );


        // ------------------------------------------------
        // Payment Date
        // ------------------------------------------------

        let normalizedPaymentDate =
            new Date();

        if (
            paymentDate !== undefined &&
            paymentDate !== null &&
            paymentDate !== ""
        ) {

            normalizedPaymentDate =
                new Date(paymentDate);

        }


        if (
            Number.isNaN(
                normalizedPaymentDate.getTime()
            )
        ) {

            throw new AppError(
                "Invalid paymentDate",
                400
            );

        }


        // =================================================
        // SERIALIZABLE TRANSACTION
        // =================================================

        try {

            return await prisma.$transaction(

                async (tx) => {

                    // -------------------------------------
                    // Re-read Charge inside Transaction
                    // -------------------------------------

                    const transactionCharge =
                        await tx.charge.findUnique({

                            where: {
                                id: charge.id
                            },

                            include: {

                                payments: {

                                    select: {

                                        id: true,
                                        amount: true

                                    }

                                }

                            }

                        });


                    validateChargeForTransaction(
                        transactionCharge,
                        unitAccountId
                    );


                    // -------------------------------------
                    // Validate Financial Account
                    // -------------------------------------

                    const {
                        financialAccount,
                        postingAccount
                    } =
                        await validateFinancialAccount(

                            tx,

                            financialAccountId,

                            transactionCharge.fiscalPeriodId

                        );


                    // -------------------------------------
                    // Accounting Configuration
                    // -------------------------------------

                    const {
                        receivableAccount
                    } =
                        await getAccountingConfiguration(

                            tx,

                            transactionCharge.fiscalPeriodId

                        );


                    // -------------------------------------
                    // Calculate Paid Amount
                    // -------------------------------------

                    const paidAmount =
                        transactionCharge.payments.reduce(

                            (sum, payment) =>
                                sum +
                                Number(
                                    payment.amount || 0
                                ),

                            0

                        );


                    const chargeAmount =
                        Number(
                            transactionCharge.amount
                        );


                    const remainingAmount =
                        chargeAmount -
                        paidAmount;


                    // -------------------------------------
                    // Already Fully Paid
                    // -------------------------------------

                    if (
                        remainingAmount <= 0
                    ) {

                        throw new AppError(
                            "Charge is already fully paid",
                            400
                        );

                    }


                    // -------------------------------------
                    // Overpayment
                    // -------------------------------------

                    if (
                        numericAmount >
                        remainingAmount
                    ) {

                        throw new AppError(
                            `Payment amount exceeds remaining charge amount. Remaining: ${remainingAmount}`,
                            400
                        );

                    }


                    // =================================================
                    // Journal Entry
                    // =================================================
                    //
                    // Payment accounting:
                    //
                    // Debit:
                    //   Financial Account's linked posting Account
                    //
                    // Credit:
                    //   Charge Receivable
                    //
                    // IMPORTANT:
                    //
                    // JournalEntry is first created as DRAFT
                    // through JournalEntryService and then posted
                    // through the SAME transaction client.
                    //
                    // Therefore if anything fails afterwards,
                    // the JournalEntry is rolled back together
                    // with ChargePayment and Charge status.
                    // =================================================

                    const journalEntryData = {

                        entryNumber:
                            `JV-CP-${crypto.randomUUID()}`,

                        entryDate:
                            normalizedPaymentDate,

                        description:
                            description ||
                            `Charge payment - ${transactionCharge.id}`,

                        fiscalPeriodId:
                            transactionCharge.fiscalPeriodId,

                        fundId:
                            financialAccount.fundId ||
                            null,

                        lines: [

                            {

                                accountId:
                                    postingAccount.id,

                                description:
                                    description ||
                                    `Charge payment - ${transactionCharge.id}`,

                                debit:
                                    numericAmount,

                                credit:
                                    0

                            },

                            {

                                accountId:
                                    receivableAccount.id,

                                description:
                                    description ||
                                    `Charge payment - ${transactionCharge.id}`,

                                debit:
                                    0,

                                credit:
                                    numericAmount

                            }

                        ]

                    };


                    // -------------------------------------
                    // Create Journal Entry as DRAFT
                    // -------------------------------------

                    const journalEntryDraft =
                        await journalEntryService.createWithClient(

                            journalEntryData,

                            tx

                        );


                    // -------------------------------------
                    // Post Journal Entry
                    // -------------------------------------

                    const journalEntry =
                        await journalEntryService.postWithClient(

                            journalEntryDraft.id,

                            tx

                        );


                    // =================================================
                    // Create Charge Payment
                    // =================================================

                    const payment =
                        await chargePaymentRepository.createWithClient(

                            tx,

                            {

                                unitAccountId,

                                chargeId:
                                    transactionCharge.id,

                                residentId:
                                    residentId || null,

                                financialAccountId:
                                    financialAccount.id,

                                journalEntryId:
                                    journalEntry.id,

                                amount:
                                    numericAmount,

                                paymentDate:
                                    normalizedPaymentDate,

                                description:
                                    description || null

                            }

                        );


                    // =================================================
                    // Calculate New Charge Status
                    // =================================================

                    const newPaidAmount =
                        paidAmount +
                        numericAmount;


                    let newChargeStatus =
                        "PARTIALLY_PAID";


                    if (
                        Math.abs(
                            newPaidAmount -
                            chargeAmount
                        ) < 0.000001
                    ) {

                        newChargeStatus =
                            "PAID";

                    }


                    // -------------------------------------
                    // Update Charge
                    // -------------------------------------

                    const updatedCharge =
                        await chargeRepository.updateWithClient(

                            tx,

                            transactionCharge.id,

                            {

                                status:
                                    newChargeStatus

                            }

                        );


                    // =================================================
                    // Return Transaction Result
                    // =================================================

                    return {

                        payment,

                        journalEntry,

                        charge:
                            updatedCharge

                    };

                },

                {

                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable

                }

            );

        }

        catch (error) {

            // ---------------------------------------------
            // Serializable Transaction Conflict
            // ---------------------------------------------

            if (
                error &&
                error.code === "P2034"
            ) {

                throw new AppError(
                    "Payment could not be completed because another transaction modified the charge at the same time. Please retry.",
                    409
                );

            }


            throw error;

        }

    }


    // ==================================================
    // Get Payment By ID
    // ==================================================

    async getPaymentById(
        id,
        user
    ) {

        if (!id) {

            throw new AppError(
                "id is required",
                400
            );

        }


        const payment =
            await chargePaymentRepository.findById(
                id
            );


        if (!payment) {

            throw new AppError(
                "Charge payment not found",
                404
            );

        }


        const unitAccount =
            await getUnitAccount(
                payment.unitAccountId
            );


        await requireUnitAccountComplexAccess(
            user,
            unitAccount
        );


        return payment;

    }


    // ==================================================
    // Get Payments
    // ==================================================

    async getPayments(
        filters,
        user
    ) {

        const payments =
            await chargePaymentRepository.findAll(
                filters
            );


        /*
         * Preserve repository filtering and then
         * enforce access for each returned payment.
         */

        const result = [];

        for (
            const payment of payments
        ) {

            const unitAccount =
                await getUnitAccount(
                    payment.unitAccountId
                );


            try {

                await requireUnitAccountComplexAccess(
                    user,
                    unitAccount
                );

                result.push(payment);

            }
            catch (error) {

                /*
                 * Hide records for which the current user
                 * has no complex access.
                 */

                if (
                    error &&
                    error.statusCode === 403
                ) {

                    continue;

                }

                throw error;

            }

        }


        return result;

    }


    // ==================================================
    // Get Payments By Charge
    // ==================================================

    async getPaymentsByCharge(
        chargeId,
        user
    ) {

        if (!chargeId) {

            throw new AppError(
                "chargeId is required",
                400
            );

        }


        const charge =
            await getCharge(
                chargeId
            );


        if (!charge) {

            throw new AppError(
                "Charge not found",
                404
            );

        }


        const unitAccount =
            await getUnitAccount(
                charge.unitAccountId
            );


        await requireUnitAccountComplexAccess(
            user,
            unitAccount
        );


        return await chargePaymentRepository.findByChargeId(
            chargeId
        );

    }


    // ==================================================
    // Get Payments By Unit Account
    // ==================================================

    async getPaymentsByUnitAccount(
        unitAccountId,
        user
    ) {

        if (!unitAccountId) {

            throw new AppError(
                "unitAccountId is required",
                400
            );

        }


        const unitAccount =
            await getUnitAccount(
                unitAccountId
            );


        await requireUnitAccountComplexAccess(
            user,
            unitAccount
        );


        return await chargePaymentRepository.findByUnitAccountId(
            unitAccountId
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new ChargePaymentService();