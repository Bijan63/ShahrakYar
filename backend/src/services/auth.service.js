const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

class AuthService {

    async register(data) {

        const {
            fullName,
            email,
            password
        } = data;

        if (!fullName || !email || !password) {

            throw new AppError(
                "All fields are required.",
                400
            );

        }

        const existingUser =
            await userRepository.findByEmail(email);

        if (existingUser) {

            throw new AppError(
                "Email already exists.",
                409
            );

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user =
            await userRepository.create({

                fullName,

                email,

                password: hashedPassword

            });

        return user;

    }

    async login(data) {

        const {
            email,
            password
        } = data;

        if (!email || !password) {

            throw new AppError(
                "Email and password are required.",
                400
            );

        }

        const user =
            await userRepository.findByEmail(email);

        if (!user) {

            throw new AppError(
                "Invalid email or password.",
                401
            );

        }

        const validPassword =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!validPassword) {

            throw new AppError(
                "Invalid email or password.",
                401
            );

        }

        const token =
            jwt.sign(

                {

                    id: user.id,

                    role: user.role

                },

                process.env.JWT_SECRET,

                {

                    expiresIn: "7d"

                }

            );

        return {

            token,

            user: {

                id: user.id,

                fullName: user.fullName,

                email: user.email,

                role: user.role

            }

        };

    }

}

module.exports = new AuthService();
