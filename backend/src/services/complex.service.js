const AppError = require("../utils/AppError");

const complexRepository =
    require("../repositories/complex.repository");

const complexManagerRepository =
    require("../repositories/complexManager.repository");

const accessService =
    require("./access.service");


class ComplexService {

    // ==================================================
    // Create Complex
    // ==================================================

    async createComplex(data) {

        const {
            name,
            address,
            description
        } = data;


        if (!name) {

            throw new AppError(
                "Complex name is required.",
                400
            );

        }


        return complexRepository.create({

            name,

            address,

            description

        });

    }


    // ==================================================
    // Get All Accessible Complexes
    // ==================================================

    async getComplexes(user) {

        const accessibleComplexIds =
            await accessService
                .getAccessibleComplexIds(user);


        // ------------------------------------------
        // ADMIN
        // ------------------------------------------

        if (accessibleComplexIds === null) {

            return complexRepository.findAll();

        }


        // ------------------------------------------
        // USER
        // ------------------------------------------

        if (
            accessibleComplexIds.length === 0
        ) {

            return [];

        }


        // ------------------------------------------
        // MANAGER
        // ------------------------------------------

        const assignments =
            await Promise.all(

                accessibleComplexIds.map(
                    async (complexId) => {

                        return complexRepository
                            .findById(complexId);

                    }
                )

            );


        return assignments.filter(Boolean);

    }


    // ==================================================
    // Get Complex By ID
    // ==================================================

    async getComplexById(
        id,
        user
    ) {

        // ------------------------------------------
        // Check Complex-level access
        // ------------------------------------------

        await accessService
            .requireComplexAccess(
                user,
                id
            );


        // ------------------------------------------
        // Fetch Complex
        // ------------------------------------------

        const complex =
            await complexRepository.findById(id);


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complex;

    }


    // ==================================================
    // Update Complex
    // ==================================================

    async updateComplex(
        id,
        data,

    ) {

        const complex =
        await complexRepository.findById(id);


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complexRepository.update(
            id,
            data
        );

    }


    async deleteComplex(
        id,
        user
    ) {

        const complex =
        await complexRepository.findById(id);


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        await accessService.requireComplexAccess(
            user,
            id
        );


        return complexRepository.delete(id);

    }

    // ==================================================
    // Get Managers Of Complex
    // ==================================================

    async getManagers(complexId) {

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


        return complexManagerRepository
            .findByComplexId(complexId);

    }

}


module.exports = new ComplexService();