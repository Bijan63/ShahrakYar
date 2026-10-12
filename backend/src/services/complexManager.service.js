const AppError = require("../utils/AppError");

const complexManagerRepository =
    require("../repositories/complexManager.repository");

const userRepository =
    require("../repositories/user.repository");

const complexRepository =
    require("../repositories/complex.repository");


class ComplexManagerService {

    // =========================
    // Assign Manager To Complex
    // =========================

    async assignManager(
        userId,
        complexId
    ) {

        // -------------------------
        // Required fields
        // -------------------------

        if (!userId || !complexId) {

            throw new AppError(
                "userId and complexId are required.",
                400
            );

        }


        // -------------------------
        // Check User
        // -------------------------

        const user =
            await userRepository.findById(userId);


        if (!user) {

            throw new AppError(
                "User not found.",
                404
            );

        }


        // -------------------------
        // User must be MANAGER
        // -------------------------

        if (user.role !== "MANAGER") {

            throw new AppError(
                "Only users with MANAGER role can be assigned to a complex.",
                400
            );

        }


        // -------------------------
        // User must be ACTIVE
        // -------------------------

        if (user.status !== "ACTIVE") {

            throw new AppError(
                "Inactive or blocked manager cannot be assigned to a complex.",
                400
            );

        }


        // -------------------------
        // Check Complex
        // -------------------------

        const complex =
            await complexRepository.findById(
                complexId
            );


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        // -------------------------
        // Check duplicate assignment
        // -------------------------

        const existingAssignment =
            await complexManagerRepository
                .findByUserAndComplex(
                    userId,
                    complexId
                );


        if (existingAssignment) {

            throw new AppError(
                "This manager is already assigned to this complex.",
                409
            );

        }


        // -------------------------
        // Create assignment
        // -------------------------

              try {
            return await complexManagerRepository.create({
                userId,
                complexId
            });
        } catch (error) {
            if (error?.code === "P2002") {
                throw new AppError(
                    "This manager is already assigned to this complex.",
                    409
                );
            }

            throw error;
        }
    }

    // =========================
    // Get All Assignments
    // =========================

    async getAssignments() {

        return await complexManagerRepository
            .findAll();

    }


    // =========================
    // Get Assignment By ID
    // =========================

    async getAssignmentById(id) {

        const assignment =
            await complexManagerRepository
                .findById(id);


        if (!assignment) {

            throw new AppError(
                "Complex manager assignment not found.",
                404
            );

        }


        return assignment;

    }


    // =========================
    // Get Complexes Of Manager
    // =========================

    async getManagerComplexes(userId) {

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


        if (user.role !== "MANAGER") {

            throw new AppError(
                "Only MANAGER users can have managed complexes.",
                400
            );

        }


        return await complexManagerRepository
            .findByUserId(userId);

    }


    // =========================
    // Get Managers Of Complex
    // =========================

    async getComplexManagers(complexId) {

        const complex =
            await complexRepository.findById(
                complexId
            );


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return await complexManagerRepository
            .findByComplexId(
                complexId
            );

    }


    // =========================
    // Remove Assignment
    // =========================

    async removeAssignment(id) {

        const assignment =
            await complexManagerRepository
                .findById(id);


        if (!assignment) {

            throw new AppError(
                "Complex manager assignment not found.",
                404
            );

        }


        return await complexManagerRepository.delete(
            id
        );

    }

}


module.exports =
    new ComplexManagerService();