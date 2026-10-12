const prisma = require("../config/prisma");


// ======================================================
// Create Building
// ======================================================

const createBuilding = async (data) => {

    return await prisma.building.create({

        data: {

            name: data.name,

            address: data.address,

            description: data.description,

            complexId: data.complexId

        },

        include: {

            complex: true,

            units: {

                include: {

                    property: true,

                    residents: true

                }

            }

        }

    });

};


// ======================================================
// Get All Buildings
// ======================================================

const getBuildings = async () => {

    return await prisma.building.findMany({

        include: {

            complex: true,

            units: {

                include: {

                    property: true,

                    residents: true

                }

            }

        },

        orderBy: {

            id: "asc"

        }

    });

};


// ======================================================
// Get Building By ID
// ======================================================

const getBuildingById = async (id) => {

    return await prisma.building.findUnique({

        where: {

            id

        },

        include: {

            complex: true,

            units: {

                include: {

                    property: true,

                    residents: true

                }

            }

        }

    });

};


// ======================================================
// Update Building
// ======================================================

const updateBuilding = async (id, data) => {

    return await prisma.building.update({

        where: {

            id

        },

        data: {

            name: data.name,

            address: data.address,

            description: data.description

        },

        include: {

            complex: true,

            units: {

                include: {

                    property: true,

                    residents: true

                }

            }

        }

    });

};


// ======================================================
// Delete Building
// ======================================================

const deleteBuilding = async (id) => {

    return await prisma.building.delete({

        where: {

            id

        }

    });

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createBuilding,

    getBuildings,

    getBuildingById,

    updateBuilding,

    deleteBuilding

};