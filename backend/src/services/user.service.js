
const bcrypt = require("bcrypt");

const AppError = require("../utils/AppError");

const userRepository = require("../repositories/user.repository");
const prisma = require("../config/prisma");

class UserService {

    // =====================
    // Create User
    // =====================

    async createUser(data) {

        const {
            fullName,
            email,
            password,
            role,
            status,
            personId
        } = data;


        // ---------------------
        // Validate required fields
        // ---------------------

        if (!fullName || !email || !password) {

            throw new AppError(
                "fullName, email and password are required.",
                400
            );

        }


        // ---------------------
        // Check duplicate email
        // ---------------------

        const existingUser =
            await userRepository.findByEmail(email);

        if (existingUser) {

            throw new AppError(
                "Email already exists.",
                409
            );

        }


        // ---------------------
        // Check Person
        // ---------------------

        if (personId) {

            const person =
                await prisma.person.findUnique({

                    where: {
                        id: personId
                    }

                });

            if (!person) {

                throw new AppError(
                    "Person not found.",
                    404
                );

            }


            // Check whether Person is already connected
            // to another User

            const existingPersonUser =
                await prisma.user.findUnique({

                    where: {
                        personId
                    }

                });

            if (existingPersonUser) {

                throw new AppError(
                    "This person is already connected to a user.",
                    409
                );

            }

        }


        // ---------------------
        // Hash password
        // ---------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // ---------------------
        // Create User
        // ---------------------

        return await userRepository.create({

            fullName,

            email,

            password: hashedPassword,

            role: role || "USER",

            status: status || "ACTIVE",

            personId: personId || null

        });

    }


    // =====================
    // Get Profile
    // =====================

    async getProfile(userId) {

        const user =
            await userRepository.findById(userId);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        return {

            id: user.id,

            fullName: user.fullName,

            email: user.email,

            role: user.role,

            personId: user.personId,

            createdAt: user.createdAt

        };

    }


    // =====================
    // Get Users
    // =====================

    async getUsers(page = 1, limit = 20) {

        const skip =
            (page - 1) * limit;


        const users =
            await userRepository.findAll(
                skip,
                limit
            );


        const total =
            await userRepository.count();


        return {

            total,

            page,

            limit,

            pages: Math.ceil(total / limit),

            data: users

        };

    }


    // =====================
    // Get User By ID
    // =====================

    async getUserById(id) {

        const user =
            await userRepository.findById(id);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        return user;

    }


    // =====================
    // Update User
    // =====================

    async updateUser(id, data) {

        const exists =
            await userRepository.exists(id);


        if (!exists) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        // ---------------------
        // Check email
        // ---------------------

        if (data.email) {

            const user =
                await userRepository.findByEmail(
                    data.email
                );


            if (
                user &&
                user.id !== id
            ) {

                throw new AppError(
                    "Email already exists.",
                    409
                );

            }

        }


        // ---------------------
        // Hash new password
        // ---------------------

        if (data.password) {

            data.password =
                await bcrypt.hash(
                    data.password,
                    10
                );

        }


        // ---------------------
        // Update Person
        // ---------------------

        if (
            data.personId !== undefined &&
            data.personId !== null
        ) {

            const person =
                await prisma.person.findUnique({

                    where: {
                        id: data.personId
                    }

                });


            if (!person) {

                throw new AppError(
                    "Person not found.",
                    404
                );

            }


            const existingPersonUser =
                await prisma.user.findUnique({

                    where: {
                        personId: data.personId
                    }

                });


            if (
                existingPersonUser &&
                existingPersonUser.id !== id
            ) {

                throw new AppError(
                    "This person is already connected to another user.",
                    409
                );

            }

        }


        return await userRepository.update(
            id,
            data
        );

    }


    // =====================
    // Delete User
    // =====================

    async deleteUser(id) {

        const exists =
            await userRepository.exists(id);


        if (!exists) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        await userRepository.delete(id);


        return {

            success: true,

            message:
                "User deleted successfully."

        };

    }

}


module.exports = new UserService();
