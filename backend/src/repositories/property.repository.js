const prisma = require("../config/prisma");

const BaseRepository = require("../core/BaseRepository");

class PropertyRepository extends BaseRepository {

    constructor() {

        super(prisma.property);

    }


    // =====================
    // Create Property
    // =====================

    async createProperty(data) {

        return await this.create(data);

    }


    // =====================
    // Get All Properties
    // =====================

    async getProperties() {

        return await this.findAll({

            include: {

                complex: true,

                ownerships: {

                    include: {

                        person: true

                    }

                },

                residencies: {

                    include: {

                        person: true

                    }

                }

            },

            orderBy: {

                id: "asc"

            }

        });

    }


    // =====================
    // Get Property By ID
    // =====================

    async getPropertyById(id) {

        return await this.findById(id, {

            include: {

                complex: true,

                ownerships: {

                    include: {

                        person: true

                    }

                },

                residencies: {

                    include: {

                        person: true

                    }

                }

            }

        });

    }


    // =====================
    // Update Property
    // =====================

    async updateProperty(id, data) {

        return await this.update(
            id,
            data
        );

    }


    // =====================
    // Delete Property
    // =====================

    async deleteProperty(id) {

        return await this.delete(id);

    }


    // =====================
    // Search Properties
    // =====================

    async searchProperties(q) {

        const propertyTypes = [
            "LAND",
            "VILLA",
            "APARTMENT",
            "COMMERCIAL"
        ];


        const searchPropertyType =
            propertyTypes.includes(q.toUpperCase())
                ? q.toUpperCase()
                : null;


        return await this.model.findMany({

            where: {

                OR: [

                    {
                        code: {
                            contains: q,
                            mode: "insensitive"
                        }
                    },

                    {
                        description: {
                            contains: q,
                            mode: "insensitive"
                        }
                    },

                    ...(searchPropertyType
                        ? [
                            {
                                propertyType: {
                                    equals: searchPropertyType
                                }
                            }
                        ]
                        : []
                    ),

                    {
                        complex: {

                            name: {

                                contains: q,

                                mode: "insensitive"

                            }

                        }

                    },

                    {
                        ownerships: {

                            some: {

                                person: {

                                    OR: [

                                        {
                                            firstName: {

                                                contains: q,

                                                mode: "insensitive"

                                            }
                                        },

                                        {
                                            lastName: {

                                                contains: q,

                                                mode: "insensitive"

                                            }
                                        },

                                        {
                                            mobile: {

                                                contains: q

                                            }
                                        }

                                    ]

                                }

                            }

                        }

                    }

                ]

            },

            include: {

                complex: true,

                ownerships: {

                    include: {

                        person: true

                    }

                },

                residencies: {

                    include: {

                        person: true

                    }

                }

            }

        });

    }


    // =====================
    // Get Property Full Detail
    // =====================

    async getPropertyDetail(id) {

        return await this.model.findUnique({

            where: {

                id

            },

            include: {

                complex: true,

                ownerships: {

                    include: {

                        person: true

                    }

                },

                residencies: {

                    include: {

                        person: true

                    }

                }

            }

        });

    }


    // =====================
    // Get Owners Of One Property
    // =====================

    async getPropertyOwners(id) {

        return await this.model.findUnique({

            where: {

                id

            },

            include: {

                ownerships: {

                    include: {

                        person: true

                    }

                }

            }

        });

    }


    // =====================
    // Get Residents Of One Property
    // =====================

    async getPropertyResidents(id) {

        return await this.model.findUnique({

            where: {

                id

            },

            include: {

                residencies: {

                    include: {

                        person: true

                    }

                }

            }

        });

    }

}


module.exports = new PropertyRepository();