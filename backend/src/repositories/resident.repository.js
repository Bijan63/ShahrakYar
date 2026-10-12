const prisma = require("../config/prisma");

class ResidentRepository {

    // ======================================================
    // Common Include
    // ======================================================

    getInclude() {

        return {

            user: true,

            person: true,

            unit: {

                include: {

                    building: true,

                    property: true

                }

            }

        };

    }


    // ======================================================
    // Create Resident
    // ======================================================

    async create(data) {

        return await prisma.resident.create({

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Get Resident By ID
    // ======================================================

    async findById(id) {

        return await prisma.resident.findUnique({

            where: {
                id
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Get Resident By User ID
    // ======================================================

    async findByUserId(userId) {

        return await prisma.resident.findUnique({

            where: {
                userId
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Get Resident By Mobile
    // ======================================================

    async findByMobile(mobile) {

        return await prisma.resident.findFirst({

            where: {
                mobile
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Get Resident By Person ID
    // ======================================================

    async findByPersonId(personId) {

        return await prisma.resident.findUnique({

            where: {
                personId
            },

            include: this.getInclude()

        });

    }


    // ======================================================
    // Get All Residents
    // ======================================================

    async findAll(
        skip = 0,
        take = 20
    ) {

        return await prisma.resident.findMany({

            skip,
            take,

            include: this.getInclude(),

            orderBy: {
                fullName: "asc"
            }

        });

    }


    // ======================================================
    // Count All Residents
    // ======================================================

    async count() {

        return await prisma.resident.count();

    }


    // ======================================================
    // Get Residents By Complex IDs
    // ======================================================

    async findByComplexIds(
        complexIds,
        skip = 0,
        take = 20
    ) {

        return await prisma.resident.findMany({

            skip,
            take,

            where: {

                unit: {

                    OR: [

                        {
                            building: {

                                complexId: {
                                    in: complexIds
                                }

                            }

                        },

                        {
                            property: {

                                complexId: {
                                    in: complexIds
                                }

                            }

                        }

                    ]

                }

            },

            include: this.getInclude(),

            orderBy: {
                fullName: "asc"
            }

        });

    }


    // ======================================================
    // Count Residents By Complex IDs
    // ======================================================

    async countByComplexIds(
        complexIds
    ) {

        return await prisma.resident.count({

            where: {

                unit: {

                    OR: [

                        {
                            building: {

                                complexId: {
                                    in: complexIds
                                }

                            }

                        },

                        {
                            property: {

                                complexId: {
                                    in: complexIds
                                }

                            }

                        }

                    ]

                }

            }

        });

    }


    // ======================================================
    // Search Residents
    // ======================================================

    async search({
        skip,
        take,
        where,
        orderBy
    }) {

        return await prisma.resident.findMany({

            skip,
            take,

            where,

            include: this.getInclude(),

            orderBy

        });

    }


    // ======================================================
    // Count Search Results
    // ======================================================

    async countSearch(where) {

        return await prisma.resident.count({
            where
        });

    }


    // ======================================================
    // Search Residents By Complex IDs
    // ======================================================

    async searchByComplexIds({
        complexIds,
        skip,
        take,
        where = {},
        orderBy
    }) {

        return await prisma.resident.findMany({

            skip,
            take,

            where: {

                AND: [

                    where,

                    {

                        unit: {

                            OR: [

                                {
                                    building: {

                                        complexId: {
                                            in: complexIds
                                        }

                                    }

                                },

                                {
                                    property: {

                                        complexId: {
                                            in: complexIds
                                        }

                                    }

                                }

                            ]

                        }

                    }

                ]

            },

            include: this.getInclude(),

            orderBy

        });

    }


    // ======================================================
    // Count Search Results By Complex IDs
    // ======================================================

    async countSearchByComplexIds(
        where,
        complexIds
    ) {

        return await prisma.resident.count({

            where: {

                AND: [

                    where,

                    {

                        unit: {

                            OR: [

                                {
                                    building: {

                                        complexId: {
                                            in: complexIds
                                        }

                                    }

                                },

                                {
                                    property: {

                                        complexId: {
                                            in: complexIds
                                        }

                                    }

                                }

                            ]

                        }

                    }

                ]

            }

        });

    }


    // ======================================================
    // Check Resident Exists
    // ======================================================

    async exists(id) {

        const resident =
            await prisma.resident.findUnique({

                where: {
                    id
                },

                select: {
                    id: true
                }

            });

        return !!resident;

    }


    // ======================================================
    // Update Resident
    // ======================================================

    async update(
        id,
        data
    ) {

        return await prisma.resident.update({

            where: {
                id
            },

            data,

            include: this.getInclude()

        });

    }


    // ======================================================
    // Delete Resident
    // ======================================================

    async delete(id) {

        return await prisma.resident.delete({

            where: {
                id
            }

        });

    }

}


module.exports =
    new ResidentRepository();