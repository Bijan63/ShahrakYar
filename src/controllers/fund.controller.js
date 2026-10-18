const fundService =
    require("../services/fund.service");


// ======================================================
// Get All Funds
// ======================================================

const getFunds = async (req, res) => {

    try {

        const result =
            await fundService.getAll();

        return res.status(200).json({

            success: true,

            message:
                "Funds fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Funds Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch funds"

        });

    }

};


// ======================================================
// Get Fund by ID
// ======================================================

const getFundById = async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await fundService.getById(id);

        return res.status(200).json({

            success: true,

            message:
                "Fund fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Fund Error:",
            error
        );

        const status =
            error.message ===
            "Fund not found"
                ? 404
                : 500;

        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Get Fund by Code
// ======================================================

const getFundByCode = async (req, res) => {

    try {

        const { code } = req.params;

        const result =
            await fundService.getByCode(code);

        return res.status(200).json({

            success: true,

            message:
                "Fund fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Fund By Code Error:",
            error
        );

        const status =
            error.message ===
            "Fund not found"
                ? 404
                : 500;

        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Create Fund
// ======================================================

const createFund = async (req, res) => {

    try {

        const result =
            await fundService.create(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Fund created successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Create Fund Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
            "Request body is required" ||

            error.message ===
            "code is required" ||

            error.message ===
            "name is required" ||

            error.message ===
            "type is required" ||

            error.message ===
            "Invalid fund type"
        ) {

            status = 400;

        }


        if (
            error.message ===
            "Fund code already exists"
        ) {

            status = 409;

        }


        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Update Fund
// ======================================================

const updateFund = async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await fundService.update(
                id,
                req.body
            );

        return res.status(200).json({

            success: true,

            message:
                "Fund updated successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Update Fund Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
            "Fund not found"
        ) {

            status = 404;

        }


        if (
            error.message ===
            "Fund code already exists"
        ) {

            status = 409;

        }


        if (
            error.message ===
            "Invalid fund type" ||

            error.message ===
            "Invalid fund status"
        ) {

            status = 400;

        }


        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Delete Fund
// ======================================================

const deleteFund = async (req, res) => {

    try {

        const { id } = req.params;

        await fundService.delete(id);

        return res.status(200).json({

            success: true,

            message:
                "Fund deleted successfully"

        });

    } catch (error) {

        console.error(
            "Delete Fund Error:",
            error
        );

        const status =
            error.message ===
            "Fund not found"
                ? 404
                : 500;

        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    getFunds,
    getFundById,
    getFundByCode,
    createFund,
    updateFund,
    deleteFund

};