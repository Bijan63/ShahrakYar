module.exports = function financeAdminOnly(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Administrator access required for finance operations.",
        });
    }

    return next();
};
