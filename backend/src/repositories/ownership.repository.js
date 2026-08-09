const prisma = require("../config/prisma");

const BaseRepository = require("../core/BaseRepository");


class OwnershipRepository extends BaseRepository {

    constructor() {

        super(prisma.ownership);

    }


    // Create Ownership
    async createOwnership(data) {

    return await this.model.create({

        data,

        include: {

            property: true,

            person: true

        }

    });

}


    // Get All Ownerships
    async getOwnerships() {

        return await this.findAll({

            include: {

                property: true,

                person: true

            },

            orderBy: {

                id: "asc"

            }

        });

    }


    // Get Ownership By ID
    async getOwnershipById(id) {

        return await this.findById(id, {

            include: {

                property: true,

                person: true

            }

        });

    }


    // Update Ownership
    async updateOwnership(id, data) {

        return await this.update(
            id,
            data
        );

    }


    // Delete Ownership
    async deleteOwnership(id) {

        return await this.delete(id);

    }

}


module.exports = new OwnershipRepository();