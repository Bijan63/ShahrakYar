const buildingService = require("../services/building.service");


// Create Building
const createBuilding = async (req, res, next) => {

    try {

        const building = await buildingService.createBuilding(
            req.body
        );

        return res.status(201).json({
            success: true,
            building
        });

    } catch (err) {

        next(err);

    }

};


// Get All Buildings
const getBuildings = async (req, res, next) => {

    try {

        const buildings = await buildingService.getBuildings();

        return res.status(200).json({
            success: true,
            buildings
        });

    } catch (err) {

        next(err);

    }

};


// Get Building By Id
const getBuilding = async (req, res, next) => {

    try {

        const building = await buildingService.getBuildingById(
            req.params.id
        );

        if (!building) {
            return res.status(404).json({
                success: false,
                message: "Building not found"
            });
        }


        return res.status(200).json({
            success: true,
            building
        });


    } catch (err) {

        next(err);

    }

};


// Update Building
const updateBuilding = async (req, res, next) => {

    try {

        const building = await buildingService.updateBuilding(
            req.params.id,
            req.body
        );

        return res.status(200).json({
            success: true,
            building
        });


    } catch (err) {

        next(err);

    }

};


// Delete Building
const deleteBuilding = async (req, res, next) => {

    try {

        const building = await buildingService.deleteBuilding(
            req.params.id
        );

        return res.status(200).json({
            success: true,
            message: "Building deleted successfully",
            building
        });


    } catch (err) {

        next(err);

    }

};


module.exports = {
    createBuilding,
    getBuildings,
    getBuilding,
    updateBuilding,
    deleteBuilding
};