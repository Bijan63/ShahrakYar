const dashboardService =
    require("../services/dashboard.service");

const getDashboard = async (req, res, next) => {
    try {
        const dashboard =
            await dashboardService.getDashboard(req.user);

        return res.json({
            success: true,
            dashboard,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard,
};
