const {
    Prisma
} =
    require("@prisma/client");


const AppError =
    require("../utils/AppError");

const prisma =
    require("../config/prisma");

const chargeRepository =
    require("../repositories/charge.repository");

const unitAccountRepository =
    require("../repositories/unitAccount.repository");

const accessService =
    require("./access.service");


class ChargeService {


    // ======================================================
    // UUID Validation
    // ======================================================

    isValidUUID(id) {

        return typeof id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    }


    // ======================================================
    // Get Unit Account
    // ======================================================

    async getUnitAccount(unitAccountId) {

        if (!this.isValidUUID(unitAccountId)) {

            throw new AppError(
                "Invalid unit account ID.",
                400
            );

        }

        const unitAccount =
            await unitAccountRepository.findById(
                unitAccountId
            );

        if (!unitAccount) {

            throw new AppError(
                "Unit account not found.",
                404
            );

        }

        return unitAccount;

    }


    // ======================================================
    // Validate Unit Account Access
    // ======================================================

    async validateUnitAccountAccess(
        user,
        unitAccount
    ) {

        if (!user) {

            throw new AppError(
                "Authentication required.",
                401
            );

        }

        if (user.role === "ADMIN") {

            return;

        }

        if (user.role !== "MANAGER") {

            throw new AppError(
                "Access denied.",
                403
            );

        }

        const complexId =
            unitAccount.unit?.building?.complexId ||
            unitAccount.unit?.property?.complexId;

        if (!complexId) {

            throw new AppError(
                "Unit account is not associated with a complex.",
                400
            );

        }

        await accessService.requireComplexAccess(
            user,
            complexId
        );

    }


    // ======================================================
    // Validate Charge Type
    // ======================================================

    validateChargeType(type) {

        const allowedTypes = [

            "MONTHLY",
            "QUARTERLY",
            "ANNUAL",
            "SPECIAL",
            "UTILITY",
            "OTHER"

        ];

        if (!allowedTypes.includes(type)) {

            throw new AppError(
                "Invalid charge type.",
                400
            );

        }

    }


    // ======================================================
    // Validate Period
    // ======================================================

    validatePeriod(
        periodYear,
        periodMonth
    ) {

        if (
            periodYear === undefined ||
            periodYear === null
        ) {

            throw new AppError(
                "Period year is required.",
                400
            );

        }

        if (
            !Number.isInteger(periodYear) ||
            periodYear < 1300 ||
            periodYear > 1500
        ) {

            throw new AppError(
                "Invalid period year.",
                400
            );

        }

        if (
            periodMonth !== undefined &&
            periodMonth !== null
        ) {

            if (
                !Number.isInteger(periodMonth) ||
                periodMonth < 1 ||
                periodMonth > 12
            ) {

                throw new AppError(
                    "Period month must be between 1 and 12.",
                    400
                );

            }

        }

    }


    // ======================================================
    // Validate Amount
    // ======================================================

    validateAmount(amount) {

        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            throw new AppError(
                "Charge amount is required.",
                400
            );

        }

        const numericAmount =
            Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {

            throw new AppError(
                "Charge amount must be greater than zero.",
                400
            );

        }

        return numericAmount;

    }


    // ======================================================
    // Validate Description
    // ======================================================

    validateDescription(description) {

        if (
            typeof description !== "string" ||
            !description.trim()
        ) {

            throw new AppError(
                "Charge description is required.",
                400
            );

        }

        return description.trim();

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriod(
        fiscalPeriodId,
        client = prisma
    ) {

        if (!fiscalPeriodId) {

            throw new AppError(
                "Fiscal period ID is required.",
                400
            );

        }

        if (!this.isValidUUID(fiscalPeriodId)) {

            throw new AppError(
                "Invalid fiscal period ID.",
                400
            );

        }

        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: fiscalPeriodId
                },

                select: {

                    id: true,
                    code: true,
                    name: true,
                    status: true,
                    startDate: true,
                    endDate: true

                }

            });


        if (!fiscalPeriod) {

            throw new AppError(
                "Fiscal period not found.",
                404
            );

        }


        if (
            fiscalPeriod.status !==
            "ACTIVE"
        ) {

            throw new AppError(
                "Fiscal period is not active.",
                400
            );

        }


        return fiscalPeriod;

    }


    // ======================================================
    // Get Accounting Configuration
    // ======================================================

    async getAccountingConfiguration(
        client,
        fiscalPeriodId
    ) {

        const configuration =
            await client.accountingConfiguration.findUnique({

                where: {
                    fiscalPeriodId
                },

                select: {

                    id: true,

                    fiscalPeriodId: true,

                    chargeReceivableAccountId: true,

                    chargeRevenueAccountId: true

                }

            });


        if (!configuration) {

            throw new AppError(
                "Accounting configuration for the fiscal period was not found.",
                400
            );

        }


        if (
            !configuration.chargeReceivableAccountId
        ) {

            throw new AppError(
                "Charge receivable account is not configured.",
                400
            );

        }


        if (
            !configuration.chargeRevenueAccountId
        ) {

            throw new AppError(
                "Charge revenue account is not configured.",
                400
            );

        }


        return configuration;

    }


    // ======================================================
    // Validate Posting Account
    // ======================================================

    async validatePostingAccount(
        client,
        accountId,
        fiscalPeriodId,
        expectedType,
        fieldName
    ) {

        const account =
            await client.account.findUnique({

                where: {
                    id: accountId
                },

                select: {

                    id: true,
                    code: true,
                    name: true,
                    type: true,
                    isActive: true,
                    fiscalPeriodId: true

                }

            });


        if (!account) {

            throw new AppError(
                `${fieldName} was not found.`,
                400
            );

        }


        if (!account.isActive) {

            throw new AppError(
                `${fieldName} is inactive.`,
                400
            );

        }


        if (
            account.fiscalPeriodId !==
            fiscalPeriodId
        ) {

            throw new AppError(
                `${fieldName} belongs to a different fiscal period.`,
                400
            );

        }


        if (
            account.type !==
            expectedType
        ) {

            throw new AppError(
                `${fieldName} must be ${expectedType}.`,
                400
            );

        }


        const child =
            await client.account.findFirst({

                where: {
                    parentId: account.id
                },

                select: {
                    id: true
                }

            });


        if (child) {

            throw new AppError(
                `${fieldName} must be a posting account.`,
                400
            );

        }


        return account;

    }


    // ======================================================
    // Create Charge Journal Entry
    // ======================================================

    async createChargeJournalEntry(
        tx,
        {
            charge,
            amount,
            receivableAccount,
            revenueAccount,
            issueDate,
            description
        }
    ) {

        const entryNumber =
            `JV-CHARGE-${charge.id}`;


        const entryDescription =
            description ||
            `Charge issuance - ${charge.id}`;


        const journalEntry =
            await tx.journalEntry.create({

                data: {

                    entryNumber,

                    entryDate:
                        issueDate,

                    description:
                        entryDescription,

                    status:
                        "POSTED",

                    fiscalPeriodId:
                        charge.fiscalPeriodId,

                    fundId:
                        null,

                    lines: {

                        create: [

                            {

                                accountId:
                                    receivableAccount.id,

                                description:
                                    entryDescription,

                                debit:
                                    amount,

                                credit:
                                    0

                            },

                            {

                                accountId:
                                    revenueAccount.id,

                                description:
                                    entryDescription,

                                debit:
                                    0,

                                credit:
                                    amount

                            }

                        ]

                    }

                },

                include: {

                    fiscalPeriod: true,

                    fund: true,

                    lines: {

                        orderBy: {

                            createdAt:
                                "asc"

                        },

                        include: {

                            account: true

                        }

                    }

                }

            });


        return journalEntry;

    }


    // ======================================================
    // Create Charge
    // ======================================================

    async createCharge(
        data,
        user
    ) {

        if (
            !data ||
            typeof data !== "object"
        ) {

            throw new AppError(
                "Charge data is required.",
                400
            );

        }


        if (!data.unitAccountId) {

            throw new AppError(
                "Unit account ID is required.",
                400
            );

        }


        // --------------------------------------------------
        // Unit Account
        // --------------------------------------------------

        const unitAccount =
            await this.getUnitAccount(
                data.unitAccountId
            );


        await this.validateUnitAccountAccess(
            user,
            unitAccount
        );


        if (!unitAccount.isActive) {

            throw new AppError(
                "Unit account is inactive.",
                400
            );

        }


        // --------------------------------------------------
        // Basic Validation
        // --------------------------------------------------

        this.validateChargeType(
            data.type
        );


        this.validatePeriod(
            data.periodYear,
            data.periodMonth
        );


        const amount =
            this.validateAmount(
                data.amount
            );


        const description =
            this.validateDescription(
                data.description
            );


        // --------------------------------------------------
        // Issue Date
        // --------------------------------------------------

        let issueDate =
            data.issueDate
                ? new Date(data.issueDate)
                : new Date();


        if (
            Number.isNaN(
                issueDate.getTime()
            )
        ) {

            throw new AppError(
                "Invalid issue date.",
                400
            );

        }


        // --------------------------------------------------
        // Due Date
        // --------------------------------------------------

        let dueDate = null;


        if (
            data.dueDate !== undefined &&
            data.dueDate !== null &&
            data.dueDate !== ""
        ) {

            dueDate =
                new Date(data.dueDate);


            if (
                Number.isNaN(
                    dueDate.getTime()
                )
            ) {

                throw new AppError(
                    "Invalid due date.",
                    400
                );

            }


            if (
                dueDate < issueDate
            ) {

                throw new AppError(
                    "Due date cannot be earlier than issue date.",
                    400
                );

            }

        }


        // ==================================================
        // Transaction
        // ==================================================

        try {

            return await prisma.$transaction(

                async (tx) => {


                    // --------------------------------------
                    // Fiscal Period
                    // --------------------------------------

                    const fiscalPeriod =
                        await this.validateFiscalPeriod(

                            data.fiscalPeriodId,

                            tx

                        );


                    // --------------------------------------
                    // Issue Date in Period
                    // --------------------------------------

                    if (
                        issueDate <
                        fiscalPeriod.startDate ||
                        issueDate >
                        fiscalPeriod.endDate
                    ) {

                        throw new AppError(
                            "Issue date must be within the selected fiscal period.",
                            400
                        );

                    }


                    // --------------------------------------
                    // Accounting Configuration
                    // --------------------------------------

                    const configuration =
                        await this.getAccountingConfiguration(

                            tx,

                            fiscalPeriod.id

                        );


                    // --------------------------------------
                    // Receivable Account
                    // --------------------------------------

                    const receivableAccount =
                        await this.validatePostingAccount(

                            tx,

                            configuration
                                .chargeReceivableAccountId,

                            fiscalPeriod.id,

                            "ASSET",

                            "Charge receivable account"

                        );


                    // --------------------------------------
                    // Revenue Account
                    // --------------------------------------

                    const revenueAccount =
                        await this.validatePostingAccount(

                            tx,

                            configuration
                                .chargeRevenueAccountId,

                            fiscalPeriod.id,

                            "REVENUE",

                            "Charge revenue account"

                        );


                    // --------------------------------------
                    // Create Charge
                    // --------------------------------------

                    const charge =
                        await chargeRepository
                            .createWithClient(

                                tx,

                                {

                                    unitAccountId:
                                        data.unitAccountId,

                                    fiscalPeriodId:
                                        fiscalPeriod.id,

                                    type:
                                        data.type,

                                    periodYear:
                                        data.periodYear,

                                    periodMonth:
                                        data.periodMonth !== undefined &&
                                        data.periodMonth !== null
                                            ? data.periodMonth
                                            : null,

                                    amount,

                                    description,

                                    issueDate,

                                    dueDate,

                                    status:
                                        "ISSUED"

                                }

                            );


                    // --------------------------------------
                    // Create Accounting Entry
                    // --------------------------------------

                    const journalEntry =
                        await this
                            .createChargeJournalEntry(

                                tx,

                                {

                                    charge,

                                    amount,

                                    receivableAccount,

                                    revenueAccount,

                                    issueDate,

                                    description

                                }

                            );


                    // --------------------------------------
                    // Return
                    // --------------------------------------

                    return {

                        charge,

                        journalEntry

                    };

                },

                {

                    isolationLevel:
                        Prisma
                            .TransactionIsolationLevel
                            .Serializable

                }

            );

        } catch (error) {

            if (
                error?.code === "P2034"
            ) {

                throw new AppError(
                    "Charge could not be created because another transaction was processed concurrently. Please retry.",
                    409
                );

            }


            if (
                error?.code === "P2003"
            ) {

                throw new AppError(
                    "Invalid related record.",
                    400
                );

            }


            throw error;

        }

    }


    // ======================================================
    // Get Charges
    // ======================================================

    async getCharges(user) {

        if (!user) {

            throw new AppError(
                "Authentication required.",
                401
            );

        }


        const charges =
            await chargeRepository.findAll();


        if (user.role === "ADMIN") {

            return charges;

        }


        if (user.role !== "MANAGER") {

            throw new AppError(
                "Access denied.",
                403
            );

        }


        const accessibleCharges = [];


        for (
            const charge
            of charges
        ) {

            const unitAccount =
                charge.unitAccount;


            try {

                await this.validateUnitAccountAccess(
                    user,
                    unitAccount
                );


                accessibleCharges.push(
                    charge
                );

            } catch (error) {

                if (
                    error.statusCode === 403
                ) {

                    continue;

                }


                throw error;

            }

        }


        return accessibleCharges;

    }


    // ======================================================
    // Get Charge By ID
    // ======================================================

    async getChargeById(
        id,
        user
    ) {

        if (!this.isValidUUID(id)) {

            throw new AppError(
                "Invalid charge ID.",
                400
            );

        }


        const charge =
            await chargeRepository.findById(
                id
            );


        if (!charge) {

            throw new AppError(
                "Charge not found.",
                404
            );

        }


        await this.validateUnitAccountAccess(
            user,
            charge.unitAccount
        );


        return charge;

    }


    // ======================================================
    // Get Charges By Unit Account
    // ======================================================

    async getChargesByUnitAccount(
        unitAccountId,
        user
    ) {

        const unitAccount =
            await this.getUnitAccount(
                unitAccountId
            );


        await this.validateUnitAccountAccess(
            user,
            unitAccount
        );


        return await chargeRepository
            .findByUnitAccountId(
                unitAccountId
            );

    }


    // ======================================================
    // Update Charge
    // ======================================================

    async updateCharge(
        id,
        data,
        user
    ) {

        if (!this.isValidUUID(id)) {

            throw new AppError(
                "Invalid charge ID.",
                400
            );

        }


        const existingCharge =
            await chargeRepository.findById(
                id
            );


        if (!existingCharge) {

            throw new AppError(
                "Charge not found.",
                404
            );

        }


        await this.validateUnitAccountAccess(
            user,
            existingCharge.unitAccount
        );


        if (
            existingCharge.status ===
            "PAID"
        ) {

            throw new AppError(
                "Paid charge cannot be modified.",
                409
            );

        }


        if (
            existingCharge.status ===
            "PARTIALLY_PAID"
        ) {

            throw new AppError(
                "Partially paid charge cannot be modified.",
                409
            );

        }


        const updateData = {};


        if (data.type !== undefined) {

            this.validateChargeType(
                data.type
            );

            updateData.type =
                data.type;

        }


        if (
            data.periodYear !== undefined
        ) {

            this.validatePeriod(
                data.periodYear,

                data.periodMonth !== undefined
                    ? data.periodMonth
                    : existingCharge.periodMonth

            );

            updateData.periodYear =
                data.periodYear;

        }


        if (
            data.periodMonth !== undefined
        ) {

            this.validatePeriod(

                data.periodYear !== undefined
                    ? data.periodYear
                    : existingCharge.periodYear,

                data.periodMonth

            );

            updateData.periodMonth =
                data.periodMonth;

        }


        if (
            data.amount !== undefined
        ) {

            updateData.amount =
                this.validateAmount(
                    data.amount
                );

        }


        if (
            data.description !== undefined
        ) {

            updateData.description =
                this.validateDescription(
                    data.description
                );

        }


        if (
            data.issueDate !== undefined
        ) {

            const issueDate =
                new Date(
                    data.issueDate
                );


            if (
                Number.isNaN(
                    issueDate.getTime()
                )
            ) {

                throw new AppError(
                    "Invalid issue date.",
                    400
                );

            }


            updateData.issueDate =
                issueDate;

        }


        if (
            data.dueDate !== undefined
        ) {

            if (
                data.dueDate === null ||
                data.dueDate === ""
            ) {

                updateData.dueDate =
                    null;

            } else {

                const dueDate =
                    new Date(
                        data.dueDate
                    );


                if (
                    Number.isNaN(
                        dueDate.getTime()
                    )
                ) {

                    throw new AppError(
                        "Invalid due date.",
                        400
                    );

                }


                updateData.dueDate =
                    dueDate;

            }

        }


        if (
            Object.keys(updateData).length === 0
        ) {

            throw new AppError(
                "No valid fields to update.",
                400
            );

        }


        try {

            return await chargeRepository.update(
                id,
                updateData
            );

        } catch (error) {

            if (
                error.code === "P2003"
            ) {

                throw new AppError(
                    "Invalid related record.",
                    400
                );

            }

            throw error;

        }

    }


    // ======================================================
    // Cancel Charge
    // ======================================================

    async cancelCharge(
        id,
        user
    ) {

        if (!this.isValidUUID(id)) {

            throw new AppError(
                "Invalid charge ID.",
                400
            );

        }


        const charge =
            await chargeRepository.findById(
                id
            );


        if (!charge) {

            throw new AppError(
                "Charge not found.",
                404
            );

        }


        await this.validateUnitAccountAccess(
            user,
            charge.unitAccount
        );


        if (
            charge.status ===
            "PAID"
        ) {

            throw new AppError(
                "Paid charge cannot be cancelled.",
                409
            );

        }


        if (
            charge.status ===
            "PARTIALLY_PAID"
        ) {

            throw new AppError(
                "Partially paid charge cannot be cancelled.",
                409
            );

        }


        return await chargeRepository.update(

            id,

            {
                status:
                    "CANCELLED"
            }

        );

    }


    // ======================================================
    // Delete Charge
    // ======================================================

    async deleteCharge(
        id,
        user
    ) {

        if (!this.isValidUUID(id)) {

            throw new AppError(
                "Invalid charge ID.",
                400
            );

        }


        const charge =
            await chargeRepository.findById(
                id
            );


        if (!charge) {

            throw new AppError(
                "Charge not found.",
                404
            );

        }


        await this.validateUnitAccountAccess(
            user,
            charge.unitAccount
        );


        if (
            charge.payments &&
            charge.payments.length > 0
        ) {

            throw new AppError(
                "Charge with payments cannot be deleted.",
                409
            );

        }


        if (
            charge.status ===
            "PAID" ||
            charge.status ===
            "PARTIALLY_PAID"
        ) {

            throw new AppError(
                "Paid charge cannot be deleted.",
                409
            );

        }


        return await chargeRepository.delete(
            id
        );

    }

}


module.exports =
    new ChargeService();