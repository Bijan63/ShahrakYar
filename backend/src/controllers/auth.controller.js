const authService = require("../services/auth.service");

const register = async (req, res, next) => {
    try {
        const user = await authService.register(req.body);

        return res.status(201).json({
            success: true,

            user
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);

        return res.status(200).json({
            success: true,

            token: result.token,

            user: result.user
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,

    login
};
