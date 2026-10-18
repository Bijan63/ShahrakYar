// ======================================================
// Financial Report Controller
// ======================================================

const financialReportService =
    require("../services/financialReport.service");


// ======================================================
// Trial Balance
// ======================================================

const getTrialBalance = async (
    req,
    res,
    next
) => {

    try {

        const {
            fiscalPeriodId
        } = req.query;


        const result =
            await financialReportService
                .getTrialBalance(
                    fiscalPeriodId
                );


        return res.status(200).json({

            success: true,

            message:
                "Trial balance fetched successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// General Ledger
// ======================================================

const getGeneralLedger = async (
    req,
    res,
    next
) => {

    try {

        const {
            fiscalPeriodId,
            accountId
        } = req.query;


        const result =
            await financialReportService
                .getGeneralLedger(
                    fiscalPeriodId,
                    accountId
                );


        return res.status(200).json({

            success: true,

            message:
                "General ledger fetched successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Balance Sheet
// ======================================================

const getBalanceSheet = async (
    req,
    res,
    next
) => {

    try {

        const {
            fiscalPeriodId
        } = req.params;


        const result =
            await financialReportService
                .getBalanceSheet(
                    fiscalPeriodId
                );


        return res.status(200).json({

            success: true,

            message:
                "Balance sheet fetched successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Income Statement
// ======================================================

const getIncomeStatement = async (
    req,
    res,
    next
) => {

    try {

        const {
            fiscalPeriodId
        } = req.params;


        const result =
            await financialReportService
                .getIncomeStatement(
                    fiscalPeriodId
                );


        return res.status(200).json({

            success: true,

            message:
                "Income statement fetched successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Cash Flow Statement
// ======================================================

const getCashFlowStatement = async (
    req,
    res,
    next
) => {

    try {

        const {
            fiscalPeriodId
        } = req.params;


        const result =
            await financialReportService
                .getCashFlowStatement(
                    fiscalPeriodId
                );


        return res.status(200).json({

            success: true,

            message:
                "Cash flow statement fetched successfully",

            data: result

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    getTrialBalance,

    getGeneralLedger,

    getBalanceSheet,

    getIncomeStatement,

    getCashFlowStatement

};