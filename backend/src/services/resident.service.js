const AppError = require("../utils/AppError");

const residentRepository = require("../repositories/resident.repository");
const userRepository = require("../repositories/user.repository");
const unitRepository = require("../repositories/unit.repository");

class ResidentService {

    async createResident(data) {

        const {
            fullName,
            mobile,
            residentType,
            userId,
            unitId
        } = data;

        if (!fullName || !mobile || !residentType || !userId || !unitId) {

            throw new AppError(
                "All fields are required.",
                400
            );

        }

        const user =
            await userRepository.findById(userId);

        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }

        const unit =
            await unitRepository.findById(unitId);

        if (!unit) {

            throw new AppError(
                "Unit not found.",
                404
            );

        }

        const residentByUser =
            await residentRepository.findByUserId(userId);

        if (residentByUser) {

            throw new AppError(
                "This user is already a resident.",
                409
            );

        }

        const residentByMobile =
            await residentRepository.findByMobile(mobile);

        if (residentByMobile) {

            throw new AppError(
                "Mobile number already exists.",
                409
            );

        }

        return await residentRepository.create({
            fullName,
            mobile,
            residentType,
            userId,
            unitId
        });

    }

    async getResidentById(id) {

        const resident =
            await residentRepository.findById(id);

        if (!resident) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }

        return resident;

    }

    async getResidents(page = 1, limit = 20) {

        const skip =
            (page - 1) * limit;

        const residents =
            await residentRepository.findAll(skip, limit);

        const total =
            await residentRepository.count();

        return {

            total,

            page,

            limit,

            data: residents

        };

    }

    async searchResidents(keyword) {

        return await residentRepository.search(keyword);

    }

    async updateResident(id, data) {

        const exists =
            await residentRepository.exists(id);

        if (!exists) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }

        if (data.mobile) {

            const resident =
                await residentRepository.findByMobile(
                    data.mobile
                );

            if (resident && resident.id !== Number(id)) {

                throw new AppError(
                    "Mobile already exists.",
                    409
                );

            }

        }

        return await residentRepository.update(
            Number(id),
            data
        );

    }

    async deleteResident(id) {

        const exists =
            await residentRepository.exists(id);

        if (!exists) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }

        await residentRepository.delete(
            Number(id)
        );

        return {

            success: true,

            message: "Resident deleted successfully."

        };

    }

}

module.exports = new ResidentService();