const prisma = require("../config/prisma");

// =====================
// ایجاد واحد
// =====================

const createUnit = async (req, res) => {

    try {

        const {
            unitNumber,
            floor,
            area,
            code,
            buildingId,
            propertyId
        } = req.body;


        // بررسی Property در صورت ارسال
        if (propertyId) {

            const property =
                await prisma.property.findUnique({

                    where: {
                        id: propertyId
                    }

                });


            if (!property) {

                return res.status(404).json({

                    success: false,

                    message: "Property not found."

                });

            }

        }


        // بررسی Building در صورت ارسال
        if (buildingId) {

            const building =
                await prisma.building.findUnique({

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

        }


        const unit =
            await prisma.unit.create({

                data: {

                    unitNumber,

                    floor,

                    area,

                    code,

                    buildingId,

                    propertyId

                },

                include: {

                    building: true,

                    property: true

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


// =====================
// دریافت لیست همه واحدها
// =====================

const getUnits = async (req, res) => {

    try {

        const units =
            await prisma.unit.findMany({

                include: {

                    building: true,

                    property: true,

                    residents: true

                },

                orderBy: {

                    id: "asc"

                }

            });


        return res.json({

            success: true,

            units

        });


    } catch (error) {

        console.error(error);


        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};


// =====================
// دریافت یک واحد
// =====================

const getUnitById = async (req, res) => {

    try {

        const id =
            req.params.id;


        const unit =
            await prisma.unit.findUnique({

                where: {

                    id

                },

                include: {

                    building: true,

                    property: true,

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

    getUnits,

    getUnitById

};