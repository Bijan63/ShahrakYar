const prisma = require("../config/prisma");

const BaseRepository =
    require("../core/BaseRepository");


class PersonRepository extends BaseRepository {

    constructor() {

        super(prisma.person);

    }


    // =========================
    // Get All Persons
    // =========================

    async getPersons() {

        return await this.findAll({

            orderBy: {

                id: "asc"

            }

        });

    }


    // =========================
    // Get Person By ID
    // =========================

    async getPersonById(id) {

        return await this.findById(id);

    }


    // =========================
    // Get Person By National ID
    // =========================

    async getPersonByNationalId(nationalId) {

        return await this.model.findUnique({

            where: {

                nationalId

            }

        });

    }


    // =========================
    // Create Person
    // =========================

    async createPerson(data) {

        return await this.create(data);

    }


    // =========================
    // Update Person
    // =========================

    async updatePerson(
        id,
        data
    ) {

        return await this.update(
            id,
            data
        );

    }


    // =========================
    // Delete Person
    // =========================

    async deletePerson(id) {

        return await this.delete(id);

    }


    // =========================
    // Get Properties Of One Person
    // =========================

    async getPersonProperties(id) {

        return await this.model.findUnique({

            where: {

                id

            },

            include: {

                ownerships: {

                    include: {

                        property: {

                            include: {

                                complex: true

                            }

                        }

                    }

                }

            }

        });

    }


    // =========================
    // Get Residencies Of One Person
    // =========================

    async getPersonResidencies(id) {

        return await this.model.findUnique({

            where: {

                id

            },

            include: {

                residencies: {

                    include: {

                        property: {

                            include: {

                                complex: true

                            }

                        }

                    }

                }

            }

        });

    }

}


module.exports = new PersonRepository();