const financialIntegrityService =
    require("../services/financialIntegrity.service");


// ======================================================
// Financial Integrity Controller
// ======================================================


// ======================================================
// Validate Financial Integrity
// ======================================================

const validateFinancialIntegrity =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                fiscalPeriodId
            } = req.params;


            const result =
                await financialIntegrityService
                    .validate(
                        fiscalPeriodId
                    );


            return res.status(200).json({

                success: true,

                message:
                    result.isValid
                        ? "Financial integrity validation passed"
                        : "Financial integrity validation failed",

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

    validateFinancialIntegrity

};