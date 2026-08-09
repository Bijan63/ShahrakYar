const AppError = require("../utils/AppError");

const personRepository = require("../repositories/person.repository");
const residentRepository = require("../repositories/resident.repository");
const userRepository = require("../repositories/user.repository");
const unitRepository = require("../repositories/unit.repository");

class ResidentService {

    // =====================
    // Create Resident
    // =====================

    async createResident(data) {

        const {
            fullName,
            mobile,
            residentType,
            userId,
            unitId,
            personId
        } = data;


        // ---------------------
        // Validate required fields
        // ---------------------

       if (
    !fullName ||
    !mobile ||
    !residentType ||
    !userId ||
    !unitId ||
    !personId
) {
    throw new AppError(
        "fullName, mobile, residentType, userId, unitId and personId are required.",
        400
    );
}


        // ---------------------
        // Check User
        // ---------------------

        const user =
            await userRepository.findById(userId);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        // ---------------------
        // Check Person
        // ---------------------

        const person =
            await personRepository.getPersonById(personId);


        if (!person) {

            throw new AppError(
                "Person not found.",
                404
            );

        }
        return residentRepository.create({
    fullName,
    mobile,
    residentType,
    userId,
    unitId,
    personId
});


        // ---------------------
        // Check User → Person
        // ---------------------

        if (user.personId !== personId) {

            throw new AppError(
                "This person is not connected to this user.",
                400
            );

        }


        // ---------------------
        // Check Unit
        // ---------------------

        const unit =
            await unitRepository.findById(unitId);


        if (!unit) {

            throw new AppError(
                "Unit not found.",
                404
            );

        }


        // ---------------------
        // Check existing Resident
        // ---------------------

        const residentByUser =
            await residentRepository.findByUserId(userId);


        if (residentByUser) {

            throw new AppError(
                "This user is already a resident.",
                409
            );

        }


        // ---------------------
        // Check duplicate mobile
        // ---------------------

        const residentByMobile =
            await residentRepository.findByMobile(mobile);


        if (residentByMobile) {

            throw new AppError(
                "Mobile number already exists.",
                409
            );

        }


        // ---------------------
        // Create Resident
        // ---------------------

        return residentRepository.create({

            fullName,

            mobile,

            residentType,

            userId,

            unitId,

            personId

        });

    }


    // =====================
    // Get Resident By ID
    // =====================

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


    // =====================
    // Get Residents
    // =====================

    async getResidents(page = 1, limit = 20) {

        const skip =
            (page - 1) * limit;


        const residents =
            await residentRepository.findAll(
                skip,
                limit
            );


        const total =
            await residentRepository.count();


        return {

            total,

            page,

            limit,

            pages: Math.ceil(total / limit),

            data: residents

        };

    }


    // =====================
    // Search Residents
    // =====================

    async searchResidents(query) {

        const page =
            Number(query.page) || 1;


        const limit =
            Number(query.limit) || 20;


        const skip =
            (page - 1) * limit;


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

            where.residentType =
                query.residentType;

        }


        // UUID
        if (query.unitId) {

            where.unitId =
                query.unitId;

        }


        // UUID
        if (query.buildingId) {

            where.unit = {

                buildingId:
                    query.buildingId

            };

        }


        const allowedSort = [

            "fullName",

            "mobile",

            "createdAt"

        ];


        const sortField =
            allowedSort.includes(query.sort)

                ? query.sort

                : "fullName";


        const sortOrder =
            query.order === "desc"
                ? "desc"
                : "asc";


        const orderBy = {

            [sortField]: sortOrder

        };


        const residents =
            await residentRepository.search({

                skip,

                take: limit,

                where,

                orderBy

            });


        const total =
            await residentRepository.countSearch(
                where
            );


        return {

            total,

            page,

            limit,

            pages: Math.ceil(
                total / limit
            ),

            data: residents

        };

    }


    // =====================
    // Update Resident
    // =====================

    async updateResident(id, data) {

        const exists =
            await residentRepository.exists(id);


        if (!exists) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        // ---------------------
        // Check Mobile
        // ---------------------

        if (data.mobile) {

            const resident =
                await residentRepository.findByMobile(
                    data.mobile
                );


            if (
                resident &&
                resident.id !== id
            ) {

                throw new AppError(
                    "Mobile already exists.",
                    409
                );

            }

        }


        // ---------------------
        // Check Person
        // ---------------------

        if (data.personId !== undefined) {

            if (!data.personId) {

                throw new AppError(
                    "personId cannot be empty.",
                    400
                );

            }


            const person =
                await personRepository.getPersonById(
                    data.personId
                );


            if (!person) {

                throw new AppError(
                    "Person not found.",
                    404
                );

            }


            const residentByPerson =
                await residentRepository.findByPersonId(
                    data.personId
                );


            if (
                residentByPerson &&
                residentByPerson.id !== id
            ) {

                throw new AppError(
                    "This person is already connected to another resident.",
                    409
                );

            }

        }


        // ---------------------
        // Update Resident
        // ---------------------

        return residentRepository.update(
            id,
            data
        );

    }


    // =====================
    // Delete Resident
    // =====================

    async deleteResident(id) {

        const exists =
            await residentRepository.exists(id);


        if (!exists) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        await residentRepository.delete(id);


        return {

            success: true,

            message:
                "Resident deleted successfully."

        };

    }

}


module.exports = new ResidentService();
