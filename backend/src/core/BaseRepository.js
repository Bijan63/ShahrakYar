class BaseRepository {

    constructor(model) {

        this.model = model;

    }


    // Create
    async create(data) {

        return await this.model.create({

            data

        });

    }


    // Find All
    async findAll(options = {}) {

        return await this.model.findMany({

            ...options

        });

    }


    // Find By ID
    async findById(id, options = {}) {

        return await this.model.findUnique({

            where: {

                id

            },

            ...options

        });

    }


    // Update
    async update(id, data) {

        return await this.model.update({

            where: {

                id

            },

            data

        });

    }


    // Delete
    async delete(id) {

        return await this.model.delete({

            where: {

                id

            }

        });

    }

}


module.exports = BaseRepository;