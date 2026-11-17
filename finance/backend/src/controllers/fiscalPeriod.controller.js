const fiscalPeriodService = require("../services/fiscalPeriod.service");



// Error Status Mapper
// ======================================================

const getErrorStatus = (error) => {
    const message = error?.message || "";

    // --------------------------------------------------
    // 404 - Not Found
    // --------------------------------------------------

    if (message === "Fiscal period not found") {
        return 404;
    }

    // --------------------------------------------------
    // 409 - Conflict
    // --------------------------------------------------

    if (
        message === "Fiscal period code already exists" ||
        message === "Another active fiscal period already exists" ||
        message === "Fiscal period cannot be deleted because it has financial dependencies" ||
        message === "Fiscal period dates cannot be changed because the fiscal period has financial history"
    ) {
        return 409;
    }

    // --------------------------------------------------
    // 400 - Bad Request
    // --------------------------------------------------

    const badRequestMessages = [
        "Request body is required",
        "code is required",
        "name is required",
        "startDate is required",
        "endDate is required",
        "Invalid date",
        "Invalid Gregorian date",
        "Date-time values must include Z or an explicit UTC offset",
        "startDate must be before endDate",
        "Invalid status",
        "Fiscal period id is required",
        "Existing fiscal period contains invalid dates"
    ];

    if (badRequestMessages.includes(message)) {
        return 400;
    }

    if (
        message.startsWith("Invalid Jalali fiscal period code:") ||
        message.startsWith("startDate must match the start boundary of Jalali fiscal year") ||
        message.startsWith("endDate must match the end boundary of Jalali fiscal year")
    ) {
        return 400;
    }

    // --------------------------------------------------
    // 500 - Internal Server Error
    // --------------------------------------------------

    return 500;
};



// ======================================================
// Get All Fiscal Periods
// ======================================================

const getFiscalPeriods = async (req, res) => {

    try {

        const fiscalPeriods =
            await fiscalPeriodService.getAll();

        return res.status(200).json({
            success: true,
            data: fiscalPeriods
        });

    } catch (error) {

        console.error(
            "Get fiscal periods error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Get Fiscal Period By ID
// ======================================================

const getFiscalPeriodById = async (req, res) => {

    try {

        const { id } = req.params;

        const fiscalPeriod =
            await fiscalPeriodService.getById(id);

        return res.status(200).json({
            success: true,
            data: fiscalPeriod
        });

    } catch (error) {

        console.error(
            "Get fiscal period by id error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Get Fiscal Period By Code
// ======================================================

const getFiscalPeriodByCode = async (req, res) => {

    try {

        const { code } = req.params;

        const fiscalPeriod =
            await fiscalPeriodService.getByCode(code);

        return res.status(200).json({
            success: true,
            data: fiscalPeriod
        });

    } catch (error) {

        console.error(
            "Get fiscal period by code error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Create Fiscal Period
// ======================================================

const createFiscalPeriod = async (req, res) => {

    try {

        const fiscalPeriod =
            await fiscalPeriodService.create(
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Fiscal period created successfully",
            data: fiscalPeriod
        });

    } catch (error) {

        console.error(
            "Create fiscal period error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Update Fiscal Period
// ======================================================

const updateFiscalPeriod = async (req, res) => {

    try {

        const { id } = req.params;

        const fiscalPeriod =
            await fiscalPeriodService.update(
                id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Fiscal period updated successfully",
            data: fiscalPeriod
        });

    } catch (error) {

        console.error(
            "Update fiscal period error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Delete Fiscal Period
// ======================================================

const deleteFiscalPeriod = async (req, res) => {

    try {

        const { id } = req.params;

        await fiscalPeriodService.delete(id);

        return res.status(200).json({
            success: true,
            message: "Fiscal period deleted successfully"
        });

    } catch (error) {

        console.error(
            "Delete fiscal period error:",
            error
        );

        return res.status(
            getErrorStatus(error)
        ).json({
            success: false,
            message: error.message
        });
    }
};


// ======================================================
// Exports
// ======================================================

module.exports = {
    getFiscalPeriods,
    getFiscalPeriodById,
    getFiscalPeriodByCode,
    createFiscalPeriod,
    updateFiscalPeriod,
    deleteFiscalPeriod
};