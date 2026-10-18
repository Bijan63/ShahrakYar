const accountService =
    require("../services/account.service");


// ======================================================
// Get All Accounts
// ======================================================

const getAccounts = async (req, res) => {

    try {

        const result =
            await accountService.getAll();

        return res.status(200).json({

            success: true,

            message:
                "Accounts fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Accounts Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch accounts"

        });

    }

};


// ======================================================
// Get Account by ID
// ======================================================

const getAccountById = async (req, res) => {

    try {

        const { id } =
            req.params;


        const result =
            await accountService.getById(id);


        return res.status(200).json({

            success: true,

            message:
                "Account fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Account Error:",
            error
        );


        let status = 500;


        if (
            error.message ===
            "Account not found"
        ) {

            status = 404;

        }


        else if (
            error.message ===
            "id is required"
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
// Get Account by Code
// ======================================================

const getAccountByCode = async (req, res) => {

    try {

        const { code } =
            req.params;


        const result =
            await accountService.getByCode(code);


        return res.status(200).json({

            success: true,

            message:
                "Account fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Account By Code Error:",
            error
        );


        let status = 500;


        if (
            error.message ===
            "Account not found"
        ) {

            status = 404;

        }


        else if (
            error.message ===
            "code is required"
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
// Get Active Account by Code
// ======================================================

const getActiveAccountByCode =
    async (req, res) => {

        try {

            const { code } =
                req.params;


            const result =
                await accountService
                    .getActiveByCode(code);


            return res.status(200).json({

                success: true,

                message:
                    "Active account fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Get Active Account By Code Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                "Active account not found"
            ) {

                status = 404;

            }


            else if (
                error.message ===
                "code is required"
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
// Get Accounts by Parent ID
// ======================================================

const getAccountsByParentId =
    async (req, res) => {

        try {

            const { parentId } =
                req.params;


            const result =
                await accountService
                    .getByParentId(parentId);


            return res.status(200).json({

                success: true,

                message:
                    "Child accounts fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Get Accounts By Parent ID Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                "parentId is required"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                "Parent account not found"
            ) {

                status = 404;

            }


            return res.status(status).json({

                success: false,

                message: error.message

            });

        }

    };


// ======================================================
// Get Root Accounts
// ======================================================

const getRootAccounts =
    async (req, res) => {

        try {

            const result =
                await accountService
                    .getRootAccounts();


            return res.status(200).json({

                success: true,

                message:
                    "Root accounts fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Get Root Accounts Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to fetch root accounts"

            });

        }

    };


// ======================================================
// Create Account
// ======================================================

const createAccount =
    async (req, res) => {

        try {

            const result =
                await accountService.create(
                    req.body
                );


            return res.status(201).json({

                success: true,

                message:
                    "Account created successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Create Account Error:",
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
                    "Invalid account type" ||

                error.message ===
                    "Invalid cash flow classification" ||

                error.message ===
                    "isActive must be a boolean" ||

                error.message ===
                    "Parent account is inactive" ||

                error.message ===
                    "Parent account type must match account type"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                    "Parent account not found" ||

                error.message ===
                    "Fiscal period not found"
            ) {

                status = 404;

            }


            else if (
                error.message ===
                    "Account code already exists"
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
// Update Account
// ======================================================

const updateAccount =
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const result =
                await accountService.update(
                    id,
                    req.body
                );


            return res.status(200).json({

                success: true,

                message:
                    "Account updated successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Update Account Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                    "Account not found"
            ) {

                status = 404;

            }


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
                    "Invalid account type" ||

                error.message ===
                    "Invalid cash flow classification" ||

                error.message ===
                    "isActive must be a boolean" ||

                error.message ===
                    "Account cannot be its own parent"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                    "Account code already exists"
            ) {

                status = 409;

            }


            else if (
                error.message ===
                    "Parent account not found"
            ) {

                status = 404;

            }


            else if (
                error.message ===
                    "Circular account hierarchy detected"
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
// Delete Account
// ======================================================

const deleteAccount =
    async (req, res) => {

        try {

            const { id } =
                req.params;


            await accountService.delete(id);


            return res.status(200).json({

                success: true,

                message:
                    "Account deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete Account Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                    "Account not found"
            ) {

                status = 404;

            }


            else if (
                error.message ===
                    "id is required"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                    "Cannot delete account with child accounts"
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
// Export
// ======================================================

module.exports = {

    getAccounts,

    getAccountById,

    getAccountByCode,

    getActiveAccountByCode,

    getAccountsByParentId,

    getRootAccounts,

    createAccount,

    updateAccount,

    deleteAccount

};