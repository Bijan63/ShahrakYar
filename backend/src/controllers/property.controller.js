const propertyService = require("../services/property.service");
const propertyDTO = require("../dto/property.dto");
const ResponseHelper = require("../helpers/response.helper");

// Create Property
const createProperty = async (req, res, next) => {

    try {

        const property = await propertyService.createProperty(
            req.body
        );

       ResponseHelper.created(
    res,
    "Property created successfully",
    property
);

    } catch (error) {

        next(error);

    }

};


// Get All Properties
const getProperties = async (req, res, next) => {

    try {

       ResponseHelper.success(
    res,
    "Properties fetched successfully",
    properties.map(propertyDTO)
);
    } catch (error) {

        next(error);

    }

};


// Get Property By ID
const getPropertyById = async (req, res, next) => {

    try {

        const property = await propertyService.getPropertyById(
            req.params.id
        );

       ResponseHelper.success(
    res,
    "Property fetched successfully",
    propertyDTO(property)
);

    } catch (error) {

        next(error);

    }

};


// Update Property
const updateProperty = async (req, res, next) => {

    try {

        const property = await propertyService.updateProperty(
            req.params.id,
            req.body
        );

        ResponseHelper.success(
    res,
    "Property updated successfully",
    property
);

    } catch (error) {

        next(error);

    }

};


// Delete Property
const deleteProperty = async (req, res, next) => {

    try {

        await propertyService.deleteProperty(
            req.params.id
        );

        ResponseHelper.success(
    res,
    "Property deleted successfully"
);

    } catch (error) {

        next(error);

    }

};


module.exports = {

    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty

};