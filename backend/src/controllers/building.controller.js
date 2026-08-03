const prisma = require("../config/prisma");

// Create Building
const createBuilding = async (req, res) => {
    try {
        const { name, address, floors, totalUnits } = req.body;

        const building = await prisma.building.create({
            data: {
                name,
                address,
                floors,
                totalUnits
            }
        });

        return res.status(201).json({
            success: true,
            building
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get All Buildings
const getBuildings = async (req, res) => {
    const buildings = await prisma.building.findMany({
        orderBy: {
            id: "asc"
        }
    });

    return res.json({
        success: true,
        buildings
    });
};

// Get Building By Id
const getBuilding = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const building = await prisma.building.findUnique({
            where: {
                id
            },

            include: {
                units: true
            }
        });

        if (!building) {
            return res.status(404).json({
                success: false,
                message: "Building not found."
            });
        }

        return res.json({
            success: true,
            building
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Update Building
const updateBuilding = async (req, res) => {
    try {
        const id = Number(req.params.id);

        const building = await prisma.building.update({
            where: {
                id
            },

            data: req.body
        });

        return res.json({
            success: true,
            building
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Delete Building
const deleteBuilding = async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.building.delete({
            where: {
                id
            }
        });

        return res.json({
            success: true,
            message: "Building deleted successfully."
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    createBuilding,
    getBuildings,
    getBuilding,
    updateBuilding,
    deleteBuilding
};
