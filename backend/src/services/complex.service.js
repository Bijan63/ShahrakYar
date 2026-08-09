const AppError = require("../utils/AppError");

const complexRepository = require("../repositories/complex.repository");


class ComplexService {

    // =====================
    // Create Complex
    // =====================

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


    // =====================
    // Get All Complexes
    // =====================

    async getComplexes() {

        return complexRepository.findAll();

    }


    // =====================
    // Get Complex By ID
    // =====================

    async getComplexById(id) {

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


    // =====================
    // Update Complex
    // =====================

    async updateComplex(id, data) {

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


    // =====================
    // Delete Complex
    // =====================

    async deleteComplex(id) {

        const complex =
            await complexRepository.findById(id);


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complexRepository.delete(id);

    }

}


module.exports = new ComplexService();