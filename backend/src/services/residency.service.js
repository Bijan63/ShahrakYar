const AppError = require("../utils/AppError");
const residencyRepository =
    require("../repositories/residency.repository");
const personRepository =
    require("../repositories/person.repository");
const propertyRepository =
    require("../repositories/property.repository");
const residencyMapper =
    require("../mappers/residency.mapper");
const accessService =
    require("./access.service");


// =====================
// Residency Types
// =====================

const VALID_RESIDENCY_TYPES = [
    "OWNER",
    "TENANT",
    "FAMILY"
];


// =====================
// Date Helpers
// =====================

const parseDate = (value, fieldName) => {

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {

        throw new AppError(
            `Invalid ${fieldName}.`,
            400
        );

    }

    return parsedDate;

};


const validateDateRange = (
    startDate,
    endDate
) => {

    if (
        startDate &&
        endDate &&
        endDate <= startDate
    ) {

        throw new AppError(
            "endDate must be later than startDate.",
            400
        );

    }

};


// =====================
// Create Residency
// =====================

const createResidency = async (
    user,
    data = {}
) => {

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

    if (
        !propertyId ||
        !personId ||
        !type
    ) {

        throw new AppError(
            "propertyId, personId and type are required.",
            400
        );

    }


    // ---------------------
    // Validate Type
    // ---------------------

    if (!VALID_RESIDENCY_TYPES.includes(type)) {

        throw new AppError(
            "Invalid residency type.",
            400
        );

    }


    // ---------------------
    // Check Property + Access
    // ---------------------

    const property =
        await propertyRepository.findById(
            propertyId
        );


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        property.complexId
    );


    // ---------------------
    // Check Person
    // ---------------------

    const person =
        await personRepository.getPersonById(
            personId
        );


    if (!person) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    // ---------------------
    // Prepare Data
    // ---------------------

    const residencyData = {
        propertyId,
        personId,
        type
    };


    // ---------------------
    // Start Date
    // ---------------------

    let parsedStartDate;


    if (startDate !== undefined) {

        parsedStartDate =
            parseDate(
                startDate,
                "startDate"
            );

        residencyData.startDate =
            parsedStartDate;

    } else {

        // Prisma may provide the persisted default.
        // We still use now() for overlap validation.
        parsedStartDate = new Date();

    }


    // ---------------------
    // End Date
    // ---------------------

    let parsedEndDate = null;


    if (endDate !== undefined) {

        if (endDate === null) {

            parsedEndDate = null;
            residencyData.endDate = null;

        } else {

            parsedEndDate =
                parseDate(
                    endDate,
                    "endDate"
                );

            residencyData.endDate =
                parsedEndDate;

        }

    }


    validateDateRange(
        parsedStartDate,
        parsedEndDate
    );


    // ---------------------
    // Person Residency Overlap
    // ---------------------

    const overlappingResidency =
        await residencyRepository.findOverlappingResidency({
            id: null,
            propertyId,
            personId,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            complexIds: [property.complexId]
        });


    if (overlappingResidency) {

        if (overlappingResidency.endDate === null) {

            throw new AppError(
                "This person already has an active residency for this property.",
                409
            );

        }

        throw new AppError(
            "This residency period overlaps with an existing residency for this property and person.",
            409
        );

    }


    // ---------------------
    // Tenant Overlap
    // ---------------------

    if (type === "TENANT") {

        const overlappingTenant =
            await residencyRepository.findOverlappingTenant({
                id: null,
                propertyId,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                complexIds: [property.complexId]
            });


        if (overlappingTenant) {

            if (overlappingTenant.endDate === null) {

                throw new AppError(
                    "This property already has an active tenant.",
                    409
                );

            }

            throw new AppError(
                "This tenant residency period overlaps with another tenant for this property.",
                409
            );

        }

    }


    // ---------------------
    // Create
    // ---------------------

    const residency =
        await residencyRepository.createResidency(
            residencyData
        );


    return residencyMapper.toResponse(
        residency
    );

};


// =====================
// Get All Residencies
// =====================

const getResidencies = async (user) => {

    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );

    const residencies =
        await residencyRepository.getResidencies(
            complexIds
        );


    return residencies.map(
        residencyMapper.toResponse
    );

};


// =====================
// Get Residency By ID
// =====================

const getResidencyById = async (
    user,
    id
) => {

    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );

    const residency =
        await residencyRepository.getResidencyById(
            id,
            complexIds
        );


    if (!residency) {

        throw new AppError(
            "Residency not found.",
            404
        );

    }


    return residencyMapper.toResponse(
        residency
    );

};


// =====================
// Update Residency
// =====================

const updateResidency = async (
    user,
    id,
    data = {}
) => {

    if (!id) {

        throw new AppError(
            "id is required.",
            400
        );

    }


    if (
        !data ||
        Object.keys(data).length === 0
    ) {

        throw new AppError(
            "Residency update data is required.",
            400
        );

    }

    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );

    const existingResidency =
        await residencyRepository.getResidencyById(
            id,
            complexIds
        );


    if (!existingResidency) {

        throw new AppError(
            "Residency not found.",
            404
        );

    }


    // ---------------------
    // Validate Type
    // ---------------------

    if (
        data.type !== undefined &&
        !VALID_RESIDENCY_TYPES.includes(
            data.type
        )
    ) {

        throw new AppError(
            "Invalid residency type.",
            400
        );

    }


    // ---------------------
    // Effective Property
    // ---------------------

    let effectiveProperty =
        existingResidency.property;


    if (data.propertyId !== undefined) {

        if (!data.propertyId) {

            throw new AppError(
                "propertyId cannot be empty.",
                400
            );

        }

        effectiveProperty =
            await propertyRepository.findById(
                data.propertyId
            );


        if (!effectiveProperty) {

            throw new AppError(
                "Property not found.",
                404
            );

        }


        await accessService.requireComplexAccess(
            user,
            effectiveProperty.complexId
        );

    }


    // ---------------------
    // Validate Person
    // ---------------------

    const effectivePersonId =
        data.personId !== undefined
            ? data.personId
            : existingResidency.personId;


    if (data.personId !== undefined) {

        if (!data.personId) {

            throw new AppError(
                "personId cannot be empty.",
                400
            );

        }

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
    // Prepare Update Data
    // ---------------------

    const updateData = {};


    if (data.propertyId !== undefined) {
        updateData.propertyId = data.propertyId;
    }

    if (data.personId !== undefined) {
        updateData.personId = data.personId;
    }

    if (data.type !== undefined) {
        updateData.type = data.type;
    }


    // ---------------------
    // Validate Start Date
    // ---------------------

    let parsedStartDate;


    if (data.startDate !== undefined) {

        if (data.startDate === null) {

            throw new AppError(
                "startDate cannot be null.",
                400
            );

        }

        parsedStartDate =
            parseDate(
                data.startDate,
                "startDate"
            );

        updateData.startDate =
            parsedStartDate;

    } else {

        parsedStartDate =
            existingResidency.startDate;

    }


    // ---------------------
    // Validate End Date
    // ---------------------

    let parsedEndDate;


    if (data.endDate !== undefined) {

        if (data.endDate === null) {

            parsedEndDate = null;
            updateData.endDate = null;

        } else {

            parsedEndDate =
                parseDate(
                    data.endDate,
                    "endDate"
                );

            updateData.endDate =
                parsedEndDate;

        }

    } else {

        parsedEndDate =
            existingResidency.endDate;

    }


    validateDateRange(
        parsedStartDate,
        parsedEndDate
    );


    // ---------------------
    // Effective Type
    // ---------------------

    const effectiveType =
        data.type !== undefined
            ? data.type
            : existingResidency.type;


    // ---------------------
    // Person Residency Overlap
    // ---------------------

    const overlappingResidency =
        await residencyRepository.findOverlappingResidency({
            id,
            propertyId: effectiveProperty.id,
            personId: effectivePersonId,
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            complexIds: [effectiveProperty.complexId]
        });


    if (overlappingResidency) {

        if (overlappingResidency.endDate === null) {

            throw new AppError(
                "This person already has another active residency for this property.",
                409
            );

        }

        throw new AppError(
            "This residency period overlaps with another residency for this property and person.",
            409
        );

    }


    // ---------------------
    // Tenant Overlap
    // ---------------------

    if (effectiveType === "TENANT") {

        const overlappingTenant =
            await residencyRepository.findOverlappingTenant({
                id,
                propertyId: effectiveProperty.id,
                startDate: parsedStartDate,
                endDate: parsedEndDate,
                complexIds: [effectiveProperty.complexId]
            });


        if (overlappingTenant) {

            if (overlappingTenant.endDate === null) {

                throw new AppError(
                    "This property already has an active tenant.",
                    409
                );

            }

            throw new AppError(
                "This tenant residency period overlaps with another tenant for this property.",
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
            updateData
        );


    return residencyMapper.toResponse(
        residency
    );

};


// =====================
// Delete Residency
// =====================

const deleteResidency = async (
    user,
    id
) => {

    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );

    const existingResidency =
        await residencyRepository.getResidencyById(
            id,
            complexIds
        );


    if (!existingResidency) {

        throw new AppError(
            "Residency not found.",
            404
        );

    }


    return residencyRepository.deleteResidency(
        id
    );

};


// =====================
// Get Active Residents By Property
// =====================

const getResidentsByProperty = async (
    user,
    propertyId
) => {

    const property =
        await propertyRepository.findById(
            propertyId
        );


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        property.complexId
    );


    const residencies =
        await residencyRepository.getResidentsByProperty(
            propertyId,
            [property.complexId]
        );


    return residencies.map(
        residencyMapper.toResponse
    );

};


// =====================
// Export
// =====================

module.exports = {
    createResidency,
    getResidencies,
    getResidencyById,
    updateResidency,
    deleteResidency,
    getResidentsByProperty
};
