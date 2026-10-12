const complexManagerService =
    require("../services/complexManager.service");


// ==================================================
// Assign Manager
// ==================================================

const assignManager = async (
    req,
    res,
    next
) => {

    try {

        const {
            userId,
            complexId
        } = req.body;


        const assignment =
            await complexManagerService.assignManager(
                userId,
                complexId
            );


        return res.status(201).json({

            success: true,

            message:
                "Manager assigned to complex successfully.",

            assignment

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Get All Assignments
// ==================================================

const getAssignments = async (
    req,
    res,
    next
) => {

    try {

        const assignments =
            await complexManagerService
                .getAssignments();


        return res.json({

            success: true,

            assignments

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Get Assignment By ID
// ==================================================

const getAssignmentById = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        const assignment =
            await complexManagerService
                .getAssignmentById(id);


        return res.json({

            success: true,

            assignment

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Get Complexes Of Manager
// ==================================================

const getManagerComplexes = async (
    req,
    res,
    next
) => {

    try {

        const {
            userId
        } = req.params;


        const complexes =
            await complexManagerService
                .getManagerComplexes(
                    userId
                );


        return res.json({

            success: true,

            complexes

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Get Managers Of Complex
// ==================================================

const getComplexManagers = async (
    req,
    res,
    next
) => {

    try {

        const {
            complexId
        } = req.params;


        const managers =
            await complexManagerService
                .getComplexManagers(
                    complexId
                );


        return res.json({

            success: true,

            managers

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Remove Assignment
// ==================================================

const removeAssignment = async (
    req,
    res,
    next
) => {

    try {

        const {
            id
        } = req.params;


        const assignment =
            await complexManagerService
                .removeAssignment(
                    id
                );


        return res.json({

            success: true,

            message:
                "Manager removed from complex successfully.",

            assignment

        });

    } catch (err) {

        next(err);

    }

};


module.exports = {

    assignManager,

    getAssignments,

    getAssignmentById,

    getManagerComplexes,

    getComplexManagers,

    removeAssignment

};