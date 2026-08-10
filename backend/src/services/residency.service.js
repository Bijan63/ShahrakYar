const AppError = require("../utils/AppError");

const residencyRepository = require("../repositories/residency.repository");

const personRepository = require("../repositories/person.repository");

const propertyRepository = require("../repositories/property.repository");

const residencyMapper = require("../mappers/residency.mapper");

const prisma = require("../config/prisma");

// =====================
// Create Residency
// =====================

const createResidency = async (data) => {

    const {
        propertyId,
        personId,
        type,
        startDate,
        endDate
    } = data;


    // ---------------------
    // Required fields
    // ---------------------

    if (!propertyId || !personId || !type) {

        throw new AppError(
            "propertyId, personId and type are required.",
            400
        );

    }


    // ---------------------
    // Check Property
    // ---------------------

    const property =
        await propertyRepository.findById(propertyId);


    if (!property) {

        throw new AppError(
            "Property not found.",
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


    // ---------------------
    // Check duplicate active residency
    // ---------------------

    const existingResidency =
        await prisma.residency.findFirst({

            where: {

                propertyId,

                personId,

                endDate: null

            }

        });


    if (existingResidency) {

        throw new AppError(
            "This person already has an active residency for this property.",
            409
        );

    }


    // ---------------------
    // Prepare data
    // ---------------------

    const residencyData = {

        propertyId,

        personId,

        type

    };


    if (startDate) {

        const parsedStartDate =
            new Date(startDate);


        if (Number.isNaN(parsedStartDate.getTime())) {

            throw new AppError(
                "Invalid startDate.",
                400
            );

        }


        residencyData.startDate =
            parsedStartDate;

    }


    if (endDate) {

        const parsedEndDate =
            new Date(endDate);


        if (Number.isNaN(parsedEndDate.getTime())) {

            throw new AppError(
                "Invalid endDate.",
                400
            );

        }


        residencyData.endDate =
            parsedEndDate;

    }


    // ---------------------
    // Validate date range
    // ---------------------

    if (
        residencyData.startDate &&
        residencyData.endDate &&
        residencyData.endDate < residencyData.startDate
    ) {

        throw new AppError(
            "endDate cannot be earlier than startDate.",
            400
        );

    }


    // ---------------------
    // Create
    // ---------------------

    const residency =
        await residencyRepository.createResidency(
            residencyData
        );


    return residencyMapper.toResponse(residency);

};


// =====================
// Get All Residencies
// =====================

const getResidencies = async () => {

    const residencies =
        await residencyRepository.getResidencies();


    return residencies.map(
        residencyMapper.toResponse
    );

};


// =====================
// Get Residency By ID
// =====================

const getResidencyById = async (id) => {

    const residency =
        await residencyRepository.getResidencyById(id);


    if (!residency) {

        return null;

    }


    return residencyMapper.toResponse(residency);

};


// =====================
// Update Residency
// =====================

const updateResidency = async (id, data) => {

    const existingResidency =
        await residencyRepository.getResidencyById(id);


    if (!existingResidency) {

        throw new AppError(
            "Residency not found.",
            404
        );

    }


    // ---------------------
    // Validate Property
    // ---------------------

    if (data.propertyId) {

        const property =
            await propertyRepository.findById(
                data.propertyId
            );


        if (!property) {

            throw new AppError(
                "Property not found.",
                404
            );

        }

    }


    // ---------------------
    // Validate Person
    // ---------------------

    if (data.personId) {

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

    }


    // ---------------------
    // Validate startDate
    // ---------------------

    if (data.startDate) {

        const parsedStartDate =
            new Date(data.startDate);


        if (Number.isNaN(parsedStartDate.getTime())) {

            throw new AppError(
                "Invalid startDate.",
                400
            );

        }


        data.startDate =
            parsedStartDate;

    }


    // ---------------------
    // Validate endDate
    // ---------------------

    if (data.endDate) {

        const parsedEndDate =
            new Date(data.endDate);


        if (Number.isNaN(parsedEndDate.getTime())) {

            throw new AppError(
                "Invalid endDate.",
                400
            );

        }


        data.endDate =
            parsedEndDate;

    }


    // ---------------------
    // Validate date range
    // ---------------------

    const effectiveStartDate =
        data.startDate ||
        existingResidency.startDate;


    const effectiveEndDate =
        data.endDate ||
        existingResidency.endDate;


    if (
        effectiveStartDate &&
        effectiveEndDate &&
        effectiveEndDate < effectiveStartDate
    ) {

        throw new AppError(
            "endDate cannot be earlier than startDate.",
            400
        );

    }


    // ---------------------
    // Check duplicate active residency
    // ---------------------

    const propertyId =
        data.propertyId ||
        existingResidency.propertyId;


    const personId =
        data.personId ||
        existingResidency.personId;


    const endDate =
        data.endDate !== undefined
            ? data.endDate
            : existingResidency.endDate;


    if (endDate === null) {

        const duplicateResidency =
            await prisma.residency.findFirst({

                where: {

                    propertyId,

                    personId,

                    endDate: null,

                    NOT: {

                        id

                    }

                }

            });


        if (duplicateResidency) {

            throw new AppError(
                "This person already has another active residency for this property.",
                409
            );

        }

    }


    // ---------------------
    // Update
    // ---------------------

    const residency =
        await residencyRepository.updateResidency(
            id,
            data
        );


    return residencyMapper.toResponse(residency);

};


// =====================
// Delete Residency
// =====================

const deleteResidency = async (id) => {

    const existingResidency =
        await residencyRepository.getResidencyById(id);


    if (!existingResidency) {

        throw new AppError(
            "Residency not found.",
            404
        );

    }


    return await residencyRepository.deleteResidency(id);

};


// =====================
// Get Residents By Property
// =====================

const getResidentsByProperty = async (propertyId) => {

    const property =
        await propertyRepository.findById(propertyId);


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    const residencies =
        await residencyRepository.getResidentsByProperty(
            propertyId
        );


    return residencies.map(
        residencyMapper.toResponse
    );

};


module.exports = {

    createResidency,

    getResidencies,

    getResidencyById,

    updateResidency,

    deleteResidency,

    getResidentsByProperty

};