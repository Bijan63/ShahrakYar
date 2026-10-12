const AppError = require("../utils/AppError");

const complexManagerRepository =
    require("../repositories/complexManager.repository");

const userRepository =
    require("../repositories/user.repository");


class AccessService {

    // ==================================================
    // Get current user from database
    // ==================================================

    async getCurrentUser(user) {

        if (!user || !user.id || !user.role) {

            throw new AppError(
                "Unauthorized.",
                401
            );

        }

        const currentUser =
            await userRepository.findById(
                user.id
            );

        if (!currentUser) {

            throw new AppError(
                "Unauthorized.",
                401
            );

        }

        return currentUser;

    }


    // ==================================================
    // Check whether user can access a Complex
    // ==================================================

    async canAccessComplex(
        user,
        complexId
    ) {

        const currentUser =
            await this.getCurrentUser(user);


        // ------------------------------------------
        // User must be ACTIVE
        // ------------------------------------------

        if (currentUser.status !== "ACTIVE") {

            return false;

        }


        // ------------------------------------------
        // ADMIN has global access
        // ------------------------------------------

        if (currentUser.role === "ADMIN") {

            return true;

        }


        // ------------------------------------------
        // MANAGER must be assigned to the Complex
        // ------------------------------------------

        if (currentUser.role === "MANAGER") {

            const assignment =
                await complexManagerRepository
                    .findByUserAndComplex(
                        currentUser.id,
                        complexId
                    );

            return !!assignment;

        }


        // ------------------------------------------
        // USER currently has no Complex-level access
        // ------------------------------------------

        return false;

    }


    // ==================================================
    // Require Unit Account Complex Access
    // ==================================================

    async requireUnitAccountComplexAccess(user, unitAccount) {

        if (!user || !user.id || !user.role) {
            throw new AppError("Unauthorized.", 401);
        }

        if (!unitAccount || !unitAccount.unit) {
            throw new AppError(
                "Unit account or associated unit not found.",
                404
            );
        }

        const unit = unitAccount.unit;
        const complexIds = [];

        if (unit.building && unit.building.complexId) {
            complexIds.push(unit.building.complexId);
        }

        if (unit.property && unit.property.complexId) {
            complexIds.push(unit.property.complexId);
        }

        const uniqueComplexIds = [...new Set(complexIds)];

        if (uniqueComplexIds.length === 0) {
            throw new AppError(
                "Unable to determine the complex for this unit account.",
                403
            );
        }

        if (uniqueComplexIds.length > 1) {
            throw new AppError(
                "Unit account is linked to different complexes.",
                403
            );
        }

        await this.requireComplexAccess(user, uniqueComplexIds[0]);

        return true;
    }


    // ==================================================
    // Require Complex Access
    // ==================================================

    async requireComplexAccess(
        user,
        complexId
    ) {

        const hasAccess =
            await this.canAccessComplex(
                user,
                complexId
            );


        if (!hasAccess) {

            throw new AppError(
                "Forbidden.",
                403
            );

        }


        return true;

    }


    // ==================================================
    // Get Complex IDs accessible to user
    // ==================================================

    async getAccessibleComplexIds(user) {

        const currentUser =
            await this.getCurrentUser(user);


        // ------------------------------------------
        // User must be ACTIVE
        // ------------------------------------------

        if (currentUser.status !== "ACTIVE") {

            return [];

        }


        // ------------------------------------------
        // ADMIN has access to all Complexes
        // ------------------------------------------

        if (currentUser.role === "ADMIN") {

            return null;

        }


        // ------------------------------------------
        // MANAGER gets assigned Complex IDs
        // ------------------------------------------

        if (currentUser.role === "MANAGER") {

            const assignments =
                await complexManagerRepository
                    .findByUserId(
                        currentUser.id
                    );


            return assignments.map(
                assignment =>
                    assignment.complex.id
            );

        }


        // ------------------------------------------
        // USER has no Complex-wide access
        // ------------------------------------------

        return [];

    }

}


module.exports = new AccessService();