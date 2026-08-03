const complexService = require("../services/complex.service");


const createComplex = async (req, res, next) => {

    try {

        const complex =
            await complexService.createComplex(
                req.body
            );


        return res.status(201).json({

            success: true,

            complex

        });


    } catch (err) {

        next(err);

    }

};



const getComplexes = async (req, res, next) => {

    try {

        const complexes =
            await complexService.getComplexes();


        return res.json({

            success: true,

            complexes

        });


    } catch (err) {

        next(err);

    }

};



const getComplexById = async (req, res, next) => {

    try {

        const complex =
            await complexService.getComplexById(
                req.params.id
            );


        return res.json({

            success: true,

            complex

        });


    } catch (err) {

        next(err);

    }

};



const updateComplex = async (req, res, next) => {

    try {

        const complex =
            await complexService.updateComplex(
                req.params.id,
                req.body
            );


        return res.json({

            success: true,

            complex

        });


    } catch (err) {

        next(err);

    }

};



const deleteComplex = async (req, res, next) => {

    try {

        const result =
            await complexService.deleteComplex(
                req.params.id
            );


        return res.json({

            success: true,

            result

        });


    } catch (err) {

        next(err);

    }

};



module.exports = {

    createComplex,

    getComplexes,

    getComplexById,

    updateComplex,

    deleteComplex

};