const AppError = require("../utils/AppError");

const propertyAddressRepository =
    require("../repositories/propertyAddress.repository");

const propertyRepository =
    require("../repositories/property.repository");


// =====================
// Create Property Address
// =====================

const createPropertyAddress = async (data) => {

    const {
        propertyId,
        mainStreet,
        subStreet,
        alley,
        number,
        description
    } = data;


    // =====================
    // Validate Property ID
    // =====================

    if (!propertyId) {

        throw new AppError(
            "propertyId is required.",
            400
        );

    }


    // =====================
    // Validate Property
    // =====================

    const property =
        await propertyRepository.getPropertyById(
            propertyId
        );


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    // =====================
    // Check Existing Address
    // =====================

    const existingAddress =
        await propertyAddressRepository.getPropertyAddressByPropertyId(
            propertyId
        );


    if (existingAddress) {

        throw new AppError(
            "Property already has an address.",
            409
        );

    }


    // =====================
    // Prepare Data
    // =====================

    const addressData = {

        propertyId,

        mainStreet,

        subStreet,

        alley,

        number,

        description

    };


    // =====================
    // Create
    // =====================

    return await propertyAddressRepository.createPropertyAddress(
        addressData
    );

};


// =====================
// Get All Property Addresses
// =====================

const getPropertyAddresses = async () => {

    return await propertyAddressRepository.getPropertyAddresses();

};


// =====================
// Get Property Address By ID
// =====================

const getPropertyAddressById = async (id) => {

    const address =
        await propertyAddressRepository.getPropertyAddressById(
            id
        );


    if (!address) {

        throw new AppError(
            "Property address not found.",
            404
        );

    }


    return address;

};


// =====================
// Get Addresses By Property
// =====================

const getAddressesByProperty = async (propertyId) => {


    // =====================
    // Validate Property ID
    // =====================

    if (!propertyId) {

        throw new AppError(
            "propertyId is required.",
            400
        );

    }


    // =====================
    // Validate Property
    // =====================

    const property =
        await propertyRepository.getPropertyById(
            propertyId
        );


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    // =====================
    // Get Addresses
    // =====================

    return await propertyAddressRepository.getAddressesByProperty(
        propertyId
    );

};


// =====================
// Update Property Address
// =====================

const updatePropertyAddress = async (
    id,
    data
) => {


    // =====================
    // Check Address
    // =====================

    const existingAddress =
        await propertyAddressRepository.getPropertyAddressById(
            id
        );


    if (!existingAddress) {

        throw new AppError(
            "Property address not found.",
            404
        );

    }


    // =====================
    // Validate Property
    // =====================

    if (data.propertyId !== undefined) {

        if (!data.propertyId) {

            throw new AppError(
                "propertyId cannot be empty.",
                400
            );

        }


        const property =
            await propertyRepository.getPropertyById(
                data.propertyId
            );


        if (!property) {

            throw new AppError(
                "Property not found.",
                404
            );

        }


        // =====================
        // Check Property Address Conflict
        // =====================

        if (
            data.propertyId !== existingAddress.propertyId
        ) {

            const targetAddress =
                await propertyAddressRepository
                    .getPropertyAddressByPropertyId(
                        data.propertyId
                    );


            if (targetAddress) {

                throw new AppError(
                    "Property already has an address.",
                    409
                );

            }

        }

    }


    // =====================
    // Prepare Update Data
    // =====================

    const updateData = {

        ...data

    };


    // =====================
    // Update
    // =====================

    return await propertyAddressRepository.updatePropertyAddress(
        id,
        updateData
    );

};


// =====================
// Delete Property Address
// =====================

const deletePropertyAddress = async (id) => {


    // =====================
    // Check Address
    // =====================

    const existingAddress =
        await propertyAddressRepository.getPropertyAddressById(
            id
        );


    if (!existingAddress) {

        throw new AppError(
            "Property address not found.",
            404
        );

    }


    // =====================
    // Delete
    // =====================

    return await propertyAddressRepository.deletePropertyAddress(
        id
    );

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