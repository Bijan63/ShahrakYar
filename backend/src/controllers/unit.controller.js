const unitService =
    require("../services/unit.service");

const {
    unitMapper
} = require("../mappers/unit.mapper");


// ======================================================
// Create Unit
// ======================================================

const createUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.createUnit(
                req.body,
                req.user
            );

        return res.status(201).json({

            success: true,

            unit:
                unitMapper(unit)

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Units
// ======================================================

const getUnits = async (
    req,
    res,
    next
) => {

    try {

        const units =
            await unitService.getUnits(
                req.user
            );

        return res.status(200).json({

            success: true,

            units:
                units.map(unitMapper)

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Unit By ID
// ======================================================

const getUnitById = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.getUnitById(
                req.params.id,
                req.user
            );

        return res.status(200).json({

            success: true,

            unit:
                unitMapper(unit)

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Update Unit
// ======================================================

const updateUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.updateUnit(
                req.params.id,
                req.body,
                req.user
            );

        return res.status(200).json({

            success: true,

            unit:
                unitMapper(unit)

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Unit
// ======================================================

const deleteUnit = async (
    req,
    res,
    next
) => {

    try {

        const unit =
            await unitService.deleteUnit(
                req.params.id,
                req.user
            );

        return res.status(200).json({

            success: true,

            message:
                "Unit deleted successfully",

            unit:
                unitMapper(unit)

        });

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createUnit,

    getUnits,

    getUnitById,

    updateUnit,

    deleteUnit

};