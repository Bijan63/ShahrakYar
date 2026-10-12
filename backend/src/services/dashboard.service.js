const AppError = require("../utils/AppError");

const dashboardRepository =
    require("../repositories/dashboard.repository");

const accessService =
    require("./access.service");

class DashboardService {
    async getDashboard(user) {
        if (!user || !user.id || !user.role) {
            throw new AppError("Unauthorized.", 401);
        }

        if (!["ADMIN", "MANAGER"].includes(user.role)) {
            throw new AppError("Forbidden.", 403);
        }

        const complexIds =
            await accessService.getAccessibleComplexIds(user);

        // Only an active ADMIN gets the global dashboard.
        // AccessService returns null only for an active ADMIN.
        if (user.role === "ADMIN") {
            if (complexIds !== null) {
                throw new AppError("Forbidden.", 403);
            }

            return dashboardRepository.getStatistics();
        }

        // MANAGER can only see statistics for assigned complexes.
        if (!Array.isArray(complexIds)) {
            throw new AppError("Forbidden.", 403);
        }

        return dashboardRepository.getStatistics({
            complexIds,
        });
    }
}

module.exports = new DashboardService();
