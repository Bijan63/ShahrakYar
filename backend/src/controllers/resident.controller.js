const residentService = require("../services/resident.service");

const createResident = async (req, res, next) => {

    try {

        const resident = await residentService.createResident(
            req.body
        );

        return res.status(201).json({

            success: true,
            resident

        });

    } catch (err) {

        next(err);

    }

};

module.exports = {
    createResident
};
