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

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                },

                residencies: {

                    where: {

                        endDate: null

                    },

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

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                },

                residencies: {

                    where: {

                        endDate: null

                    },

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

        const searchQuery =
            String(q || "").trim();


        if (!searchQuery) {

            return [];

        }


        const propertyTypes = [

            "LAND",
            "VILLA",
            "APARTMENT",
            "COMMERCIAL"

        ];


        const searchPropertyType =
            propertyTypes.includes(
                searchQuery.toUpperCase()
            )
                ? searchQuery.toUpperCase()
                : null;


        // ---------------------
        // Search person name
        // ---------------------

        const nameParts =
            searchQuery
                .split(/\s+/)
                .filter(Boolean);


        // ---------------------
        // Search
        // ---------------------

        return await this.model.findMany({

            where: {

                OR: [

                    // Property code
                    {

                        code: {

                            contains: searchQuery,

                            mode: "insensitive"

                        }

                    },


                    // Property description
                    {

                        description: {

                            contains: searchQuery,

                            mode: "insensitive"

                        }

                    },


                    // Property type
                    ...(searchPropertyType

                        ? [

                            {

                                propertyType: {

                                    equals: searchPropertyType

                                }

                            }

                        ]

                        : []),


                    // Complex name
                    {

                        complex: {

                            name: {

                                contains: searchQuery,

                                mode: "insensitive"

                            }

                        }

                    },


                    // Active ownership
                    {

                        ownerships: {

                            some: {

                                endDate: null,

                                person: {

                                    OR:

                                        nameParts.length > 1

                                            ? [

                                                {

                                                    AND: nameParts.map(
                                                        (part) => ({

                                                            OR: [

                                                                {

                                                                    firstName: {

                                                                        contains:
                                                                            part,

                                                                        mode:
                                                                            "insensitive"

                                                                    }

                                                                },

                                                                {

                                                                    lastName: {

                                                                        contains:
                                                                            part,

                                                                        mode:
                                                                            "insensitive"

                                                                    }

                                                                }

                                                            ]

                                                        })
                                                    )

                                                }

                                            ]

                                            : [

                                                {

                                                    firstName: {

                                                        contains:
                                                            searchQuery,

                                                        mode:
                                                            "insensitive"

                                                    }

                                                },

                                                {

                                                    lastName: {

                                                        contains:
                                                            searchQuery,

                                                        mode:
                                                            "insensitive"

                                                    }

                                                },

                                                {

                                                    mobile: {

                                                        contains:
                                                            searchQuery

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

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                },

                residencies: {

                    where: {

                        endDate: null

                    },

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

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                },

                residencies: {

                    where: {

                        endDate: null

                    },

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

                complex: true,

                ownerships: {

                    where: {

                        endDate: null

                    },

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

                complex: true,

                ownerships: {

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                },

                residencies: {

                    where: {

                        endDate: null

                    },

                    include: {

                        person: true

                    }

                }

            }

        });

    }

}


module.exports = new PropertyRepository();