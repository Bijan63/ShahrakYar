const prisma = require("../config/prisma");

// ایجاد ساختمان
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

// نمایش همه ساختمان‌ها
const getBuildings = async (req, res) => {

    const buildings = await prisma.building.findMany({
        orderBy: {
            id: "asc"
        }
    });

    res.json({
        success: true,
        buildings
    });

};

const getBuildingById = async (req, res) => {

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

module.exports = {
    createBuilding,
    getBuildings,
    getBuildingById
};
