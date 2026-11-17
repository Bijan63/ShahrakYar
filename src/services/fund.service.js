"use strict";

const fundRepository =
    require("../repositories/fund.repository");


// ======================================================
// Constants
// ======================================================

const ALLOWED_TYPES = [

    "OPERATING",

    "CAPITAL"

];


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


const normalizeDescription = (value) => {

    if (
        value === undefined ||
        value === null
    ) {

        return null;

    }


    if (typeof value !== "string") {

        throw new Error(
            "description must be a string"
        );

    }


    return value.trim() || null;

};


const validateType = (type) => {

    if (!ALLOWED_TYPES.includes(type)) {

        throw new Error(
            "Invalid fund type"
        );

    }

};


const validateStatus = (status) => {

    if (!ALLOWED_STATUSES.includes(status)) {

        throw new Error(
            "Invalid fund status"
        );

    }

};


// ======================================================
// Fund Service
// ======================================================

class FundService {


    // ======================================================
    // Get All Funds
    // ======================================================

    async getAll() {

        return await fundRepository.findAll();

    }


    // ======================================================
    // Get Fund by ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "Fund ID is required"
            );

        }


        const fund =
            await fundRepository.findById(id);


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        return fund;

    }


    // ======================================================
    // Get Fund by Code
    // ======================================================

    async getByCode(code) {

        const normalizedCode =
            normalizeRequiredString(
                code,
                "code"
            );


        const fund =
            await fundRepository.findByCode(
                normalizedCode
            );


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        return fund;

    }


    // ======================================================
    // Validate Fiscal Period
    // ======================================================

    async validateFiscalPeriodId(id) {

        if (id === null) {

            return null;

        }


        if (
            typeof id !== "string" ||
            !id.trim()
        ) {

            throw new Error(
                "Invalid fiscal period ID"
            );

        }


        const fiscalPeriod =
            await fundRepository.findFiscalPeriodById(
                id.trim()
            );


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        return fiscalPeriod.id;

    }


    // ======================================================
    // Get Fund Usage Counts
    // ======================================================

    async getUsageCounts(id) {

        const result =
            await fundRepository.getUsageCounts(id);


        if (!result) {

            throw new Error(
                "Fund not found"
            );

        }


        return result._count;

    }


    // ======================================================
    // Create Fund
    // ======================================================

    async create(data) {

        validateObject(data);


        // --------------------------------------------------
        // Validate Code
        // --------------------------------------------------

        const code =
            normalizeRequiredString(
                data.code,
                "code"
            );


        // --------------------------------------------------
        // Validate Name
        // --------------------------------------------------

        const name =
            normalizeRequiredString(
                data.name,
                "name"
            );


        // --------------------------------------------------
        // Validate Type
        // --------------------------------------------------

        validateType(data.type);


        // --------------------------------------------------
        // Validate Status
        // --------------------------------------------------

        const status =
            data.status === undefined
                ? "ACTIVE"
                : data.status;


        validateStatus(status);


        // --------------------------------------------------
        // Validate Description
        // --------------------------------------------------

        const description =
            normalizeDescription(
                data.description
            );


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        const fiscalPeriodId =
            data.fiscalPeriodId === undefined ||
            data.fiscalPeriodId === null
                ? null
                : await this.validateFiscalPeriodId(
                    data.fiscalPeriodId
                );


        // --------------------------------------------------
        // Prevent Duplicate Code
        // --------------------------------------------------

        const existing =
            await fundRepository.findByCode(
                code
            );


        if (existing) {

            throw new Error(
                "Fund code already exists"
            );

        }


        // --------------------------------------------------
        // Create Fund
        // --------------------------------------------------

        try {

            return await fundRepository.create({

                code,

                name,

                type: data.type,

                description,

                status,

                fiscalPeriodId

            });

        } catch (error) {

            // Handle concurrent duplicate insertion

            if (error.code === "P2002") {

                throw new Error(
                    "Fund code already exists"
                );

            }

            throw error;

        }

    }


    // ======================================================
    // Update Fund
    // ======================================================

    async update(id, data) {

        validateObject(data);


        // --------------------------------------------------
        // Find Existing Fund
        // --------------------------------------------------

        const currentFund =
            await this.getById(id);


        const updateData = {};


        // --------------------------------------------------
        // Code
        // --------------------------------------------------

        if (data.code !== undefined) {

            const code =
                normalizeRequiredString(
                    data.code,
                    "code"
                );


            const duplicate =
                await fundRepository.findByCode(
                    code
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Fund code already exists"
                );

            }


            updateData.code = code;

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
        // Type
        // --------------------------------------------------

        if (data.type !== undefined) {

            validateType(data.type);


            updateData.type =
                data.type;

        }


        // --------------------------------------------------
        // Description
        // --------------------------------------------------

        if (data.description !== undefined) {

            updateData.description =
                normalizeDescription(
                    data.description
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
        // Fiscal Period
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined
        ) {

            const newFiscalPeriodId =
                await this.validateFiscalPeriodId(
                    data.fiscalPeriodId
                );


            const currentFiscalPeriodId =
                currentFund.fiscalPeriodId || null;


            // --------------------------------------------------
            // Prevent Period Change When Fund Has Dependencies
            // --------------------------------------------------

            if (
                newFiscalPeriodId !==
                currentFiscalPeriodId
            ) {

                const usage =
                    await this.getUsageCounts(id);


                const hasDependencies =

                    usage.propertyAccounts > 0 ||

                    usage.financialAccounts > 0 ||

                    usage.journalEntries > 0;


                if (hasDependencies) {

                    throw new Error(
                        "Cannot change fund fiscal period while linked records exist"
                    );

                }

            }


            updateData.fiscalPeriodId =
                newFiscalPeriodId;

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
        // Update Fund
        // --------------------------------------------------

        try {

            return await fundRepository.update(
                id,
                updateData
            );

        } catch (error) {

            if (error.code === "P2002") {

                throw new Error(
                    "Fund code already exists"
                );

            }

            throw error;

        }

    }


    // ======================================================
    // Delete Fund
    // ======================================================

    async delete(id) {

        await this.getById(id);


        // --------------------------------------------------
        // Check Dependencies
        // --------------------------------------------------

        const usage =
            await this.getUsageCounts(id);


        const hasDependencies =

            usage.propertyAccounts > 0 ||

            usage.financialAccounts > 0 ||

            usage.journalEntries > 0;


        if (hasDependencies) {

            throw new Error(
                "Cannot delete fund because linked financial records exist"
            );

        }


        // --------------------------------------------------
        // Delete Fund
        // --------------------------------------------------

        try {

            return await fundRepository.delete(
                id
            );

        } catch (error) {

            // Database-level protection

            if (error.code === "P2003") {

                throw new Error(
                    "Cannot delete fund because linked records exist"
                );

            }

            throw error;

        }

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FundService();