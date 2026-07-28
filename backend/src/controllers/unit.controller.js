const prisma = require("../config/prisma");

// ایجاد واحد
const createUnit = async (req, res) => {

    try {

        const {
            unitNumber,
            floor,
            area,
            buildingId
        } = req.body;

        const building = await prisma.building.findUnique({
            where: {
                id: buildingId
            }
        });

        if (!building) {
            return res.status(404).json({
                success: false,
                message: "Building not found."
            });
        }

        const unit = await prisma.unit.create({
            data: {
                unitNumber,
                floor,
                area,
                buildingId
            }
        });

        return res.status(201).json({
            success: true,
            unit
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

// دریافت یک واحد به همراه ساختمان و ساکنان
const getUnitById = async (req, res) => {

    try {

        const id = parseInt(req.params.id);

        const unit = await prisma.unit.findUnique({
            where: {
                id
            },
            include: {
                building: true,
                residents: true
            }
        });

        if (!unit) {
            return res.status(404).json({
                success: false,
                message: "Unit not found."
            });
        }

        return res.json({
            success: true,
            unit
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
    createUnit,
    getUnitById
};