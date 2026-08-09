const residencyRepository = require("../repositories/residency.repository");
const residencyMapper = require("../mappers/residency.mapper");

// =====================
// Create Residency
// =====================

const createResidency = async (data) => {

    const residency =
        await residencyRepository.createResidency(data);

    return residencyMapper.toResponse(residency);

};

// =====================
// Get All Residencies
// =====================

const getResidencies = async () => {

    const residencies =
        await residencyRepository.getResidencies();

    return residencies.map(residencyMapper.toResponse);

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

    return await residencyRepository.deleteResidency(id);

};

// =====================
// Get Residents By Property
// =====================

const getResidentsByProperty = async (propertyId) => {

    const residencies =
        await residencyRepository.getResidentsByProperty(
            propertyId
        );

    return residencies.map(residencyMapper.toResponse);

};

module.exports = {

    createResidency,

    getResidencies,

    getResidencyById,

    updateResidency,

    deleteResidency,

    getResidentsByProperty

};
