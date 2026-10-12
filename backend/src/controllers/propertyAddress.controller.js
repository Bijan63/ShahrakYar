const propertyAddressService =
    require("../services/propertyAddress.service");

const ResponseHelper =
    require("../helpers/response.helper");


// =====================
// Create Property Address
// =====================

const createPropertyAddress = async (req, res, next) => {

    try {

        const address =
            await propertyAddressService.createPropertyAddress(
                req.body
            );

        ResponseHelper.created(
            res,
            "Property address created successfully",
            address
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Get All Property Addresses
// =====================

const getPropertyAddresses = async (req, res, next) => {

    try {

        const addresses =
            await propertyAddressService.getPropertyAddresses();

        ResponseHelper.success(
            res,
            "Property addresses fetched successfully",
            addresses
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Get Property Address By ID
// =====================

const getPropertyAddressById = async (req, res, next) => {

    try {

        const address =
            await propertyAddressService.getPropertyAddressById(
                req.params.id
            );

        ResponseHelper.success(
            res,
            "Property address fetched successfully",
            address
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Get Addresses By Property
// =====================

const getAddressesByProperty = async (req, res, next) => {

    try {

        const addresses =
            await propertyAddressService.getAddressesByProperty(
                req.params.propertyId
            );

        ResponseHelper.success(
            res,
            "Property addresses fetched successfully",
            addresses
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Update Property Address
// =====================

const updatePropertyAddress = async (req, res, next) => {

    try {

        const address =
            await propertyAddressService.updatePropertyAddress(
                req.params.id,
                req.body
            );

        ResponseHelper.success(
            res,
            "Property address updated successfully",
            address
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Delete Property Address
// =====================

const deletePropertyAddress = async (req, res, next) => {

    try {

        await propertyAddressService.deletePropertyAddress(
            req.params.id
        );

        ResponseHelper.success(
            res,
            "Property address deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};


// =====================
// Export
// =====================

module.exports = {

    createPropertyAddress,

    getPropertyAddresses,

    getPropertyAddressById,

    getAddressesByProperty,

    updatePropertyAddress,

    deletePropertyAddress

};