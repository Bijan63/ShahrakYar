const ownershipService = require("../services/ownership.service");


// Create Ownership
const createOwnership = async (req, res, next) => {

    try {

        const ownership =
            await ownershipService.createOwnership(req.body);


        res.status(201).json({
            success: true,
            ownership
        });


    } catch (error) {

        next(error);

    }

};


// Get All Ownerships
const getOwnerships = async (req, res, next) => {

    try {

        const ownerships =
            await ownershipService.getOwnerships();


        res.json({
            success: true,
            ownerships
        });


    } catch (error) {

        next(error);

    }

};



module.exports = {

    createOwnership,

    getOwnerships

};