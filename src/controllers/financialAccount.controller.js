const financialAccountService =
    require("../services/financialAccount.service");


// ======================================================
// Get All Financial Accounts
// ======================================================

const getFinancialAccounts = async (req, res) => {

    try {

        const result =
            await financialAccountService.getAll();

        return res.status(200).json({

            success: true,

            message:
                "Financial accounts fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Financial Accounts Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch financial accounts"

        });

    }

};


// ======================================================
// Get Financial Account by ID
// ======================================================

const getFinancialAccountById = async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await financialAccountService.getById(id);

        return res.status(200).json({

            success: true,

            message:
                "Financial account fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Financial Account Error:",
            error
        );

        const status =
            error.message ===
                "Financial account not found"
                ? 404
                : error.message ===
                    "id is required"
                    ? 400
                    : 500;

        return res.status(status).json({

            success: false,

            message: error.message

        });

    }

};


// ======================================================
// Get Financial Account by Code
// ======================================================

const getFinancialAccountByCode =
    async (req, res) => {

        try {

            const { code } = req.params;

            const result =
                await financialAccountService.getByCode(
                    code
                );

            return res.status(200).json({

                success: true,

                message:
                    "Financial account fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Get Financial Account By Code Error:",
                error
            );

            const status =
                error.message ===
                    "Financial account not found"
                    ? 404
                    : error.message ===
                        "code is required"
                        ? 400
                        : 500;

            return res.status(status).json({

                success: false,

                message: error.message

            });

        }

    };


// ======================================================
// Create Financial Account
// ======================================================

const createFinancialAccount =
    async (req, res) => {

        try {

            const result =
                await financialAccountService.create(
                    req.body
                );

            return res.status(201).json({

                success: true,

                message:
                    "Financial account created successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Create Financial Account Error:",
                error
            );

            let status = 500;


            // --------------------------------------------------
            // Bad Request
            // --------------------------------------------------

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
                    "Invalid financial account type" ||

                error.message ===
                    "Invalid status" ||

                error.message ===
                    "bankName is required for BANK account" ||

                error.message ===
                    "cardNumber is required for POS account"

            ) {

                status = 400;

            }


            // --------------------------------------------------
            // Conflict
            // --------------------------------------------------

            else if (

                error.message ===
                "Financial account code already exists"

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
// Update Financial Account
// ======================================================

const updateFinancialAccount =
    async (req, res) => {

        try {

            const { id } = req.params;

            const result =
                await financialAccountService.update(
                    id,
                    req.body
                );

            return res.status(200).json({

                success: true,

                message:
                    "Financial account updated successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Update Financial Account Error:",
                error
            );

            let status = 500;


            // --------------------------------------------------
            // Not Found
            // --------------------------------------------------

            if (

                error.message ===
                "Financial account not found"

            ) {

                status = 404;

            }


            // --------------------------------------------------
            // Bad Request
            // --------------------------------------------------

            else if (

                error.message ===
                    "id is required" ||

                error.message ===
                    "Request body is required" ||

                error.message ===
                    "code is required" ||

                error.message ===
                    "name is required" ||

                error.message ===
                    "Invalid financial account type" ||

                error.message ===
                    "Invalid status" ||

                error.message ===
                    "bankName is required for BANK account" ||

                error.message ===
                    "cardNumber is required for POS account"

            ) {

                status = 400;

            }


            // --------------------------------------------------
            // Conflict
            // --------------------------------------------------

            else if (

                error.message ===
                "Financial account code already exists"

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
// Delete Financial Account
// ======================================================

const deleteFinancialAccount =
    async (req, res) => {

        try {

            const { id } = req.params;

            await financialAccountService.delete(
                id
            );

            return res.status(200).json({

                success: true,

                message:
                    "Financial account deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete Financial Account Error:",
                error
            );

            const status =
                error.message ===
                    "Financial account not found"
                    ? 404
                    : error.message ===
                        "id is required"
                        ? 400
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

    getFinancialAccounts,

    getFinancialAccountById,

    getFinancialAccountByCode,

    createFinancialAccount,

    updateFinancialAccount,

    deleteFinancialAccount

};