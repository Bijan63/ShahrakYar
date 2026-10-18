const fiscalPeriodRepository =
require("../repositories/fiscalPeriod.repository");

class FiscalPeriodService {

// ======================================================
// Get All Fiscal Periods
// ======================================================

async getAll() {

    return await fiscalPeriodRepository.findAll();

}


// ======================================================
// Get Fiscal Period by ID
// ======================================================

async getById(id) {

    if (!id) {

        throw new Error(
            "Fiscal period id is required"
        );

    }


    const fiscalPeriod =
        await fiscalPeriodRepository.findById(id);


    if (!fiscalPeriod) {

        throw new Error(
            "Fiscal period not found"
        );

    }


    return fiscalPeriod;

}


// ======================================================
// Get Fiscal Period by Code
// ======================================================

async getByCode(code) {

    if (!code) {

        throw new Error(
            "code is required"
        );

    }


    const fiscalPeriod =
        await fiscalPeriodRepository.findByCode(code);


    if (!fiscalPeriod) {

        throw new Error(
            "Fiscal period not found"
        );

    }


    return fiscalPeriod;

}


// ======================================================
// Create Fiscal Period
// ======================================================

async create(data) {

    // --------------------------------------------------
    // Validate request body
    // --------------------------------------------------

    if (!data) {

        throw new Error(
            "Request body is required"
        );

    }


    // --------------------------------------------------
    // Validate code
    // --------------------------------------------------

    if (
        typeof data.code !== "string" ||
        !data.code.trim()
    ) {

        throw new Error(
            "code is required"
        );

    }


    const code =
        data.code.trim();


    // --------------------------------------------------
    // Validate name
    // --------------------------------------------------

    if (
        typeof data.name !== "string" ||
        !data.name.trim()
    ) {

        throw new Error(
            "name is required"
        );

    }


    const name =
        data.name.trim();


    // --------------------------------------------------
    // Validate startDate
    // --------------------------------------------------

    if (!data.startDate) {

        throw new Error(
            "startDate is required"
        );

    }


    // --------------------------------------------------
    // Validate endDate
    // --------------------------------------------------

    if (!data.endDate) {

        throw new Error(
            "endDate is required"
        );

    }


    const startDate =
        new Date(data.startDate);


    const endDate =
        new Date(data.endDate);


    // --------------------------------------------------
    // Validate date values
    // --------------------------------------------------

    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime())
    ) {

        throw new Error(
            "Invalid date"
        );

    }


    // --------------------------------------------------
    // Validate date range
    // --------------------------------------------------

    if (startDate >= endDate) {

        throw new Error(
            "startDate must be before endDate"
        );

    }


    // --------------------------------------------------
    // Validate status
    // --------------------------------------------------

    const status =
        data.status === undefined
            ? "ACTIVE"
            : data.status;


    this.validateStatus(status);


    // --------------------------------------------------
    // Prevent duplicate code
    // --------------------------------------------------

    const existing =
        await fiscalPeriodRepository.findByCode(
            code
        );


    if (existing) {

        throw new Error(
            "Fiscal period code already exists"
        );

    }


    // --------------------------------------------------
    // Only one ACTIVE fiscal period
    // --------------------------------------------------

    if (status === "ACTIVE") {

        const activePeriod =
            await fiscalPeriodRepository.findActive();


        if (activePeriod) {

            throw new Error(
                "Another active fiscal period already exists"
            );

        }

    }


    // --------------------------------------------------
    // Create
    // --------------------------------------------------

    return await fiscalPeriodRepository.create({

        code,

        name,

        startDate,

        endDate,

        status

    });

}


// ======================================================
// Update Fiscal Period
// ======================================================

async update(id, data) {

    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (!id) {

        throw new Error(
            "Fiscal period id is required"
        );

    }


    // --------------------------------------------------
    // Validate request body
    // --------------------------------------------------

    if (!data) {

        throw new Error(
            "Request body is required"
        );

    }


    // --------------------------------------------------
    // Get existing fiscal period
    // --------------------------------------------------

    const existing =
        await this.getById(id);


    // --------------------------------------------------
    // Determine final code
    // --------------------------------------------------

    let finalCode =
        existing.code;


    if (data.code !== undefined) {

        if (
            typeof data.code !== "string" ||
            !data.code.trim()
        ) {

            throw new Error(
                "code is required"
            );

        }


        finalCode =
            data.code.trim();

    }


    // --------------------------------------------------
    // Determine final name
    // --------------------------------------------------

    let finalName =
        existing.name;


    if (data.name !== undefined) {

        if (
            typeof data.name !== "string" ||
            !data.name.trim()
        ) {

            throw new Error(
                "name is required"
            );

        }


        finalName =
            data.name.trim();

    }


    // --------------------------------------------------
    // Determine final dates
    // --------------------------------------------------

    const finalStartDate =
        data.startDate !== undefined
            ? new Date(data.startDate)
            : new Date(existing.startDate);


    const finalEndDate =
        data.endDate !== undefined
            ? new Date(data.endDate)
            : new Date(existing.endDate);


    // --------------------------------------------------
    // Validate dates
    // --------------------------------------------------

    if (
        Number.isNaN(finalStartDate.getTime()) ||
        Number.isNaN(finalEndDate.getTime())
    ) {

        throw new Error(
            "Invalid date"
        );

    }


    // --------------------------------------------------
    // Validate date range
    // --------------------------------------------------

    if (finalStartDate >= finalEndDate) {

        throw new Error(
            "startDate must be before endDate"
        );

    }


    // --------------------------------------------------
    // Determine final status
    // --------------------------------------------------

    const finalStatus =
        data.status !== undefined
            ? data.status
            : existing.status;


    this.validateStatus(finalStatus);


    // --------------------------------------------------
    // Check date changes against journal history
    // --------------------------------------------------

    const datesChanged =
        finalStartDate.getTime() !==
            new Date(existing.startDate).getTime() ||
        finalEndDate.getTime() !==
            new Date(existing.endDate).getTime();


    if (datesChanged) {

        const usage =
            await fiscalPeriodRepository.getUsageCounts(
                id
            );


        if (usage.journalEntries > 0) {

            throw new Error(
                "Fiscal period dates cannot be changed because the fiscal period has journal entries"
            );

        }

    }


    // --------------------------------------------------
    // Prevent duplicate code
    // --------------------------------------------------

    if (finalCode !== existing.code) {

        const duplicate =
            await fiscalPeriodRepository.findByCode(
                finalCode
            );


        if (
            duplicate &&
            duplicate.id !== id
        ) {

            throw new Error(
                "Fiscal period code already exists"
            );

        }

    }


    // --------------------------------------------------
    // Only one ACTIVE fiscal period
    // --------------------------------------------------

    if (
        finalStatus === "ACTIVE" &&
        existing.status !== "ACTIVE"
    ) {

        const activePeriod =
            await fiscalPeriodRepository.findActive();


        if (
            activePeriod &&
            activePeriod.id !== id
        ) {

            throw new Error(
                "Another active fiscal period already exists"
            );

        }

    }


    // --------------------------------------------------
    // Build update data
    // --------------------------------------------------

    const updateData = {

        code:
            finalCode,

        name:
            finalName,

        startDate:
            finalStartDate,

        endDate:
            finalEndDate,

        status:
            finalStatus

    };


    // --------------------------------------------------
    // Update
    // --------------------------------------------------

    return await fiscalPeriodRepository.update(
        id,
        updateData
    );

}


// ======================================================
// Delete Fiscal Period
// ======================================================

async delete(id) {

    // --------------------------------------------------
    // Validate ID and existence
    // --------------------------------------------------

    const existing =
        await this.getById(id);


    // --------------------------------------------------
    // Check lifecycle dependencies
    // --------------------------------------------------

    const usage =
        await fiscalPeriodRepository.getUsageCounts(
            id
        );


    const hasDependencies =
        usage.accounts > 0 ||
        usage.financialAccounts > 0 ||
        usage.funds > 0 ||
        usage.journalEntries > 0 ||
        usage.openingBalances > 0 ||
        usage.propertyAccounts > 0;


    if (hasDependencies) {

        throw new Error(
            "Fiscal period cannot be deleted because it has financial dependencies"
        );

    }


    // --------------------------------------------------
    // Delete
    // --------------------------------------------------

    return await fiscalPeriodRepository.delete(
        existing.id
    );

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

}

// ======================================================
// Export
// ======================================================

module.exports =
new FiscalPeriodService();
