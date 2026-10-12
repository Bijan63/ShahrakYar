const AppError =
    require("../utils/AppError");

const propertyRepository =
    require("../repositories/property.repository");

const accessService =
    require("./access.service");


// =====================
// Allowed Property Types
// =====================

const PROPERTY_TYPES = [
    "LAND",
    "VILLA",
    "APARTMENT",
    "COMMERCIAL"
];


// =====================
// Allowed Property Statuses
// =====================

const PROPERTY_STATUSES = [
    "VACANT",
    "BUILT",
    "UNDER_CONSTRUCTION",
    "INACTIVE"
];


// =====================
// Validate Property Type
// =====================

const validatePropertyType = (
    propertyType
) => {

    if (
        !PROPERTY_TYPES.includes(
            propertyType
        )
    ) {

        throw new AppError(
            `Invalid propertyType. Allowed values: ${PROPERTY_TYPES.join(", ")}.`,
            400
        );

    }

};


// =====================
// Validate Property Status
// =====================

const validatePropertyStatus = (
    status
) => {

    if (
        !PROPERTY_STATUSES.includes(
            status
        )
    ) {

        throw new AppError(
            `Invalid status. Allowed values: ${PROPERTY_STATUSES.join(", ")}.`,
            400
        );

    }

};


// =====================
// Validate Property Type + Status
// =====================

const validatePropertyTypeAndStatus = (
    propertyType,
    status
) => {

    // ---------------------
    // LAND
    // ---------------------

    if (
        propertyType === "LAND"
    ) {

        if (
            status !== "VACANT" &&
            status !== "INACTIVE"
        ) {

            throw new AppError(
                "LAND property can only have VACANT or INACTIVE status.",
                400
            );

        }

    }


    // ---------------------
    // Built Properties
    // ---------------------

    if (
        propertyType === "VILLA" ||
        propertyType === "APARTMENT" ||
        propertyType === "COMMERCIAL"
    ) {

        if (
            status === "VACANT"
        ) {

            throw new AppError(
                `${propertyType} property cannot have VACANT status. VACANT is reserved for empty land.`,
                400
            );

        }

    }

};


// =====================
// Validate Areas
// =====================

const validateAreas = (
    landArea,
    builtArea
) => {

    // ---------------------
    // Land Area
    // ---------------------

    if (
        landArea !== undefined &&
        landArea !== null
    ) {

        if (
            typeof landArea !== "number" ||
            !Number.isFinite(landArea)
        ) {

            throw new AppError(
                "landArea must be a valid number.",
                400
            );

        }


        if (
            landArea < 0
        ) {

            throw new AppError(
                "landArea cannot be negative.",
                400
            );

        }

    }


    // ---------------------
    // Built Area
    // ---------------------

    if (
        builtArea !== undefined &&
        builtArea !== null
    ) {

        if (
            typeof builtArea !== "number" ||
            !Number.isFinite(builtArea)
        ) {

            throw new AppError(
                "builtArea must be a valid number.",
                400
            );

        }


        if (
            builtArea < 0
        ) {

            throw new AppError(
                "builtArea cannot be negative.",
                400
            );

        }

    }


    // ---------------------
    // Built Area <= Land Area
    // ---------------------

    if (
        landArea !== undefined &&
        landArea !== null &&
        builtArea !== undefined &&
        builtArea !== null
    ) {

        if (
            builtArea > landArea
        ) {

            throw new AppError(
                "builtArea cannot be greater than landArea.",
                400
            );

        }

    }

};


// =====================
// Handle Prisma Errors
// =====================

const handlePropertyPersistenceError = (
    error
) => {

    if (
        error?.code === "P2002"
    ) {

        throw new AppError(
            "Property code already exists.",
            409
        );

    }


    throw error;

};


// =====================
// Filter Properties By Access
// =====================

const filterPropertiesByAccess = async (
    properties,
    user
) => {

    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // ADMIN can access everything

    if (
        user.role === "ADMIN"
    ) {

        return properties;

    }


    // MANAGER can access only assigned Complexes

    const accessibleComplexIds =
        await accessService.getAccessibleComplexIds(
            user
        );


    if (!accessibleComplexIds) {

        return properties;

    }


    return properties.filter(
        property =>
            accessibleComplexIds.includes(
                property.complexId
            )
    );

};


// =====================
// Check Property Access
// =====================

const requirePropertyAccess = async (
    property,
    user
) => {

    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        property.complexId
    );


    return true;

};


// =====================
// Create Property
// =====================

const createProperty = async (
    data,
    user
) => {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        throw new AppError(
            "Request body is required.",
            400
        );

    }


    const {

        complexId,

        code,

        propertyType,

        status,

        landArea,

        builtArea,

        description,

        registryNumber

    } = data;


    // ---------------------
    // Authentication
    // ---------------------

    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // ---------------------
    // Required Fields
    // ---------------------

    if (!complexId) {

        throw new AppError(
            "complexId is required.",
            400
        );

    }


    if (
        typeof code !== "string" ||
        !code.trim()
    ) {

        throw new AppError(
            "code is required.",
            400
        );

    }


    if (!propertyType) {

        throw new AppError(
            "propertyType is required.",
            400
        );

    }


    // ---------------------
    // User must have access
    // to target Complex
    // ---------------------

    await accessService.requireComplexAccess(
        user,
        complexId
    );


    // ---------------------
    // Normalize Enums
    // ---------------------

    const normalizedPropertyType =
        String(propertyType).toUpperCase();


    const normalizedStatus =
        status !== undefined &&
        status !== null
            ? String(status).toUpperCase()
            : "VACANT";


    // ---------------------
    // Validate Type
    // ---------------------

    validatePropertyType(
        normalizedPropertyType
    );


    // ---------------------
    // Validate Status
    // ---------------------

    validatePropertyStatus(
        normalizedStatus
    );


    // ---------------------
    // Validate Type + Status
    // ---------------------

    validatePropertyTypeAndStatus(
        normalizedPropertyType,
        normalizedStatus
    );


    // ---------------------
    // Validate Areas
    // ---------------------

    validateAreas(
        landArea,
        builtArea
    );


    // ---------------------
    // Prepare Data
    // ---------------------

    const propertyData = {

        complexId,

        code:
            String(code).trim(),

        propertyType:
            normalizedPropertyType,

        status:
            normalizedStatus,

        landArea,

        builtArea,

        description,

        registryNumber

    };


    // ---------------------
    // Create
    // ---------------------

    try {

        return await propertyRepository.createProperty(
            propertyData
        );

    }
    catch (error) {

        return handlePropertyPersistenceError(
            error
        );

    }

};


// =====================
// Get All Properties
// =====================

const getProperties = async (
    user
) => {

    const properties =
        await propertyRepository.getProperties();


    return filterPropertiesByAccess(
        properties,
        user
    );

};


// =====================
// Get Property By ID
// =====================

const getPropertyById = async (
    id,
    user
) => {

    const property =
        await propertyRepository.getPropertyById(
            id
        );


    await requirePropertyAccess(
        property,
        user
    );


    return property;

};


// =====================
// Update Property
// =====================

const updateProperty = async (
    id,
    data,
    user
) => {

    // ---------------------
    // Check Property
    // ---------------------

    const existingProperty =
        await propertyRepository.getPropertyById(
            id
        );


    await requirePropertyAccess(
        existingProperty,
        user
    );


    // ---------------------
    // Target Complex
    // ---------------------

    const targetComplexId =
        data.complexId !== undefined
            ? data.complexId
            : existingProperty.complexId;


    // ---------------------
    // Manager/Admin must have
    // access to target Complex
    // ---------------------

    await accessService.requireComplexAccess(
        user,
        targetComplexId
    );


    // ---------------------
    // Property Type
    // ---------------------

    const propertyType =
        data.propertyType !== undefined

            ? String(
                data.propertyType
            ).toUpperCase()

            : existingProperty.propertyType;


    // ---------------------
    // Status
    // ---------------------

    const status =
        data.status !== undefined

            ? String(
                data.status
            ).toUpperCase()

            : existingProperty.status;


    // ---------------------
    // Validate Type
    // ---------------------

    validatePropertyType(
        propertyType
    );


    // ---------------------
    // Validate Status
    // ---------------------

    validatePropertyStatus(
        status
    );


    // ---------------------
    // Validate Type + Status
    // ---------------------

    validatePropertyTypeAndStatus(
        propertyType,
        status
    );


    // ---------------------
    // Effective Areas
    // ---------------------

    const effectiveLandArea =
        data.landArea !== undefined

            ? data.landArea

            : existingProperty.landArea;


    const effectiveBuiltArea =
        data.builtArea !== undefined

            ? data.builtArea

            : existingProperty.builtArea;


    // ---------------------
    // Validate Areas
    // ---------------------

    validateAreas(
        effectiveLandArea,
        effectiveBuiltArea
    );


    // ---------------------
    // Prepare Update Data
    // ---------------------

    const updateData = {

        propertyType,

        status

    };


    // ---------------------
    // Code
    // ---------------------

    if (
        data.code !== undefined
    ) {

        if (
            typeof data.code !== "string" ||
            !data.code.trim()
        ) {

            throw new AppError(
                "code cannot be empty.",
                400
            );

        }


        updateData.code =
            data.code.trim();

    }


    // ---------------------
    // Allowed Fields
    // ---------------------

    if (
        data.landArea !== undefined
    ) {

        updateData.landArea =
            data.landArea;

    }


    if (
        data.builtArea !== undefined
    ) {

        updateData.builtArea =
            data.builtArea;

    }


    if (
        data.description !== undefined
    ) {

        updateData.description =
            data.description;

    }


    if (
        data.registryNumber !== undefined
    ) {

        updateData.registryNumber =
            data.registryNumber;

    }


    if (
        data.complexId !== undefined
    ) {

        updateData.complexId =
            data.complexId;

    }


    // ---------------------
    // Update
    // ---------------------

    try {

        return await propertyRepository.updateProperty(
            id,
            updateData
        );

    }
    catch (error) {

        return handlePropertyPersistenceError(
            error
        );

    }

};


// =====================
// Delete Property
// =====================

const deleteProperty = async (
    id,
    user
) => {

    const existingProperty =
        await propertyRepository.getPropertyById(
            id
        );


    await requirePropertyAccess(
        existingProperty,
        user
    );


    return await propertyRepository.deleteProperty(
        id
    );

};


// =====================
// Search Properties
// =====================

const searchProperties = async (
    q,
    user
) => {

    const properties =
        await propertyRepository.searchProperties(
            q
        );


    return filterPropertiesByAccess(
        properties,
        user
    );

};


// =====================
// Get Property Detail
// =====================

const getPropertyDetail = async (
    id,
    user
) => {

    const property =
        await propertyRepository.getPropertyDetail(
            id
        );


    await requirePropertyAccess(
        property,
        user
    );


    return property;

};


// =====================
// Get Property Owners
// =====================

const getPropertyOwners = async (
    id,
    user
) => {

    const property =
        await propertyRepository.getPropertyOwners(
            id
        );


    await requirePropertyAccess(
        property,
        user
    );


    return property;

};


// =====================
// Get Property Residents
// =====================

const getPropertyResidents = async (
    id,
    user
) => {

    const property =
        await propertyRepository.getPropertyResidents(
            id
        );


    await requirePropertyAccess(
        property,
        user
    );


    return property;

};


// =====================
// Export
// =====================

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