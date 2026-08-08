const ownershipService = require("../services/ownership.service");

const ResponseHelper = require("../helpers/response.helper");

const ownershipMapper = require("../mappers/ownership.mapper");


// Create Ownership
const createOwnership = async (req, res, next) => {

    try {

        const ownership =
            await ownershipService.createOwnership(
                req.body
            );


        ResponseHelper.created(
            res,
            "Ownership created successfully",
            ownershipMapper(ownership)
        );


    } catch (error) {

        next(error);

    }

};



// Get All Ownerships
const getOwnerships = async (req, res, next) => {

    try {

        const ownerships =
            await ownershipService.getOwnerships();


        ResponseHelper.success(
            res,
            "Ownerships fetched successfully",
            ownerships.map(ownershipMapper)
        );


    } catch (error) {

        next(error);

    }

};



// Get Ownership By ID
const getOwnershipById = async (req, res, next) => {

    try {

        const ownership =
            await ownershipService.getOwnershipById(
                req.params.id
            );


        ResponseHelper.success(
            res,
            "Ownership fetched successfully",
            ownershipMapper(ownership)
        );


    } catch (error) {

        next(error);

    }

};



// Update Ownership
const updateOwnership = async (req, res, next) => {

    try {

        const ownership =
            await ownershipService.updateOwnership(
                req.params.id,
                req.body
            );


        ResponseHelper.success(
            res,
            "Ownership updated successfully",
            ownershipMapper(ownership)
        );


    } catch (error) {

        next(error);

    }

};



// Delete Ownership
const deleteOwnership = async (req, res, next) => {

    try {

        await ownershipService.deleteOwnership(
            req.params.id
        );


        ResponseHelper.success(
            res,
            "Ownership deleted successfully"
        );


    } catch (error) {

        next(error);

    }

};



module.exports = {

    createOwnership,

    getOwnerships,

    getOwnershipById,

    updateOwnership,

    deleteOwnership

};