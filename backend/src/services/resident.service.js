const AppError = require("../utils/AppError");

const residentRepository = require("../repositories/resident.repository");
const userRepository = require("../repositories/user.repository");
const unitRepository = require("../repositories/unit.repository");

class ResidentService {
    async createResident(data) {
        const { fullName, mobile, residentType, userId, unitId } = data;

        if (!fullName || !mobile || !residentType || !userId || !unitId) {
            throw new AppError("All fields are required.", 400);
        }

        const user = await userRepository.findById(userId);

        if (!user) {
            throw new AppError("User not found.", 404);
        }

        const unit = await unitRepository.findById(unitId);

        if (!unit) {
            throw new AppError("Unit not found.", 404);
        }

        const residentByUser = await residentRepository.findByUserId(userId);

        if (residentByUser) {
            throw new AppError("This user is already a resident.", 409);
        }

        const residentByMobile = await residentRepository.findByMobile(mobile);

        if (residentByMobile) {
            throw new AppError("Mobile number already exists.", 409);
        }

        return residentRepository.create({
            fullName,
            mobile,
            residentType,
            userId,
            unitId
        });
    }

    async getResidentById(id) {
        const resident = await residentRepository.findById(Number(id));

        if (!resident) {
            throw new AppError("Resident not found.", 404);
        }

        return resident;
    }

    async getResidents(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const residents = await residentRepository.findAll(skip, limit);

        const total = await residentRepository.count();

        return {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            data: residents
        };
    }

    async searchResidents(query) {
        const page = Number(query.page) || 1;

        const limit = Number(query.limit) || 20;

        const skip = (page - 1) * limit;

        const where = {};

        if (query.search) {
            where.OR = [
                {
                    fullName: {
                        contains: query.search,
                        mode: "insensitive"
                    }
                },
                {
                    mobile: {
                        contains: query.search
                    }
                }
            ];
        }

        if (query.residentType) {
            where.residentType = query.residentType;
        }

        if (query.unitId) {
            where.unitId = Number(query.unitId);
        }

        if (query.buildingId) {
            where.unit = {
                buildingId: Number(query.buildingId)
            };
        }

        const allowedSort = ["fullName", "mobile", "createdAt"];

        const sortField = allowedSort.includes(query.sort)
            ? query.sort
            : "fullName";

        const sortOrder = query.order || "asc";

        const orderBy = {
            [sortField]: sortOrder
        };

        const residents = await residentRepository.search({
            skip,
            take: limit,
            where,
            orderBy
        });

        const total = await residentRepository.countSearch(where);

        return {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            data: residents
        };
    }

    async updateResident(id, data) {
        const exists = await residentRepository.exists(Number(id));

        if (!exists) {
            throw new AppError("Resident not found.", 404);
        }

        if (data.mobile) {
            const resident = await residentRepository.findByMobile(data.mobile);

            if (resident && resident.id !== Number(id)) {
                throw new AppError("Mobile already exists.", 409);
            }
        }

        return residentRepository.update(Number(id), data);
    }

    async deleteResident(id) {
        const exists = await residentRepository.exists(Number(id));

        if (!exists) {
            throw new AppError("Resident not found.", 404);
        }

        await residentRepository.delete(Number(id));

        return {
            success: true,
            message: "Resident deleted successfully."
        };
    }
}

module.exports = new ResidentService();
