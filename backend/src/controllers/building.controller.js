const buildingService =
    require("../services/building.service");

const {
    buildingMapper
} = require("../mappers/building.mapper");


// =========================
// Create Building
// =========================

const createBuilding = async (
    req,
    res,
    next
) => {

    try {

        const building =
            await buildingService.createBuilding(
                req.body,
                req.user
            );


        return res.status(201).json({

            success: true,

            building:
                buildingMapper(building)

        });

    } catch (err) {

        next(err);

    }

};


// =========================
// Get All Buildings
// =========================

const getBuildings = async (
    req,
    res,
    next
) => {

    try {

        const buildings =
            await buildingService.getBuildings(
                req.user
            );


        return res.status(200).json({

            success: true,

            buildings:
                buildings.map(
                    buildingMapper
                )

        });

    } catch (err) {

        next(err);

    }

};


// =========================
// Get Building By ID
// =========================

const getBuilding = async (
    req,
    res,
    next
) => {

    try {

        const building =
            await buildingService.getBuildingById(
                req.params.id,
                req.user
            );


        return res.status(200).json({

            success: true,

            building:
                buildingMapper(building)

        });

    } catch (err) {

        next(err);

    }

};


// =========================
// Update Building
// =========================

const updateBuilding = async (
    req,
    res,
    next
) => {

    try {

        const building =
            await buildingService.updateBuilding(
                req.params.id,
                req.body,
                req.user
            );


        return res.status(200).json({

            success: true,

            building:
                buildingMapper(building)

        });

    } catch (err) {

        next(err);

    }

};


// =========================
// Delete Building
// =========================

const deleteBuilding = async (
    req,
    res,
    next
) => {

    try {

        const building =
            await buildingService.deleteBuilding(
                req.params.id,
                req.user
            );


        return res.status(200).json({

            success: true,

            message:
                "Building deleted successfully",

            building:
                buildingMapper(building)

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