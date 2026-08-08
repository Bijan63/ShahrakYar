const propertyService = require("../services/property.service");
const {
    propertyMapper
} = require("../mappers/property.mapper");
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

        const properties = await propertyService.getProperties();


        ResponseHelper.success(
            res,
            "Properties fetched successfully",
            properties.map(propertyMapper)
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
// Search Properties
const searchProperties = async (req, res, next) => {

    try {

         console.log("SEARCH CONTROLLER:", req.query.q);

        const properties = await propertyService.searchProperties(
            req.query.q
        );


        ResponseHelper.success(
            res,
            "Properties searched successfully",
            properties.map(propertyMapper)
        );


    } catch (error) {

        next(error);

    }

};
// Get Property Full Detail
const getPropertyDetail = async (req, res, next) => {

    try {

        const property =
            await propertyService.getPropertyDetail(
                req.params.id
            );


        ResponseHelper.success(
            res,
            "Property detail fetched successfully",
            propertyMapper(property)
        );


    } catch(error) {

        next(error);

    }

};

const getPropertyOwners = async (req, res, next) => {

    try {

        const property =
            await propertyService.getPropertyOwners(
                req.params.id
            );

        ResponseHelper.success(
            res,
            "Property owners fetched successfully",
            property
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
    deleteProperty,
    searchProperties,
    getPropertyDetail,
    getPropertyOwners
};