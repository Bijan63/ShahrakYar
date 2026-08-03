const AppError = require("../utils/AppError");

const complexRepository = require("../repositories/complex.repository");


class ComplexService {


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



    async getComplexes() {

        return complexRepository.findAll();

    }



    async getComplexById(id) {


        const complex = await complexRepository.findById(
            Number(id)
        );


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complex;

    }



    async updateComplex(id, data) {


        const complex =
            await complexRepository.findById(
                Number(id)
            );


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complexRepository.update(
            Number(id),
            data
        );

    }



    async deleteComplex(id) {


        const complex =
            await complexRepository.findById(
                Number(id)
            );


        if (!complex) {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        return complexRepository.delete(
            Number(id)
        );

    }


}


module.exports = new ComplexService();