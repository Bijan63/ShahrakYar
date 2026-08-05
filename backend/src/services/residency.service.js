const residencyRepository = require("../repositories/residency.repository");


// Create Residency
const createResidency = async (data) => {

    return await residencyRepository.createResidency(data);

};


// Get All
const getResidencies = async () => {

    return await residencyRepository.getResidencies();

};


// Get By ID
const getResidencyById = async (id) => {

    return await residencyRepository.getResidencyById(id);

};


// Update
const updateResidency = async (id, data) => {

    return await residencyRepository.updateResidency(
        id,
        data
    );

};


// Delete
const deleteResidency = async (id) => {

    return await residencyRepository.deleteResidency(id);

};


module.exports = {

    createResidency,
    getResidencies,
    getResidencyById,
    updateResidency,
    deleteResidency

};