const residentService = require("../services/resident.service");

const ResponseHelper = require("../helpers/response.helper");

const residentDTO = require("../dto/resident.dto");


// Create Resident
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



// Get All Residents
const getResidents = async (req, res, next) => {

    try {

        const residents =
            await residentService.getResidents();


        ResponseHelper.success(
            res,
            "Residents fetched successfully",
            residents.map(residentDTO)
        );


    } catch (error) {

        next(error);

    }

};



// Get Resident By ID
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



// Search Residents
const searchResidents = async (req, res, next) => {

    try {

        const {
            search,
            page,
            limit
        } = req.query;


        const residents =
            await residentService.searchResidents(
                search,
                page,
                limit
            );


        ResponseHelper.success(
            res,
            "Residents searched successfully",
            residents.map(residentDTO)
        );


    } catch (error) {

        next(error);

    }

};



// Update Resident
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



// Delete Resident
const deleteResident = async (req, res, next) => {

    try {

        await residentService.deleteResident(
            req.params.id
        );


        ResponseHelper.success(
            res,
            "Resident deleted successfully"
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