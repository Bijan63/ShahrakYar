const prisma = require("../config/prisma");

const BaseRepository = require("../core/BaseRepository");


class PersonRepository extends BaseRepository {


    constructor() {

        super(prisma.person);

    }



    async getPersons() {

        return await this.findAll({

            orderBy: {

                id: "asc"

            }

        });

    }



    async getPersonById(id) {

        return await this.findById(id);

    }



    async createPerson(data) {

        return await this.create(data);

    }



    async updatePerson(id, data) {

        return await this.update(id, data);

    }



    async deletePerson(id) {

        return await this.delete(id);

    }

// Get Properties Of One Person
async getPersonProperties(id) {

    return await this.model.findUnique({

        where: {
            id: Number(id)
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

}



module.exports = new PersonRepository();