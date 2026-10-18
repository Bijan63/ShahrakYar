const accountLedgerService =
    require("../services/accountLedger.service");


// ======================================================
// Get Account Ledger
// ======================================================

const getAccountLedger = async (
    req,
    res,
    next
) => {

    try {

        const {
            accountId
        } = req.params;


        const {
            fiscalPeriodId
        } = req.query;


        const result =
            await accountLedgerService.getLedger(
                accountId,
                fiscalPeriodId || null
            );


        return res.status(200).json({

            success: true,

            message:
                "Account ledger fetched successfully",

            data:
                result

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    getAccountLedger

};