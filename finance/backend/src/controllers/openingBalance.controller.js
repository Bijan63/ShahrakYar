const openingBalanceService =
require("../services/openingBalance.service");

// ======================================================
// Get All Opening Balances
// ======================================================

const getOpeningBalances = async (req, res) => {

try {

    const result =
        await openingBalanceService.getAll();

    return res.status(200).json({

        success: true,

        message:
            "Opening balances fetched successfully",

        data: result

    });

} catch (error) {

    console.error(
        "Get Opening Balances Error:",
        error
    );

    return res.status(500).json({

        success: false,

        message:
            error.message ||
            "Failed to fetch opening balances"

    });

}

};

// ======================================================
// Get Opening Balance by ID
// ======================================================

const getOpeningBalanceById =
async (req, res) => {

    try {

        const { id } =
            req.params;

        const result =
            await openingBalanceService.getById(
                id
            );

        return res.status(200).json({

            success: true,

            message:
                "Opening balance fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Opening Balance Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
            "Opening balance not found"
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
// Get Opening Balances by Fiscal Period
// ======================================================

const getOpeningBalancesByFiscalPeriod =
async (req, res) => {

    try {

        const { fiscalPeriodId } =
            req.params;

        const result =
            await openingBalanceService
                .getByFiscalPeriod(
                    fiscalPeriodId
                );

        return res.status(200).json({

            success: true,

            message:
                "Opening balances fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Opening Balances By Fiscal Period Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
            "fiscalPeriodId is required"
        ) {

            status = 400;

        }


        else if (
            error.message ===
            "Fiscal period not found"
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
// Get Opening Balances by Account
// ======================================================

const getOpeningBalancesByAccount =
async (req, res) => {

    try {

        const { accountId } =
            req.params;

        const result =
            await openingBalanceService
                .getByAccount(
                    accountId
                );

        return res.status(200).json({

            success: true,

            message:
                "Opening balances fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Opening Balances By Account Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
            "accountId is required"
        ) {

            status = 400;

        }


        else if (
            error.message ===
            "Account not found"
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
// Get Opening Balance by Fiscal Period + Account
// ======================================================

const getOpeningBalanceByFiscalPeriodAndAccount =
async (req, res) => {

    try {

        const {
            fiscalPeriodId,
            accountId
        } = req.params;


        const result =
            await openingBalanceService
                .getByFiscalPeriodAndAccount(
                    fiscalPeriodId,
                    accountId
                );


        return res.status(200).json({

            success: true,

            message:
                "Opening balance fetched successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Get Opening Balance By Fiscal Period And Account Error:",
            error
        );

        let status = 500;


        if (

            error.message ===
                "fiscalPeriodId is required" ||

            error.message ===
                "accountId is required"

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Fiscal period not found" ||

            error.message ===
                "Account not found" ||

            error.message ===
                "Opening balance not found"

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
// Validate Opening Balances Balance
// ======================================================

const validateOpeningBalances =
async (req, res) => {

    try {

        const { fiscalPeriodId } =
            req.params;


        const result =
            await openingBalanceService
                .validateBalance(
                    fiscalPeriodId
                );


        return res.status(200).json({

            success: true,

            message:
                result.isBalanced
                    ? "Opening balances are balanced"
                    : "Opening balances are not balanced",

            data: result

        });

    } catch (error) {

        console.error(
            "Validate Opening Balances Error:",
            error
        );


        let status = 500;


        if (
            error.message ===
            "fiscalPeriodId is required"
        ) {

            status = 400;

        }


        else if (
            error.message ===
            "Fiscal period not found"
        ) {

            status = 404;

        }


        return res.status(status).json({

            success: false,

            message:
                error.message

        });

    }

};

// ======================================================
// Create Opening Balance
// ======================================================

const createOpeningBalance =
async (req, res) => {

    try {

        const result =
            await openingBalanceService.create(
                req.body
            );


        return res.status(201).json({

            success: true,

            message:
                "Opening balance created successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Create Opening Balance Error:",
            error
        );

        let status = 500;


        if (

            error.message ===
                "Request body is required" ||

            error.message ===
                "fiscalPeriodId is required" ||

            error.message ===
                "accountId is required" ||

            error.message ===
                "Debit and credit must be valid numbers" ||

            error.message ===
                "Debit and credit cannot be negative" ||

            error.message ===
                "Opening balance cannot have both debit and credit" ||

            error.message ===
                "Opening balance must have debit or credit amount" ||

            error.message ===
                "Invalid opening balance status"

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Fiscal period not found" ||

            error.message ===
                "Account not found"

        ) {

            status = 404;

        }


        else if (

            error.message.startsWith(
                "Fiscal period is not active:"
            ) ||

            error.message.startsWith(
                "Account is inactive:"
            ) ||

            error.message.startsWith(
                "Account "
            ) &&
            error.message.includes(
                "does not belong to the selected fiscal period"
            ) ||

            error.message.startsWith(
                "Opening balance can only be created for a leaf account:"
            )

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Opening balance already exists for this account and fiscal period"

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
// Update Opening Balance
// ======================================================

const updateOpeningBalance =
async (req, res) => {

    try {

        const { id } =
            req.params;


        const result =
            await openingBalanceService.update(
                id,
                req.body
            );


        return res.status(200).json({

            success: true,

            message:
                "Opening balance updated successfully",

            data: result

        });

    } catch (error) {

        console.error(
            "Update Opening Balance Error:",
            error
        );

        let status = 500;


        if (

            error.message ===
                "id is required" ||

            error.message ===
                "Request body is required" ||

            error.message ===
                "fiscalPeriodId is required" ||

            error.message ===
                "accountId is required" ||

            error.message ===
                "Debit and credit must be valid numbers" ||

            error.message ===
                "Debit and credit cannot be negative" ||

            error.message ===
                "Opening balance cannot have both debit and credit" ||

            error.message ===
                "Opening balance must have debit or credit amount" ||

            error.message ===
                "Invalid opening balance status"

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Opening balance not found" ||

            error.message ===
                "Fiscal period not found" ||

            error.message ===
                "Account not found"

        ) {

            status = 404;

        }


        else if (

            error.message.startsWith(
                "Fiscal period is not active:"
            ) ||

            error.message.startsWith(
                "Account is inactive:"
            ) ||

            error.message.startsWith(
                "Account "
            ) &&
            error.message.includes(
                "does not belong to the selected fiscal period"
            ) ||

            error.message.startsWith(
                "Opening balance can only be created for a leaf account:"
            )

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Opening balance already exists for this account and fiscal period"

        ) {

            status = 409;

        }


        else if (

            error.message ===
                "Fiscal period cannot be changed because the opening balance has financial history" ||

            error.message ===
                "Account cannot be changed because the opening balance has financial history" ||

            error.message ===
                "Debit and credit cannot be changed because the opening balance has financial history"

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
// Delete Opening Balance
// ======================================================

const deleteOpeningBalance =
async (req, res) => {

    try {

        const { id } =
            req.params;


        await openingBalanceService.delete(
            id
        );


        return res.status(200).json({

            success: true,

            message:
                "Opening balance deleted successfully"

        });

    } catch (error) {

        console.error(
            "Delete Opening Balance Error:",
            error
        );

        let status = 500;


        if (
            error.message ===
                "Opening balance not found"
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

            error.message.startsWith(
                "Fiscal period is not active:"
            )

        ) {

            status = 400;

        }


        else if (

            error.message ===
                "Opening balance cannot be deleted because the fiscal period has financial history"

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

getOpeningBalances,

getOpeningBalanceById,

getOpeningBalancesByFiscalPeriod,

getOpeningBalancesByAccount,

getOpeningBalanceByFiscalPeriodAndAccount,

validateOpeningBalances,

createOpeningBalance,

updateOpeningBalance,

deleteOpeningBalance

};