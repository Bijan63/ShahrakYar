const residencyService = require("../services/residency.service");


// Create Residency
const createResidency = async (req, res, next) => {

    try {

        const residency = await residencyService.createResidency(
            req.body
        );

        res.status(201).json({
            success: true,
            residency
        });

    } catch (error) {

        next(error);

    }

};


// Get All Residencies
const getResidencies = async (req, res, next) => {

    try {

        const residencies = await residencyService.getResidencies();

        res.json({
            success: true,
            residencies
        });

    } catch (error) {

        next(error);

    }

};


// Get By ID
const getResidencyById = async (req, res, next) => {

    try {

        const residency = await residencyService.getResidencyById(
            req.params.id
        );

        res.json({
            success: true,
            residency
        });

    } catch (error) {

        next(error);

    }

};


// Update
const updateResidency = async (req, res, next) => {

    try {

        const residency = await residencyService.updateResidency(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            residency
        });

    } catch (error) {

        next(error);

    }

};


// Delete
const deleteResidency = async (req, res, next) => {

    try {

        await residencyService.deleteResidency(
            req.params.id
        );

        res.json({
            success: true,
            message: "Residency deleted successfully"
        });

    } catch (error) {

        next(error);

    }

};


module.exports = {

    createResidency,
    getResidencies,
    getResidencyById,
    updateResidency,
    deleteResidency

};