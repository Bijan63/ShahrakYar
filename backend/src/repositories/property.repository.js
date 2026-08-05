const prisma = require("../config/prisma");


// Create Property
const createProperty = async (data) => {
    return await prisma.property.create({
        data,
        include: {
            complex: true
        }
    });
};


// Get All Properties
const getProperties = async () => {
    return await prisma.property.findMany({
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
};


// Get Property By ID
const getPropertyById = async (id) => {

    return await prisma.property.findUnique({
        where: {
            id: Number(id)
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

};


// Update Property
const updateProperty = async (id, data) => {

    return await prisma.property.update({
        where:{
            id:Number(id)
        },
        data
    });

};


// Delete Property
const deleteProperty = async (id) => {

    return await prisma.property.delete({
        where:{
            id:Number(id)
        }
    });

};
// Search Properties
const searchProperties = async (q) => {

    return await prisma.property.findMany({

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

                {
                    propertyType: {
                        equals: q.toUpperCase()
                    }
                },

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

};

module.exports = {

    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    searchProperties

};