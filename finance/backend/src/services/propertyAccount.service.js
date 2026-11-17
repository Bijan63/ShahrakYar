
"use strict";

const propertyAccountRepository =
    require("../repositories/propertyAccount.repository");

const {
    mainBackendRequest
} = require("../utils/mainBackendClient");


// ======================================================
// Constants
// ======================================================

const ALLOWED_STATUSES = [
    "ACTIVE",
    "INACTIVE"
];


// ======================================================
// Validation Helpers
// ======================================================

const validateObject = (data) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        throw new Error(
            "Request body is required"
        );

    }

};


const normalizeRequiredString = (
    value,
    field
) => {

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {

        throw new Error(
            `${field} is required`
        );

    }

    return value.trim();

};


const normalizeOptionalId = (
    value,
    field
) => {

    if (value === null) {
        return null;
    }

    if (
        typeof value !== "string" ||
        !value.trim()
    ) {

        throw new Error(
            `Invalid ${field}`
        );

    }

    return value.trim();

};


const validateStatus = (status) => {

    if (!ALLOWED_STATUSES.includes(status)) {

        throw new Error(
            "Invalid status"
        );

    }

};


// ======================================================
// Prisma Error Handler
// ======================================================

const handlePrismaError = (error) => {

    if (error?.code === "P2002") {

        const target =
            error.meta?.target;

        const targetText =
            Array.isArray(target)
                ? target.join(" ")
                : String(target || "");

        if (targetText.includes("propertyId")) {

            throw new Error(
                "Property already has a finance account"
            );

        }

        if (targetText.includes("accountNumber")) {

            throw new Error(
                "Property account number already exists"
            );

        }

        throw new Error(
            "Property account data already exists"
        );

    }

    if (error?.code === "P2003") {

        throw new Error(
            "Operation blocked because linked records exist"
        );

    }

    throw error;

};


// ======================================================
// Property Account Service
// ======================================================

class PropertyAccountService {


    // ======================================================
    // Get All Property Accounts
    // ======================================================

    async getAll() {

        return await propertyAccountRepository.findAll();

    }


    // ======================================================
    // Get Property Account by ID
    // ======================================================

    async getById(id) {

        const accountId =
            normalizeRequiredString(
                id,
                "id"
            );

        const propertyAccount =
            await propertyAccountRepository.findById(
                accountId
            );

        if (!propertyAccount) {

            throw new Error(
                "Property account not found"
            );

        }

        return propertyAccount;

    }


    // ======================================================
    // Get Property Account by Property ID
    // ======================================================

    async getByPropertyId(propertyId) {

        const normalizedPropertyId =
            normalizeRequiredString(
                propertyId,
                "propertyId"
            );

        const propertyAccount =
            await propertyAccountRepository.findByPropertyId(
                normalizedPropertyId
            );

        if (!propertyAccount) {

            throw new Error(
                "Property account not found"
            );

        }

        return propertyAccount;

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriodId(id) {

        if (id === null) {
            return null;
        }

        const fiscalPeriodId =
            normalizeOptionalId(
                id,
                "fiscalPeriodId"
            );

        const fiscalPeriod =
            await propertyAccountRepository.findFiscalPeriodById(
                fiscalPeriodId
            );

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

    async validateFundId(
        id,
        requireActive = true
    ) {

        if (id === null) {
            return null;
        }

        const fundId =
            normalizeOptionalId(
                id,
                "fundId"
            );

        const fund =
            await propertyAccountRepository.findFundById(
                fundId
            );

        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }

        if (
            requireActive &&
            fund.status !== "ACTIVE"
        ) {

            throw new Error(
                "Fund is inactive"
            );

        }

        return fund;

    }


    // ======================================================
    // Validate Fiscal Period and Fund Compatibility
    // ======================================================

    validateFiscalPeriodFund(
        fiscalPeriodId,
        fund
    ) {

        if (
            fiscalPeriodId &&
            fund?.fiscalPeriodId &&
            fiscalPeriodId !== fund.fiscalPeriodId
        ) {

            throw new Error(
                "Property account fiscal period must match fund fiscal period"
            );

        }

    }


    // ======================================================
    // Get Main Backend Usage Counts
    // ======================================================

    async getUsageCounts(
        propertyId,
        token
    ) {

        const normalizedPropertyId =
            normalizeRequiredString(
                propertyId,
                "propertyId"
            );

        if (!token) {

            throw new Error(
                "Unauthorized"
            );

        }

        const response =
            await mainBackendRequest(
                `/api/properties/${encodeURIComponent(normalizedPropertyId)}/financial-usage`,
                token
            );

        const usage =
            response?.data;

        if (
            response?.success !== true ||
            !usage ||
            usage.propertyId !== normalizedPropertyId
        ) {

            throw new Error(
                response?.message ||
                "Unable to retrieve property financial usage"
            );

        }

        const countFields = [
            "unitCount",
            "unitAccountCount",
            "chargeCount",
            "paymentCount"
        ];

        for (const field of countFields) {

            if (
                !Number.isSafeInteger(usage[field]) ||
                usage[field] < 0
            ) {

                throw new Error(
                    `Invalid financial usage value: ${field}`
                );

            }

        }

        return usage;

    }


    // ======================================================
    // Validate Property in Main Backend
    // ======================================================

    async validateProperty(
        propertyId,
        token
    ) {

        if (!token) {

            throw new Error(
                "Unauthorized"
            );

        }

        const response =
            await mainBackendRequest(
                `/api/properties/${encodeURIComponent(propertyId)}`,
                token
            );

        if (
            !response ||
            response.success !== true ||
            !response.data
        ) {

            throw new Error(
                "Property not found in Main Backend"
            );

        }

        return response.data;

    }


    // ======================================================
    // Create Property Account
    // ======================================================

    async create(data, token) {

        validateObject(data);

        // --------------------------------------------------
        // Property ID
        // --------------------------------------------------

        const propertyId =
            normalizeRequiredString(
                data.propertyId,
                "propertyId"
            );


        // --------------------------------------------------
        // Account Number
        // --------------------------------------------------

        const accountNumber =
            normalizeRequiredString(
                data.accountNumber,
                "accountNumber"
            );


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        const name =
            normalizeRequiredString(
                data.name,
                "name"
            );


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        const status =
            data.status === undefined
                ? "ACTIVE"
                : data.status;

        validateStatus(status);


        // --------------------------------------------------
        // Validate Property in Main Backend
        // --------------------------------------------------

        await this.validateProperty(
            propertyId,
            token
        );


        // --------------------------------------------------
        // Prevent Duplicate Property Account
        // --------------------------------------------------

        const existingPropertyAccount =
            await propertyAccountRepository.findByPropertyId(
                propertyId
            );

        if (existingPropertyAccount) {

            throw new Error(
                "Property already has a finance account"
            );

        }


        // --------------------------------------------------
        // Prevent Duplicate Account Number
        // --------------------------------------------------

        const existingAccountNumber =
            await propertyAccountRepository.findByAccountNumber(
                accountNumber
            );

        if (existingAccountNumber) {

            throw new Error(
                "Property account number already exists"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        const fiscalPeriodId =
            data.fiscalPeriodId === undefined ||
            data.fiscalPeriodId === null
                ? null
                : (
                    await this.validateFiscalPeriodId(
                        data.fiscalPeriodId
                    )
                ).id;


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        const fund =
            data.fundId === undefined ||
            data.fundId === null
                ? null
                : await this.validateFundId(
                    data.fundId
                );


        // --------------------------------------------------
        // Validate Fiscal Period and Fund
        // --------------------------------------------------

        this.validateFiscalPeriodFund(
            fiscalPeriodId,
            fund
        );


        // --------------------------------------------------
        // Prepare Data
        // --------------------------------------------------

        const createData = {

            propertyId,

            accountNumber,

            name,

            status,

            fiscalPeriodId,

            fundId: fund?.id || null

        };


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        try {

            return await propertyAccountRepository.create(
                createData
            );

        } catch (error) {

            handlePrismaError(error);

        }

    }


    // ======================================================
    // Update Property Account
    // ======================================================

    async update(
        id,
        data,
        token
    ) {

        validateObject(data);

        const accountId =
            normalizeRequiredString(
                id,
                "id"
            );


        // --------------------------------------------------
        // Find Existing Account
        // --------------------------------------------------

        const existing =
            await this.getById(accountId);

        const updateData = {};


        // --------------------------------------------------
        // Property ID
        // --------------------------------------------------

        if (data.propertyId !== undefined) {

            const propertyId =
                normalizeRequiredString(
                    data.propertyId,
                    "propertyId"
                );

            if (
                propertyId !== existing.propertyId
            ) {

                throw new Error(
                    "propertyId cannot be changed"
                );

            }

        }


        // --------------------------------------------------
        // Account Number
        // --------------------------------------------------

        if (data.accountNumber !== undefined) {

            const accountNumber =
                normalizeRequiredString(
                    data.accountNumber,
                    "accountNumber"
                );

            const duplicate =
                await propertyAccountRepository.findByAccountNumber(
                    accountNumber
                );

            if (
                duplicate &&
                duplicate.id !== accountId
            ) {

                throw new Error(
                    "Property account number already exists"
                );

            }

            updateData.accountNumber =
                accountNumber;

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (data.name !== undefined) {

            updateData.name =
                normalizeRequiredString(
                    data.name,
                    "name"
                );

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (data.status !== undefined) {

            validateStatus(data.status);

            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Calculate New Fiscal Period
        // --------------------------------------------------

        let nextFiscalPeriodId =
            existing.fiscalPeriodId || null;

        if (data.fiscalPeriodId !== undefined) {

            if (data.fiscalPeriodId === null) {

                nextFiscalPeriodId = null;

            } else {

                const fiscalPeriod =
                    await this.validateFiscalPeriodId(
                        data.fiscalPeriodId
                    );

                nextFiscalPeriodId =
                    fiscalPeriod.id;

            }

        }


        // --------------------------------------------------
        // Calculate New Fund
        // --------------------------------------------------

        let nextFund =
            existing.fund || null;

        if (data.fundId !== undefined) {

            if (data.fundId === null) {

                nextFund = null;

            } else {

                const normalizedFundId =
                    normalizeOptionalId(
                        data.fundId,
                        "fundId"
                    );

                if (
                    normalizedFundId !== existing.fundId
                ) {

                    nextFund =
                        await this.validateFundId(
                            normalizedFundId
                        );

                }

            }

        }

        const nextFundId =
            nextFund?.id || null;


        // --------------------------------------------------
        // Validate Fiscal Period and Fund Compatibility
        // --------------------------------------------------

        this.validateFiscalPeriodFund(
            nextFiscalPeriodId,
            nextFund
        );


        // --------------------------------------------------
        // Detect Financial Link Changes
        // --------------------------------------------------

        const linksChanged =

            nextFiscalPeriodId !==
                (existing.fiscalPeriodId || null) ||

            nextFundId !==
                (existing.fundId || null);


        // --------------------------------------------------
        // Prevent Link Changes When Charges or Payments Exist
        // --------------------------------------------------

        if (linksChanged) {

            const usage =
                await this.getUsageCounts(
                    existing.propertyId,
                    token
                );

            if (
                usage.chargeCount > 0 ||
                usage.paymentCount > 0
            ) {

                throw new Error(
                    "Cannot change fiscal period or fund because charge or payment records exist"
                );

            }

        }


        // --------------------------------------------------
        // Add Link Changes to Update Data
        // --------------------------------------------------

        if (data.fiscalPeriodId !== undefined) {

            updateData.fiscalPeriodId =
                nextFiscalPeriodId;

        }

        if (data.fundId !== undefined) {

            updateData.fundId =
                nextFundId;

        }


        // --------------------------------------------------
        // Prevent Empty Update
        // --------------------------------------------------

        if (
            Object.keys(updateData).length === 0
        ) {

            throw new Error(
                "No fields provided for update"
            );

        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        try {

            return await propertyAccountRepository.update(
                accountId,
                updateData
            );

        } catch (error) {

            handlePrismaError(error);

        }

    }


    // ======================================================
    // Delete Property Account
    // ======================================================

    async delete(
        id,
        token
    ) {

        const accountId =
            normalizeRequiredString(
                id,
                "id"
            );


        // --------------------------------------------------
        // Find Existing Account
        // --------------------------------------------------

        const existing =
            await this.getById(accountId);


        // --------------------------------------------------
        // Check Main Backend Usage
        // --------------------------------------------------

        const usage =
            await this.getUsageCounts(
                existing.propertyId,
                token
            );


        // --------------------------------------------------
        // Prevent Delete When Operational Links Exist
        // --------------------------------------------------

        if (
            usage.unitAccountCount > 0 ||
            usage.chargeCount > 0 ||
            usage.paymentCount > 0
        ) {

            throw new Error(
                "Cannot delete property account because linked unit accounts or charge/payment records exist. Set status to INACTIVE instead."
            );

        }


        // --------------------------------------------------
        // Delete
        // --------------------------------------------------

        try {

            return await propertyAccountRepository.delete(
                accountId
            );

        } catch (error) {

            handlePrismaError(error);

        }

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new PropertyAccountService();
