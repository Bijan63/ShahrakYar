const ownershipService =
    require("../services/ownership.service");

const ResponseHelper =
    require("../helpers/response.helper");

const ownershipMapper =
    require("../mappers/ownership.mapper");


// =====================================================
// Create Ownership
// =====================================================

const createOwnership = async (
    req,
    res,
    next
) => {

    try {

        const ownership =
            await ownershipService.createOwnership(
                req.body,
                req.user
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


// =====================================================
// Get All Ownerships
// =====================================================

const getOwnerships = async (
    req,
    res,
    next
) => {

    try {

        const ownerships =
            await ownershipService.getOwnerships(
                req.user
            );


        ResponseHelper.success(
            res,
            "Ownerships fetched successfully",
            ownerships.map(ownershipMapper)
        );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// Get Ownership By ID
// =====================================================

const getOwnershipById = async (
    req,
    res,
    next
) => {

    try {

        const ownership =
            await ownershipService.getOwnershipById(
                req.params.id,
                req.user
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


// =====================================================
// Update Ownership
// =====================================================

const updateOwnership = async (
    req,
    res,
    next
) => {

    try {

        const ownership =
            await ownershipService.updateOwnership(
                req.params.id,
                req.body,
                req.user
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


// =====================================================
// Delete Ownership
// =====================================================

const deleteOwnership = async (
    req,
    res,
    next
) => {

    try {

        await ownershipService.deleteOwnership(
            req.params.id,
            req.user
        );


        ResponseHelper.success(
            res,
            "Ownership deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// Get Ownership History
// =====================================================

const getOwnershipHistory = async (
    req,
    res,
    next
) => {

    try {

        const {
            from,
            to
        } = req.query;


        const ownerships =
            await ownershipService.getOwnershipHistory(
                from,
                to,
                req.user
            );


        ResponseHelper.success(
            res,
            "Ownership history fetched successfully",
            ownerships.map(ownershipMapper)
        );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// Get Ownership Changes
// =====================================================

const getOwnershipChanges = async (
    req,
    res,
    next
) => {

    try {

        const {
            from,
            to
        } = req.query;


        const ownershipChanges =
            await ownershipService.getOwnershipChanges(
                from,
                to,
                req.user
            );


        ResponseHelper.success(
            res,
            "Ownership changes fetched successfully",
            ownershipChanges
        );

    } catch (error) {

        next(error);

    }

};


// =====================================================
// Module Exports
// =====================================================

module.exports = {

    createOwnership,

    getOwnerships,

    getOwnershipById,

    updateOwnership,

    deleteOwnership,

    getOwnershipHistory,

    getOwnershipChanges

};