const chargeService =
    require("../services/charge.service");


class ChargeController {

    // ======================================================
    // Create Charge
    // ======================================================

    async createCharge(req, res, next) {

        try {

            const result =
                await chargeService.createCharge(
                    req.body,
                    req.user
                );

            return res.status(201).json({

                success: true,

                message:
                    "Charge created successfully",

                charge:
                    result.charge,

                journalEntry:
                    result.journalEntry

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Get Charges
    // ======================================================

    async getCharges(req, res, next) {

        try {

            const charges =
                await chargeService.getCharges(
                    req.user
                );

            return res.json({

                success: true,

                charges

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Get Charge By ID
    // ======================================================

    async getChargeById(req, res, next) {

        try {

            const charge =
                await chargeService.getChargeById(
                    req.params.id,
                    req.user
                );

            return res.json({

                success: true,

                charge

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Get Charges By Unit Account
    // ======================================================

    async getChargesByUnitAccount(
        req,
        res,
        next
    ) {

        try {

            const charges =
                await chargeService
                    .getChargesByUnitAccount(
                        req.params.unitAccountId,
                        req.user
                    );

            return res.json({

                success: true,

                charges

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Update Charge
    // ======================================================

    async updateCharge(req, res, next) {

        try {

            const charge =
                await chargeService.updateCharge(
                    req.params.id,
                    req.body,
                    req.user
                );

            return res.json({

                success: true,

                message:
                    "Charge updated successfully",

                charge

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Cancel Charge
    // ======================================================

    async cancelCharge(req, res, next) {

        try {

            const charge =
                await chargeService.cancelCharge(
                    req.params.id,
                    req.user
                );

            return res.json({

                success: true,

                message:
                    "Charge cancelled successfully",

                charge

            });

        } catch (error) {

            next(error);

        }

    }


    // ======================================================
    // Delete Charge
    // ======================================================

    async deleteCharge(req, res, next) {

        try {

            await chargeService.deleteCharge(
                req.params.id,
                req.user
            );

            return res.json({

                success: true,

                message:
                    "Charge deleted successfully"

            });

        } catch (error) {

            next(error);

        }

    }

}


module.exports =
    new ChargeController();