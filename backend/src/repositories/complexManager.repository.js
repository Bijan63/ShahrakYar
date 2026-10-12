const prisma = require("../config/prisma");

class ComplexManagerRepository {

    // =========================
    // Create Assignment
    // =========================

    async create(data) {

        return prisma.complexManager.create({

            data,

            include: {

                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        personId: true
                    }
                },

                complex: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        description: true
                    }
                }

            }

        });

    }


    // =========================
    // Get All Assignments
    // =========================

    async findAll() {

        return prisma.complexManager.findMany({

            orderBy: {
                createdAt: "desc"
            },

            include: {

                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        personId: true
                    }
                },

                complex: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        description: true
                    }
                }

            }

        });

    }


    // =========================
    // Get Assignment By ID
    // =========================

    async findById(id) {

        return prisma.complexManager.findUnique({

            where: {
                id
            },

            include: {

                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        personId: true
                    }
                },

                complex: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        description: true
                    }
                }

            }

        });

    }


    // =========================
    // Find Assignment
    // By User + Complex
    // =========================

    async findByUserAndComplex(
        userId,
        complexId
    ) {

        return prisma.complexManager.findUnique({

            where: {

                userId_complexId: {
                    userId,
                    complexId
                }

            }

        });

    }


    // =========================
    // Get Complexes Of User
    // =========================

    async findByUserId(userId) {

        return prisma.complexManager.findMany({

            where: {
                userId
            },

            orderBy: {
                createdAt: "asc"
            },

            include: {

                complex: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        description: true
                    }
                }

            }

        });

    }


    // =========================
    // Get Managers Of Complex
    // =========================

    async findByComplexId(complexId) {

        return prisma.complexManager.findMany({

            where: {
                complexId
            },

            orderBy: {
                createdAt: "asc"
            },

            include: {

                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        personId: true
                    }
                }

            }

        });

    }


    // =========================
    // Delete Assignment
    // =========================

    async delete(id) {

        return prisma.complexManager.delete({

            where: {
                id
            },

            include: {

                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        status: true,
                        personId: true
                    }
                },

                complex: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        description: true
                    }
                }

            }

        });

    }

}


module.exports = new ComplexManagerRepository();