const prisma = require("../config/prisma");

class DashboardRepository {

    async getStatistics() {

        const [

            complexes,

            properties,

            villas,

            lands,

            apartments,

            commercials,

            persons,

            ownerships,

            residencies,

            ownerResidents,

            tenantResidents

        ] = await Promise.all([

            prisma.complex.count(),

            prisma.property.count(),

            prisma.property.count({
                where: {
                    propertyType: "VILLA"
                }
            }),

            prisma.property.count({
                where: {
                    propertyType: "LAND"
                }
            }),

            prisma.property.count({
                where: {
                    propertyType: "APARTMENT"
                }
            }),

            prisma.property.count({
                where: {
                    propertyType: "COMMERCIAL"
                }
            }),

            prisma.person.count(),

            prisma.ownership.count(),

            prisma.residency.count(),

            prisma.residency.count({
                where: {
                    type: "OWNER"
                }
            }),

            prisma.residency.count({
                where: {
                    type: "TENANT"
                }
            })

        ]);

        return {

            complexes,

            properties,

            propertyTypes: {

                villas,

                lands,

                apartments,

                commercials

            },

            persons,

            ownerships,

            residencies,

            ownerResidents,

            tenantResidents

        };

    }

}

module.exports = new DashboardRepository();
