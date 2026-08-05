const ownershipRepository = require("../repositories/ownership.repository");


// Create Ownership
const createOwnership = async (data) => {

    return await ownershipRepository.createOwnership(data);

};


// Get All Ownerships
const getOwnerships = async () => {

    return await ownershipRepository.getOwnerships();

};


// Get Ownership By ID
const getOwnershipById = async (id) => {

    return await ownershipRepository.getOwnershipById(id);

};


// Update Ownership
const updateOwnership = async (id, data) => {

    return await ownershipRepository.updateOwnership(
        id,
        data
    );

};


// Delete Ownership
const deleteOwnership = async (id) => {

    return await ownershipRepository.deleteOwnership(id);

};



module.exports = {

    createOwnership,

    getOwnerships,

    getOwnershipById,

    updateOwnership,

    deleteOwnership

};