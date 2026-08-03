const AppError = require("../utils/AppError");

const userRepository = require("../repositories/user.repository");

class UserService {
    async getProfile(userId) {
        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError("User not found.", 404);
        }

        return {
            id: user.id,

            fullName: user.fullName,

            email: user.email,

            role: user.role,

            createdAt: user.createdAt
        };
    }

    async getUsers(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const users = await userRepository.findAll(skip, limit);

        const total = await userRepository.count();

        return {
            total,

            page,

            limit,

            data: users
        };
    }

    async getUserById(id) {
        const user = await userRepository.findById(Number(id));

        if (!user) {
            throw new AppError("User not found.", 404);
        }

        return user;
    }

    async updateUser(id, data) {
        const exists = await userRepository.exists(Number(id));

        if (!exists) {
            throw new AppError("User not found.", 404);
        }

        if (data.email) {
            const user = await userRepository.findByEmail(data.email);

            if (user && user.id !== Number(id)) {
                throw new AppError("Email already exists.", 409);
            }
        }

        return await userRepository.update(Number(id), data);
    }

    async deleteUser(id) {
        const exists = await userRepository.exists(Number(id));

        if (!exists) {
            throw new AppError("User not found.", 404);
        }

        await userRepository.delete(Number(id));

        return {
            success: true,

            message: "User deleted successfully."
        };
    }
}

module.exports = new UserService();
