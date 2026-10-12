const propertyService =
    require("../services/property.service");

const {
    propertyMapper
} = require("../mappers/property.mapper");

const ResponseHelper =
    require("../helpers/response.helper");


// ==================================================
// Create Property
// ==================================================

const createProperty = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.createProperty(
                req.body,
                req.user
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


// ==================================================
// Get All Properties
// ==================================================

const getProperties = async (
    req,
    res,
    next
) => {

    try {

        const properties =
            await propertyService.getProperties(
                req.user
            );


        ResponseHelper.success(
            res,
            "Properties fetched successfully",
            properties.map(propertyMapper)
        );

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Get Property By ID
// ==================================================

const getPropertyById = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.getPropertyById(
                req.params.id,
                req.user
            );


        ResponseHelper.success(
            res,
            "Property fetched successfully",
            propertyMapper(property)
        );

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Update Property
// ==================================================

const updateProperty = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.updateProperty(
                req.params.id,
                req.body,
                req.user
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


// ==================================================
// Delete Property
// ==================================================

const deleteProperty = async (
    req,
    res,
    next
) => {

    try {

        await propertyService.deleteProperty(
            req.params.id,
            req.user
        );


        ResponseHelper.success(
            res,
            "Property deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Search Properties
// ==================================================

const searchProperties = async (
    req,
    res,
    next
) => {

    try {

        const properties =
            await propertyService.searchProperties(
                req.query.q,
                req.user
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


// ==================================================
// Get Property Full Detail
// ==================================================

const getPropertyDetail = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.getPropertyDetail(
                req.params.id,
                req.user
            );


        ResponseHelper.success(
            res,
            "Property detail fetched successfully",
            propertyMapper(property)
        );

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Get Property Owners
// ==================================================

const getPropertyOwners = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.getPropertyOwners(
                req.params.id,
                req.user
            );


        ResponseHelper.success(
            res,
            "Property owners fetched successfully",
            propertyMapper(property)
        );

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Get Property Residents
// ==================================================

const getPropertyResidents = async (
    req,
    res,
    next
) => {

    try {

        const property =
            await propertyService.getPropertyResidents(
                req.params.id,
                req.user
            );


        ResponseHelper.success(
            res,
            "Property residents fetched successfully",
            propertyMapper(property)
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

    getPropertyOwners,

    getPropertyResidents

};