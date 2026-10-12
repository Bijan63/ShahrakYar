const prisma = require("../config/prisma");

const BaseRepository = require("../core/BaseRepository");

class PropertyAddressRepository extends BaseRepository {

    constructor() {

        super(prisma.propertyAddress);

    }


    // =====================
    // Create Property Address
    // =====================

    async createPropertyAddress(data) {

        return await this.create(data);

    }


    // =====================
    // Get All Property Addresses
    // =====================

    async getPropertyAddresses() {

        return await this.findAll({

            include: {

                property: {

                    include: {

                        complex: true

                    }

                }

            },

            orderBy: {

                id: "asc"

            }

        });

    }


    // =====================
    // Get Property Address By ID
    // =====================

    async getPropertyAddressById(id) {

        return await this.findById(id, {

            include: {

                property: {

                    include: {

                        complex: true

                    }

                }

            }

        });

    }


    // =====================
    // Get Property Address By Property ID
    // =====================

    async getPropertyAddressByPropertyId(propertyId) {

        return await this.model.findUnique({

            where: {

                propertyId

            },

            include: {

                property: {

                    include: {

                        complex: true

                    }

                }

            }

        });

    }


    // =====================
    // Get Addresses By Property
    // =====================

    async getAddressesByProperty(propertyId) {

        return await this.model.findMany({

            where: {

                propertyId

            },

            include: {

                property: {

                    include: {

                        complex: true

                    }

                }

            },

            orderBy: {

                id: "asc"

            }

        });

    }


    // =====================
    // Update Property Address
    // =====================

    async updatePropertyAddress(id, data) {

        return await this.update(

            id,

            data

        );

    }


    // =====================
    // Delete Property Address
    // =====================

    async deletePropertyAddress(id) {

        return await this.delete(id);

    }

}


module.exports = new PropertyAddressRepository();