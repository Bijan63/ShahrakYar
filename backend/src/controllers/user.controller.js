const userService = require("../services/user.service");

const profile = async (req, res, next) => {
    try {
        const user = await userService.getProfile(req.user.id);

        return res.json({
            success: true,

            user
        });
    } catch (err) {
        next(err);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;

        const limit = Number(req.query.limit) || 20;

        const users = await userService.getUsers(page, limit);

        return res.json({
            success: true,

            ...users
        });
    } catch (err) {
        next(err);
    }
};

const getUser = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);

        return res.json({
            success: true,

            user
        });
    } catch (err) {
        next(err);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);

        return res.json({
            success: true,

            user
        });
    } catch (err) {
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const result = await userService.deleteUser(req.params.id);

        return res.json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    profile,

    getUsers,

    getUser,

    updateUser,

    deleteUser
};
