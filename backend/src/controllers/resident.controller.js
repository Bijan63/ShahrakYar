const residentService =
    require("../services/resident.service");

const ResponseHelper =
    require("../helpers/response.helper");


// ======================================================
// Create Resident
// ======================================================

const createResident = async (
    req,
    res,
    next
) => {

    try {

        const resident =
            await residentService.createResident(
                req.body,
                req.user
            );


        ResponseHelper.created(
            res,
            "Resident created successfully",
            resident
        );

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get All Residents
// ======================================================

const getResidents = async (
    req,
    res,
    next
) => {

    try {

        const page =
            Number(req.query.page) || 1;


        const limit =
            Number(req.query.limit) || 20;


        const result =
            await residentService.getResidents(
                page,
                limit,
                req.user
            );


        ResponseHelper.success(
            res,
            "Residents fetched successfully",
            result
        );

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Get Resident By ID
// ======================================================

const getResident = async (
    req,
    res,
    next
) => {

    try {

        const resident =
            await residentService.getResidentById(
                req.params.id,
                req.user
            );


        ResponseHelper.success(
            res,
            "Resident fetched successfully",
            resident
        );

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Search Residents
// ======================================================

const searchResidents = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await residentService.searchResidents(
                req.query,
                req.user
            );


        ResponseHelper.success(
            res,
            "Residents searched successfully",
            result
        );

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Update Resident
// ======================================================

const updateResident = async (
    req,
    res,
    next
) => {

    try {

        const resident =
            await residentService.updateResident(
                req.params.id,
                req.body,
                req.user
            );


        ResponseHelper.success(
            res,
            "Resident updated successfully",
            resident
        );

    } catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Resident
// ======================================================

const deleteResident = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await residentService.deleteResident(
                req.params.id,
                req.user
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


// ======================================================
// Export
// ======================================================

module.exports = {

    createResident,

    getResident,

    getResidents,

    searchResidents,

    updateResident,

    deleteResident

};