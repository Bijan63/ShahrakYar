const userService = require("../services/user.service");

// =====================
// Create User
// =====================

const createUser = async (req, res, next) => {
    try {

        const user =
            await userService.createUser(req.body);

        return res.status(201).json({

            success: true,

            message: "User created successfully",

            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                personId: user.personId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }

        });

    } catch (err) {

        next(err);

    }
};


// =====================
// Current User Profile
// =====================

const profile = async (req, res, next) => {

    try {

        const user =
            await userService.getProfile(
                req.user.id
            );

        return res.json({

            success: true,

            user

        });

    } catch (err) {

        next(err);

    }

};


// =====================
// Get All Users
// =====================

const getUsers = async (req, res, next) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 20;


        const users =
            await userService.getUsers(
                page,
                limit
            );


        return res.json({

            success: true,

            ...users

        });

    } catch (err) {

        next(err);

    }

};


// =====================
// Get User By ID
// =====================

const getUser = async (req, res, next) => {

    try {

        const user =
            await userService.getUserById(
                req.params.id
            );


        return res.json({

            success: true,

            user

        });

    } catch (err) {

        next(err);

    }

};


// =====================
// Update User
// =====================

const updateUser = async (req, res, next) => {

    try {

        const user =
            await userService.updateUser(
                req.params.id,
                req.body
            );


        return res.json({

            success: true,

            message: "User updated successfully",

            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                personId: user.personId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }

        });

    } catch (err) {

        next(err);

    }

};


// =====================
// Delete User
// =====================

const deleteUser = async (req, res, next) => {

    try {

        const result =
            await userService.deleteUser(
                req.params.id
            );


        return res.json(result);

    } catch (err) {

        next(err);

    }

};


// =====================
// Export
// =====================

module.exports = {

    createUser,

    profile,

    getUsers,

    getUser,

    updateUser,

    deleteUser

};