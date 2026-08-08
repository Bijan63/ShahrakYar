class BaseRepository {


    constructor(model) {

        this.model = model;

    }



    async create(data) {

        return await this.model.create({

            data

        });

    }



    async findAll(options = {}) {

        return await this.model.findMany({

            ...options

        });

    }



    async findById(id, options = {}) {

        return await this.model.findUnique({

            where: {

                id: Number(id)

            },

            ...options

        });

    }



    async update(id, data) {

        return await this.model.update({

            where: {

                id: Number(id)

            },

            data

        });

    }



    async delete(id) {

        return await this.model.delete({

            where: {

                id: Number(id)

            }

        });

    }


}


module.exports = BaseRepository;