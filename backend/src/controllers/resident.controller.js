const residentService = require("../services/resident.service");

const ResponseHelper = require("../helpers/response.helper");

const residentDTO = require("../dto/resident.dto");

// ======================================================
// Create Resident
// ======================================================

const createResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.createResident(
                req.body
            );

        ResponseHelper.created(
            res,
            "Resident created successfully",
            residentDTO(resident)
        );

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get All Residents
// ======================================================

const getResidents = async (req, res, next) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 20;

        const result =
            await residentService.getResidents(
                page,
                limit
            );

        ResponseHelper.success(
            res,
            "Residents fetched successfully",
            {
                total: result.total,

                page: result.page,

                limit: result.limit,

                pages: result.pages,

                data: result.data.map(residentDTO)
            }
        );

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Get Resident By ID
// ======================================================

const getResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.getResidentById(
                req.params.id
            );

        ResponseHelper.success(
            res,
            "Resident fetched successfully",
            residentDTO(resident)
        );

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Search Residents
// ======================================================

const searchResidents = async (req, res, next) => {

    try {

        const result =
            await residentService.searchResidents(
                req.query
            );

        ResponseHelper.success(
            res,
            "Residents searched successfully",
            {
                total: result.total,

                page: result.page,

                limit: result.limit,

                pages: result.pages,

                data: result.data.map(residentDTO)
            }
        );

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Update Resident
// ======================================================

const updateResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.updateResident(
                req.params.id,
                req.body
            );

        ResponseHelper.success(
            res,
            "Resident updated successfully",
            residentDTO(resident)
        );

    } catch (error) {

        next(error);

    }

};

// ======================================================
// Delete Resident
// ======================================================

const deleteResident = async (req, res, next) => {

    try {

        const result =
            await residentService.deleteResident(
                req.params.id
            );

        ResponseHelper.success(
            res,
            "Resident deleted successfully",
            result
        );

    } catch (error) {

        next(error);

    }

};

module.exports = {

    createResident,

    getResident,

    getResidents,

    searchResidents,

    updateResident,

    deleteResident

};