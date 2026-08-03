const dashboardRepository = require("../repositories/dashboard.repository");
const prisma = require("../config/prisma");

class DashboardService {
    async getDashboard() {
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
                    status: "ACTIVE"
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

module.exports = new DashboardService();
