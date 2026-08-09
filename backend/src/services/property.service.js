const propertyRepository = require("../repositories/property.repository");


// Create
const createProperty = async (data) => {

    return await propertyRepository.createProperty(data);

};


// Get All
const getProperties = async () => {

    return await propertyRepository.getProperties();

};


// Get One
const getPropertyById = async (id) => {

    return await propertyRepository.getPropertyById(id);

};


// Update
const updateProperty = async (id, data) => {

    return await propertyRepository.updateProperty(
        id,
        data
    );

};


// Delete
const deleteProperty = async (id) => {

    return await propertyRepository.deleteProperty(id);

};


// Search
const searchProperties = async (q) => {

    return await propertyRepository.searchProperties(q);

};
// Get Property Detail
const getPropertyDetail = async (id) => {

    return await propertyRepository.getPropertyDetail(id);

};

const getPropertyOwners = async (id) => {

    return await propertyRepository.getPropertyOwners(id);

};


// Get Property Residents
const getPropertyResidents = async (id) => {

    return await propertyRepository.getPropertyResidents(id);

};


module.exports = {

    createProperty,

    getProperties,

    getPropertyById,

    updateProperty,

    deleteProperty,

    searchProperties,

    getPropertyDetail,

    getPropertyOwners,

    getPropertyResidents

};