const prisma =
    require("../config/prisma");

const BaseRepository =
    require("../core/BaseRepository");


class OwnershipRepository extends BaseRepository {


    constructor() {

        super(prisma.ownership);

    }


    // =====================================================
    // Access Scope Helper
    // =====================================================

    buildComplexScope(
        complexIds
    ) {

        if (
            !Array.isArray(complexIds)
        ) {

            return {};

        }


        return {

            property: {

                complexId: {

                    in: complexIds

                }

            }

        };

    }


    // =====================================================
    // Create Ownership
    // =====================================================

    async createOwnership(data) {

        return await this.model.create({

            data,

            include: {

                property: true,

                person: true

            }

        });

    }


    // =====================================================
    // Get All Ownerships
    // =====================================================

    async getOwnerships(
        complexIds = null
    ) {

        return await this.findAll({

            where:
                this.buildComplexScope(
                    complexIds
                ),

            include: {

                property: true,

                person: true

            },

            orderBy: {

                id: "asc"

            }

        });

    }


    // =====================================================
    // Get Ownership By ID
    // =====================================================

    async getOwnershipById(
        id,
        complexIds = null
    ) {

        return await this.model.findFirst({

            where: {

                id,

                ...this.buildComplexScope(
                    complexIds
                )

            },

            include: {

                property: true,

                person: true

            }

        });

    }


    // =====================================================
    // Update Ownership
    // =====================================================

    async updateOwnership(
        id,
        data
    ) {

        return await this.model.update({

            where: {

                id

            },

            data,

            include: {

                property: true,

                person: true

            }

        });

    }


    // =====================================================
    // Delete Ownership
    // =====================================================

    async deleteOwnership(id) {

        return await this.delete(id);

    }


    // =====================================================
    // Get Ownership History
    // =====================================================

    async getOwnershipHistory(
        from,
        to,
        complexIds = null
    ) {

        return await this.model.findMany({

            where: {

                AND: [

                    // Ownership started before or during period
                    {

                        startDate: {

                            lte: to

                        }

                    },

                    // Ownership has not ended before period
                    {

                        OR: [

                            {

                                endDate: null

                            },

                            {

                                endDate: {

                                    gte: from

                                }

                            }

                        ]

                    },

                    this.buildComplexScope(
                        complexIds
                    )

                ]

            },

            include: {

                property: true,

                person: true

            },

            orderBy: [

                {

                    startDate: "asc"

                },

                {

                    createdAt: "asc"

                }

            ]

        });

    }


    // =====================================================
    // Get Ownership Changes
    // =====================================================

    async getOwnershipChanges(
        from,
        to,
        complexIds = null
    ) {

        return await this.model.findMany({

            where: {

                AND: [

                    {

                        OR: [

                            // Ownership started during period
                            {

                                startDate: {

                                    gte: from,

                                    lte: to

                                }

                            },

                            // Ownership ended during period
                            {

                                endDate: {

                                    gte: from,

                                    lte: to

                                }

                            }

                        ]

                    },

                    this.buildComplexScope(
                        complexIds
                    )

                ]

            },

            include: {

                property: true,

                person: true

            },

            orderBy: [

                {

                    propertyId: "asc"

                },

                {

                    startDate: "asc"

                },

                {

                    createdAt: "asc"

                }

            ]

        });

    }

}


module.exports =
    new OwnershipRepository();