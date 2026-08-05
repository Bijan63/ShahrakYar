const prisma = require("../../prisma/client");


// Create Building
const createBuilding = async (data) => {

    return await prisma.building.create({
        data: {
            name: data.name,
            address: data.address,
            description: data.description,
            complexId: data.complexId
        },
        include: {
            complex: true
        }
    });

};


// Get All Buildings
const getBuildings = async () => {

    return await prisma.building.findMany({
        include: {
            complex: true
        },
        orderBy: {
            id: "asc"
        }
    });

};


// Get Building By Id
const getBuildingById = async (id) => {

    return await prisma.building.findUnique({
        where: {
            id: Number(id)
        },
        include: {
            complex: true,
            residents: true
        }
    });

};


// Update Building
const updateBuilding = async (id, data) => {

    return await prisma.building.update({
        where: {
            id: Number(id)
        },
        data: {
            name: data.name,
            address: data.address,
            description: data.description
        },
        include: {
            complex: true
        }
    });

};


// Delete Building
const deleteBuilding = async (id) => {

    return await prisma.building.delete({
        where: {
            id: Number(id)
        }
    });

};


module.exports = {
    createBuilding,
    getBuildings,
    getBuildingById,
    updateBuilding,
    deleteBuilding
};