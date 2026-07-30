const residentService = require("../services/resident.service");

const createResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.createResident(req.body);

        return res.status(201).json({

            success: true,

            resident

        });

    } catch (err) {

        next(err);

    }

};

const getResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.getResidentById(
                Number(req.params.id)
            );

        return res.status(200).json({

            success: true,

            resident

        });

    } catch (err) {

        next(err);

    }

};

const getResidents = async (req, res, next) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 20;

        const residents =
            await residentService.getResidents(
                page,
                limit
            );

        return res.status(200).json({

            success: true,

            ...residents

        });

    } catch (err) {

        next(err);

    }

};

const searchResidents = async (req, res, next) => {

    try {

        const keyword =
            req.query.search || "";

        const residents =
            await residentService.searchResidents(
                keyword
            );

        return res.status(200).json({

            success: true,

            residents

        });

    } catch (err) {

        next(err);

    }

};

const updateResident = async (req, res, next) => {

    try {

        const resident =
            await residentService.updateResident(

                Number(req.params.id),

                req.body

            );

        return res.status(200).json({

            success: true,

            resident

        });

    } catch (err) {

        next(err);

    }

};

const deleteResident = async (req, res, next) => {

    try {

        const result =
            await residentService.deleteResident(

                Number(req.params.id)

            );

        return res.status(200).json(result);

    } catch (err) {

        next(err);

    }

};

module.exports = {

    createResident,

    getResident,

    getResidents,

    searchResidents,

    updateResident,

    deleteResident

};