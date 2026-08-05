const propertyRepository = require("../repositories/property.repository");


// Create
const createProperty = async(data)=>{

    return await propertyRepository.createProperty(data);

};


// Get All
const getProperties = async()=>{

    return await propertyRepository.getProperties();

};


// Get One
const getPropertyById = async(id)=>{

    return await propertyRepository.getPropertyById(id);

};


// Update
const updateProperty = async(id,data)=>{

    return await propertyRepository.updateProperty(id,data);

};


// Delete
const deleteProperty = async(id)=>{

    return await propertyRepository.deleteProperty(id);

};



module.exports = {

    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty

};