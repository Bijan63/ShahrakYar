const unitAccountService =
    require("../services/unitAccount.service");


// ======================================================
// Create Unit Account
// ======================================================

const createUnitAccount = async (
    req,
    res,
    next
) => {

    try {

        const account =
            await unitAccountService.createUnitAccount(
                req.body,
                req.user
            );


        return res.status(201).json({

            success: true,

            message:
                "Unit account created successfully",

            unitAccount:
                account

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Unit Accounts
// ======================================================

const getUnitAccounts = async (
    req,
    res,
    next
) => {

    try {

        const accounts =
            await unitAccountService.getUnitAccounts(
                req.user
            );


        return res.status(200).json({

            success: true,

            unitAccounts:
                accounts

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Unit Account By ID
// ======================================================

const getUnitAccountById = async (
    req,
    res,
    next
) => {

    try {

        const account =
            await unitAccountService.getUnitAccountById(
                req.params.id,
                req.user
            );


        return res.status(200).json({

            success: true,

            unitAccount:
                account

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Unit Account By Unit ID
// ======================================================

const getUnitAccountByUnitId = async (
    req,
    res,
    next
) => {

    try {

        const account =
            await unitAccountService.getUnitAccountByUnitId(
                req.params.unitId,
                req.user
            );


        return res.status(200).json({

            success: true,

            unitAccount:
                account

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Update Unit Account
// ======================================================

const updateUnitAccount = async (
    req,
    res,
    next
) => {

    try {

        const account =
            await unitAccountService.updateUnitAccount(
                req.params.id,
                req.body,
                req.user
            );


        return res.status(200).json({

            success: true,

            message:
                "Unit account updated successfully",

            unitAccount:
                account

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Unit Account
// ======================================================

const deleteUnitAccount = async (
    req,
    res,
    next
) => {

    try {

        const account =
            await unitAccountService.deleteUnitAccount(
                req.params.id,
                req.user
            );


        return res.status(200).json({

            success: true,

            message:
                "Unit account deleted successfully",

            unitAccount:
                account

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createUnitAccount,

    getUnitAccounts,

    getUnitAccountById,

    getUnitAccountByUnitId,

    updateUnitAccount,

    deleteUnitAccount

};