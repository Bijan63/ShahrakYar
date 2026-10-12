const chargePaymentService =
    require("../services/chargePayment.service");


// ======================================================
// Create Payment
// ======================================================

const createPayment = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await chargePaymentService.createPayment(
                req.body,
                req.user
            );

        return res.status(201).json({

            success: true,

            message:
                "Charge payment created successfully",

            payment:
                result.payment,

            journalEntry:
                result.journalEntry,

            charge:
                result.charge

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Payments
// ======================================================

const getPayments = async (
    req,
    res,
    next
) => {

    try {

        const payments =
            await chargePaymentService.getPayments(
                req.query,
                req.user
            );

        return res.status(200).json({

            success: true,

            payments

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Payment By ID
// ======================================================

const getPaymentById = async (
    req,
    res,
    next
) => {

    try {

        const payment =
            await chargePaymentService.getPaymentById(
                req.params.id,
                req.user
            );

        return res.status(200).json({

            success: true,

            payment

        });

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get Payments By Charge
// ======================================================

const getPaymentsByCharge = async (
    req,
    res,
    next
) => {

    try {

        const payments =
            await chargePaymentService.getPaymentsByCharge(
                req.params.chargeId,
                req.user
            );

        return res.status(200).json({

            success: true,

            payments

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Payments By Unit Account
// ======================================================

const getPaymentsByUnitAccount = async (
    req,
    res,
    next
) => {

    try {

        const payments =
            await chargePaymentService.getPaymentsByUnitAccount(
                req.params.unitAccountId,
                req.user
            );

        return res.status(200).json({

            success: true,

            payments

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createPayment,

    getPayments,

    getPaymentById,

    getPaymentsByCharge,

    getPaymentsByUnitAccount

};