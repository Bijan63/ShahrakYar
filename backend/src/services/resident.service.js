const AppError = require("../utils/AppError");

const personRepository =
    require("../repositories/person.repository");

const residentRepository =
    require("../repositories/resident.repository");

const userRepository =
    require("../repositories/user.repository");

const unitRepository =
    require("../repositories/unit.repository");

const residentMapper =
    require("../mappers/resident.mapper");

const accessService =
    require("./access.service");


// ======================================================
// Resident Service
// ======================================================

class ResidentService {

    // ======================================================
    // Validate Mobile
    // ======================================================

    validateMobile(mobile) {

        if (
            typeof mobile !== "string" ||
            !/^09\d{9}$/.test(mobile)
        ) {

            throw new AppError(
                "شماره موبایل نامعتبر است.",
                400
            );

        }

    }


    // ======================================================
    // Validate Full Name
    // ======================================================

    validateFullName(fullName) {

        if (
            fullName === undefined ||
            fullName === null
        ) {

            throw new AppError(
                "fullName is required.",
                400
            );

        }


        if (typeof fullName !== "string") {

            throw new AppError(
                "fullName must be a string.",
                400
            );

        }


        const normalizedFullName =
            fullName.trim();


        if (!normalizedFullName) {

            throw new AppError(
                "fullName cannot be empty.",
                400
            );

        }


        return normalizedFullName;

    }


    // ======================================================
    // Normalize Repository Errors
    // ======================================================

    handleRepositoryError(
        error,
        operation
    ) {

        if (error instanceof AppError) {

            throw error;

        }


        if (error?.code === "P2002") {

            const target =
                Array.isArray(error?.meta?.target)
                    ? error.meta.target
                    : [];


            if (target.includes("mobile")) {

                throw new AppError(
                    "Mobile number already exists.",
                    409
                );

            }


            if (target.includes("userId")) {

                throw new AppError(
                    "This user is already a resident.",
                    409
                );

            }


            if (target.includes("personId")) {

                throw new AppError(
                    "This person is already connected to another resident.",
                    409
                );

            }


            throw new AppError(
                "Resident already exists.",
                409
            );

        }


        if (error?.code === "P2003") {

            throw new AppError(
                "Invalid resident reference.",
                400
            );

        }


        if (error?.code === "P2025") {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        if (
            error?.name ===
            "PrismaClientValidationError"
        ) {

            console.error(
                `[ResidentService.${operation}] Prisma validation error:`,
                error
            );

            throw new AppError(
                "Invalid resident data.",
                400
            );

        }


        console.error(
            `[ResidentService.${operation}] Repository error:`,
            error
        );


        throw new AppError(
            `Unable to ${operation} resident.`,
            500
        );

    }


    // ======================================================
    // Get Unit
    // ======================================================

    async getUnit(unitId) {

        if (!unitId) {

            throw new AppError(
                "unitId is required.",
                400
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


        return unit;

    }


    // ======================================================
    // Validate Unit Access
    // ======================================================

    async validateUnitAccess(
        unit,
        user
    ) {

        if (!user) {

            throw new AppError(
                "Unauthorized.",
                401
            );

        }


        // --------------------------------------------------
        // ADMIN has global access
        // --------------------------------------------------

        if (user.role === "ADMIN") {

            return;

        }


        // --------------------------------------------------
        // Only MANAGER can manage residents
        // --------------------------------------------------

        if (user.role !== "MANAGER") {

            throw new AppError(
                "Forbidden.",
                403
            );

        }


        // --------------------------------------------------
        // Unit must belong to a building or property
        // --------------------------------------------------

        const complexId =
            unit.building?.complexId ||
            unit.property?.complexId ||
            null;


        if (!complexId) {

            throw new AppError(
                "Unit is not connected to a complex.",
                400
            );

        }


        // --------------------------------------------------
        // Manager must have access to complex
        // --------------------------------------------------

        await accessService.requireComplexAccess(
            user,
            complexId
        );

    }


    // ======================================================
    // Validate User
    // ======================================================

    async getUser(userId) {

        const user =
            await userRepository.findById(userId);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        return user;

    }


    // ======================================================
    // Create Resident
    // ======================================================

    async createResident(
        data,
        user
    ) {

        if (
            !data ||
            typeof data !== "object"
        ) {

            throw new AppError(
                "Resident data is required.",
                400
            );

        }


        const {
            fullName,
            mobile,
            userId,
            unitId,
            personId
        } = data;


        // --------------------------------------------------
        // Required fields
        // --------------------------------------------------

        if (
            fullName === undefined ||
            fullName === null ||
            fullName === "" ||
            !mobile ||
            !userId ||
            !unitId
        ) {

            throw new AppError(
                "fullName, mobile, userId and unitId are required.",
                400
            );

        }


        const normalizedFullName =
            this.validateFullName(fullName);


        this.validateMobile(mobile);


        // --------------------------------------------------
        // Check target Unit
        // --------------------------------------------------

        const unit =
            await this.getUnit(unitId);


        await this.validateUnitAccess(
            unit,
            user
        );


        // --------------------------------------------------
        // Check User
        // --------------------------------------------------

        const targetUser =
            await this.getUser(userId);


        // --------------------------------------------------
        // Check Person
        // --------------------------------------------------

        let person = null;


        if (
            personId !== undefined &&
            personId !== null &&
            personId !== ""
        ) {

            person =
                await personRepository.getPersonById(
                    personId
                );


            if (!person) {

                throw new AppError(
                    "Person not found.",
                    404
                );

            }

        }


        // --------------------------------------------------
        // User → Person
        // --------------------------------------------------

        if (
            personId &&
            targetUser.personId &&
            targetUser.personId !== personId
        ) {

            throw new AppError(
                "This person is not connected to this user.",
                400
            );

        }


        // --------------------------------------------------
        // Existing Resident By User
        // --------------------------------------------------

        const residentByUser =
            await residentRepository.findByUserId(
                userId
            );


        if (residentByUser) {

            throw new AppError(
                "This user is already a resident.",
                409
            );

        }


        // --------------------------------------------------
        // Duplicate Mobile
        // --------------------------------------------------

        const residentByMobile =
            await residentRepository.findByMobile(
                mobile
            );


        if (residentByMobile) {

            throw new AppError(
                "Mobile number already exists.",
                409
            );

        }


        // --------------------------------------------------
        // Duplicate Person
        // --------------------------------------------------

        if (personId) {

            const residentByPerson =
                await residentRepository.findByPersonId(
                    personId
                );


            if (residentByPerson) {

                throw new AppError(
                    "This person is already connected to another resident.",
                    409
                );

            }

        }


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        let resident;


        try {

            resident =
                await residentRepository.create({

                    fullName:
                        normalizedFullName,

                    mobile,

                    userId,

                    unitId,

                    ...(personId
                        ? { personId }
                        : {})

                });

        }
        catch (error) {

            this.handleRepositoryError(
                error,
                "create"
            );

        }


        return residentMapper.toResponse(
            resident
        );

    }


    // ======================================================
    // Get Resident By ID
    // ======================================================

    async getResidentById(
        id,
        user
    ) {

        const resident =
            await residentRepository.findById(id);


        if (!resident) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        await this.validateUnitAccess(
            resident.unit,
            user
        );


        return residentMapper.toResponse(
            resident
        );

    }


    // ======================================================
    // Get Residents
    // ======================================================

    async getResidents(
        page = 1,
        limit = 20,
        user
    ) {

        if (!user) {

            throw new AppError(
                "Unauthorized.",
                401
            );

        }


        // --------------------------------------------------
        // ADMIN
        // --------------------------------------------------

        if (user.role === "ADMIN") {

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

                pages:
                    Math.ceil(
                        total / limit
                    ),

                data:
                    residents.map(
                        residentMapper.toResponse
                    )

            };

        }


        // --------------------------------------------------
        // MANAGER
        // --------------------------------------------------

        if (user.role !== "MANAGER") {

            throw new AppError(
                "Forbidden.",
                403
            );

        }


        const allResidents =
            await residentRepository.findAll(
                0,
                100000
            );


        const accessibleResidents = [];


        for (const resident of allResidents) {

            try {

                await this.validateUnitAccess(
                    resident.unit,
                    user
                );


                accessibleResidents.push(
                    resident
                );

            } catch (error) {

                if (
                    error.statusCode === 403 ||
                    error.statusCode === 404 ||
                    error.status === 403 ||
                    error.status === 404
                ) {

                    continue;

                }

                throw error;

            }

        }


        const total =
            accessibleResidents.length;


        const skip =
            (page - 1) * limit;


        const data =
            accessibleResidents
                .slice(
                    skip,
                    skip + limit
                )
                .map(
                    residentMapper.toResponse
                );


        return {

            total,

            page,

            limit,

            pages:
                Math.ceil(
                    total / limit
                ),

            data

        };

    }


    // ======================================================
    // Search Residents
    // ======================================================

    async searchResidents(
        query,
        user
    ) {

        if (!user) {

            throw new AppError(
                "Unauthorized.",
                401
            );

        }


        const page =
            Number(query.page) || 1;


        const limit =
            Number(query.limit) || 20;


        const skip =
            (page - 1) * limit;


        const where = {};


        const searchTerm =
            typeof query.search === "string"
                ? query.search.trim()
                : query.search;


        // --------------------------------------------------
        // Search
        // --------------------------------------------------

        if (searchTerm) {

            where.OR = [

                {
                    fullName: {
                        contains: searchTerm,
                        mode: "insensitive"
                    }
                },

                {
                    mobile: {
                        contains: searchTerm
                    }
                }

            ];

        }


        // --------------------------------------------------
        // Unit
        // --------------------------------------------------

        if (query.unitId) {

            where.unitId =
                query.unitId;

        }


        // --------------------------------------------------
        // Building
        // --------------------------------------------------

        if (query.buildingId) {

            where.unit = {

                buildingId:
                    query.buildingId

            };

        }


        // --------------------------------------------------
        // ADMIN
        // --------------------------------------------------

        if (user.role === "ADMIN") {

            const residents =
                await residentRepository.search({

                    skip,

                    take: limit,

                    where,

                    orderBy: {
                        fullName: "asc"
                    }

                });


            const total =
                await residentRepository.countSearch(
                    where
                );


            return {

                total,

                page,

                limit,

                pages:
                    Math.ceil(
                        total / limit
                    ),

                data:
                    residents.map(
                        residentMapper.toResponse
                    )

            };

        }


        // --------------------------------------------------
        // MANAGER
        // --------------------------------------------------

        if (user.role !== "MANAGER") {

            throw new AppError(
                "Forbidden.",
                403
            );

        }


        // --------------------------------------------------
        // Fetch matching residents
        // --------------------------------------------------

        const residents =
            await residentRepository.search({

                skip: 0,

                take: 100000,

                where,

                orderBy: {
                    fullName: "asc"
                }

            });


        const accessibleResidents = [];


        for (const resident of residents) {

            try {

                await this.validateUnitAccess(
                    resident.unit,
                    user
                );


                accessibleResidents.push(
                    resident
                );

            } catch (error) {

                if (
                    error.statusCode === 403 ||
                    error.statusCode === 404 ||
                    error.status === 403 ||
                    error.status === 404
                ) {

                    continue;

                }

                throw error;

            }

        }


        const total =
            accessibleResidents.length;


        const data =
            accessibleResidents
                .slice(
                    skip,
                    skip + limit
                )
                .map(
                    residentMapper.toResponse
                );


        return {

            total,

            page,

            limit,

            pages:
                Math.ceil(
                    total / limit
                ),

            data

        };

    }


    // ======================================================
    // Update Resident
    // ======================================================

    async updateResident(
        id,
        data,
        user
    ) {

        const resident =
            await residentRepository.findById(id);


        if (!resident) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        // --------------------------------------------------
        // Current Unit Access
        // --------------------------------------------------

        await this.validateUnitAccess(
            resident.unit,
            user
        );


        // --------------------------------------------------
        // Validate Full Name
        // --------------------------------------------------

        if (data.fullName !== undefined) {

            data = {
                ...data,
                fullName:
                    this.validateFullName(
                        data.fullName
                    )
            };

        }


        // --------------------------------------------------
        // Validate Mobile
        // --------------------------------------------------

        if (data.mobile !== undefined) {

            this.validateMobile(
                data.mobile
            );


            const residentByMobile =
                await residentRepository.findByMobile(
                    data.mobile
                );


            if (
                residentByMobile &&
                residentByMobile.id !== id
            ) {

                throw new AppError(
                    "Mobile already exists.",
                    409
                );

            }

        }


        // --------------------------------------------------
        // Person
        // --------------------------------------------------

        if (
            data.personId !== undefined &&
            data.personId !== null &&
            data.personId !== ""
        ) {

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


        // --------------------------------------------------
        // New Unit
        // --------------------------------------------------

        if (
            data.unitId !== undefined
        ) {

            if (!data.unitId) {

                throw new AppError(
                    "unitId cannot be empty.",
                    400
                );

            }


            const newUnit =
                await this.getUnit(
                    data.unitId
                );


            await this.validateUnitAccess(
                newUnit,
                user
            );

        }


        // --------------------------------------------------
        // Prepare Update
        // --------------------------------------------------

        const updateData = {
            ...data
        };


        if (
            data.personId === null ||
            data.personId === ""
        ) {

            updateData.personId = null;

        }


        delete updateData.residentType;

        delete updateData.buildingId;

        // User cannot be changed here
        delete updateData.userId;


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        let updatedResident;


        try {

            updatedResident =
                await residentRepository.update(
                    id,
                    updateData
                );

        }
        catch (error) {

            this.handleRepositoryError(
                error,
                "update"
            );

        }


        return residentMapper.toResponse(
            updatedResident
        );

    }


    // ======================================================
    // Delete Resident
    // ======================================================

    async deleteResident(
        id,
        user
    ) {

        const resident =
            await residentRepository.findById(id);


        if (!resident) {

            throw new AppError(
                "Resident not found.",
                404
            );

        }


        await this.validateUnitAccess(
            resident.unit,
            user
        );


        await residentRepository.delete(id);


        return {

            success: true,

            message:
                "Resident deleted successfully."

        };

    }

}


module.exports =
    new ResidentService();