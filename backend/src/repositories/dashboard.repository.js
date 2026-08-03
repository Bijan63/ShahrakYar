const prisma = require("../config/prisma");

class DashboardRepository {
    async getStatistics() {
        const [
            buildings,
            units,
            residents,
            owners,
            tenants,
            activeElections,
            candidates,
            votes
        ] = await Promise.all([
            prisma.building.count(),

            prisma.unit.count(),

            prisma.resident.count(),

            prisma.resident.count({
                where: {
                    residentType: "OWNER"
                }
            }),

            prisma.resident.count({
                where: {
                    residentType: "TENANT"
                }
            }),

            prisma.election.count({
                where: {
                    status: "OPEN"
                }
            }),

            prisma.candidate.count(),

            prisma.vote.count()
        ]);

        return {
            buildings,
            units,
            residents,
            owners,
            tenants,
            activeElections,
            candidates,
            votes
        };
    }
}

module.exports = new DashboardRepository();
