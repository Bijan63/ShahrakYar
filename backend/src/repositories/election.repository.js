const prisma = require("../config/prisma");

class ElectionRepository {

    async create(data) {

        return prisma.election.create({

            data

        });

    }

    async findAll() {

        return prisma.election.findMany({

            orderBy: {

                createdAt: "desc"

            }

        });

    }

    async findById(id) {

        return prisma.election.findUnique({

            where: {

                id

            }

        });

    }

    async findByIdWithCandidates(id) {

        return prisma.election.findUnique({

            where: {

                id

            },

            include: {

                candidates: {

                    include: {

                        votes: true

                    }

                }

            }

        });

    }

    async update(id, data) {

        return prisma.election.update({

            where: {

                id

            },

            data

        });

    }

    async delete(id) {

        return prisma.election.delete({

            where: {

                id

            }

        });

    }

}

module.exports = new ElectionRepository();