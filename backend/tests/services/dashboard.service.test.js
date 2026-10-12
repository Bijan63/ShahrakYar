jest.mock("../../src/repositories/dashboard.repository", () => ({
    getStatistics: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    getAccessibleComplexIds: jest.fn(),
}));

const dashboardService =
    require("../../src/services/dashboard.service");

const dashboardRepository =
    require("../../src/repositories/dashboard.repository");

const accessService =
    require("../../src/services/access.service");

describe("DashboardService access control", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        dashboardRepository.getStatistics.mockResolvedValue({
            complexes: 1,
        });
    });

    test("active ADMIN receives global statistics", async () => {
        accessService.getAccessibleComplexIds.mockResolvedValue(null);

        const user = {
            id: "admin-1",
            role: "ADMIN",
        };

        const result = await dashboardService.getDashboard(user);

        expect(result).toEqual({ complexes: 1 });
        expect(accessService.getAccessibleComplexIds)
            .toHaveBeenCalledWith(user);
        expect(dashboardRepository.getStatistics)
            .toHaveBeenCalledWith();
    });

    test("ADMIN without confirmed global access is forbidden", async () => {
        accessService.getAccessibleComplexIds.mockResolvedValue([]);

        await expect(
            dashboardService.getDashboard({
                id: "inactive-admin-1",
                role: "ADMIN",
            })
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(dashboardRepository.getStatistics)
            .not.toHaveBeenCalled();
    });

    test("MANAGER receives statistics scoped to assigned complexes", async () => {
        accessService.getAccessibleComplexIds.mockResolvedValue([
            "complex-a",
            "complex-b",
        ]);

        await dashboardService.getDashboard({
            id: "manager-1",
            role: "MANAGER",
        });

        expect(dashboardRepository.getStatistics)
            .toHaveBeenCalledWith({
                complexIds: ["complex-a", "complex-b"],
            });
    });

    test("MANAGER with no assigned complexes receives an empty scope", async () => {
        accessService.getAccessibleComplexIds.mockResolvedValue([]);

        await dashboardService.getDashboard({
            id: "manager-1",
            role: "MANAGER",
        });

        expect(dashboardRepository.getStatistics)
            .toHaveBeenCalledWith({
                complexIds: [],
            });
    });

    test("USER is forbidden from accessing the management dashboard", async () => {
        await expect(
            dashboardService.getDashboard({
                id: "user-1",
                role: "USER",
            })
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(accessService.getAccessibleComplexIds)
            .not.toHaveBeenCalled();
        expect(dashboardRepository.getStatistics)
            .not.toHaveBeenCalled();
    });

    test("missing user is rejected", async () => {
        await expect(
            dashboardService.getDashboard(null)
        ).rejects.toMatchObject({
            message: "Unauthorized.",
            statusCode: 401,
        });

        expect(dashboardRepository.getStatistics)
            .not.toHaveBeenCalled();
    });
});
