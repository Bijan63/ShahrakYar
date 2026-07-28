const AppError = require("../utils/AppError");
const residentRepository = require("../repositories/resident.repository");
const unitRepository = require("../repositories/unit.repository");
const userRepository = require("../repositories/user.repository");

class ResidentService {

    async createResident(data) {

        const {
            fullName,
            mobile,
            residentType,
            unitId,
            userId
        } = data;

        if (!fullName || !mobile || !residentType || !unitId || !userId) {

            throw new AppError(
                "All fields are required.",
                400
            );

        }

        const unit =
    await unitRepository.findById(
        unitId
    );

        if (!unit) {

            throw new AppError(
                "Unit not found.",
                404
            );

        }

        const user =
    await userRepository.findById(
        userId
    );

        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }

       const existingResident =
    await residentRepository.findByUserId(
        userId
    );

        if (existingResident) {

            throw new AppError(
                "User already has a resident profile.",
                409
            );

        }

       const resident =
    await residentRepository.create({

        fullName,
        mobile,
        residentType,
        unitId,
        userId

    });

        return resident;

    }

}

module.exports = new ResidentService();