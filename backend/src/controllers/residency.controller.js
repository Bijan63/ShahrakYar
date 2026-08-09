const residencyService = require("../services/residency.service");

const ResponseHelper = require("../helpers/response.helper");

// =====================
// Create Residency
// =====================

const createResidency = async (req, res, next) => {

    try {

        const residency =
            await residencyService.createResidency(
                req.body
            );

        ResponseHelper.created(
            res,
            "Residency created successfully",
            residency
        );

    } catch (error) {

        next(error);

    }

};

// =====================
// Get All Residencies
// =====================

const getResidencies = async (req, res, next) => {

    try {

        const residencies =
            await residencyService.getResidencies();

        ResponseHelper.success(
            res,
            "Residencies fetched successfully",
            residencies
        );

    } catch (error) {

        next(error);

    }

};

// =====================
// Get Residency By ID
// =====================

const getResidencyById = async (req, res, next) => {

    try {

        const residency =
            await residencyService.getResidencyById(
                req.params.id
            );

        ResponseHelper.success(
            res,
            "Residency fetched successfully",
            residency
        );

    } catch (error) {

        next(error);

    }

};

// =====================
// Update Residency
// =====================

const updateResidency = async (req, res, next) => {

    try {

        const residency =
            await residencyService.updateResidency(
                req.params.id,
                req.body
            );

        ResponseHelper.success(
            res,
            "Residency updated successfully",
            residency
        );

    } catch (error) {

        next(error);

    }

};

// =====================
// Delete Residency
// =====================

const deleteResidency = async (req, res, next) => {

    try {

        await residencyService.deleteResidency(
            req.params.id
        );

        ResponseHelper.success(
            res,
            "Residency deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};

// =====================
// Get Residents By Property
// =====================

const getResidentsByProperty = async (req, res, next) => {

    try {

        const residents =
            await residencyService.getResidentsByProperty(
                req.params.propertyId
            );

        ResponseHelper.success(
            res,
            "Property residents fetched successfully",
            residents
        );

    } catch (error) {

        next(error);

    }

};

module.exports = {

    createResidency,

    getResidencies,

    getResidencyById,

    updateResidency,

    deleteResidency,

    getResidentsByProperty

};