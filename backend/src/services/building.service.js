const buildingRepository = require("../repositories/building.repository");


// Create Building
const createBuilding = async (data) => {

    const building = await buildingRepository.createBuilding(data);

    return building;
};


// Get All Buildings
const getBuildings = async () => {

    const buildings = await buildingRepository.getBuildings();

    return buildings;
};


// Get Building By Id
const getBuildingById = async (id) => {

    const building = await buildingRepository.getBuildingById(id);

    return building;
};


// Update Building
const updateBuilding = async (id, data) => {

    const building = await buildingRepository.updateBuilding(
        id,
        data
    );

    return building;
};


// Delete Building
const deleteBuilding = async (id) => {

    const building = await buildingRepository.deleteBuilding(id);

    return building;
};


module.exports = {
    createBuilding,
    getBuildings,
    getBuildingById,
    updateBuilding,
    deleteBuilding
};