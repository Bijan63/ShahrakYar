const AppError = require("../utils/AppError");

const unitRepository =
    require("../repositories/unit.repository");

const buildingRepository =
    require("../repositories/building.repository");

const propertyRepository =
    require("../repositories/property.repository");

const accessService =
    require("./access.service");


// ======================================================
// UUID Validation
// ======================================================

const isValidUUID = (value) => {

    if (typeof value !== "string") {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value);

};


// ======================================================
// Validate Unit Number
// ======================================================

const validateUnitNumber = (unitNumber) => {

    if (
        unitNumber === undefined ||
        unitNumber === null
    ) {

        throw new AppError(
            "unitNumber is required.",
            400
        );

    }


    if (
        typeof unitNumber !== "string" ||
        unitNumber.trim() === ""
    ) {

        throw new AppError(
            "unitNumber must be a non-empty string.",
            400
        );

    }

};

// ======================================================
// Validate Floor
// ======================================================

const validateFloor = (floor) => {

    if (floor === undefined || floor === null) {
        return;
    }

    if (
        typeof floor !== "number" ||
        !Number.isInteger(floor)
    ) {

        throw new AppError(
            "floor must be an integer.",
            400
        );

    }

};


// ======================================================
// Validate Area
// ======================================================

const validateArea = (area) => {

    if (area === undefined || area === null) {
        return;
    }

    if (
        typeof area !== "number" ||
        !Number.isFinite(area) ||
        area <= 0
    ) {

        throw new AppError(
            "area must be a positive number.",
            400
        );

    }

};


// ======================================================
// Validate Code
// ======================================================

const validateCode = (code) => {

    if (
        code === undefined ||
        code === null
    ) {

        return;

    }

    if (
        typeof code !== "string" ||
        code.trim() === ""
    ) {

        throw new AppError(
            "code must be a non-empty string.",
            400
        );

    }

};


// ======================================================
// Get Building
// ======================================================

const getBuilding = async (buildingId) => {

    if (
        buildingId === undefined ||
        buildingId === null ||
        buildingId === ""
    ) {

        return null;

    }

    if (!isValidUUID(buildingId)) {

        throw new AppError(
            "Invalid buildingId. Must be a valid UUID.",
            400
        );

    }

    const building =
        await buildingRepository.getBuildingById(
            buildingId
        );

    if (!building) {

        throw new AppError(
            "Building not found.",
            404
        );

    }

    return building;

};


// ======================================================
// Get Property
// ======================================================

const getProperty = async (propertyId) => {

    if (
        propertyId === undefined ||
        propertyId === null ||
        propertyId === ""
    ) {

        return null;

    }

    if (!isValidUUID(propertyId)) {

        throw new AppError(
            "Invalid propertyId. Must be a valid UUID.",
            400
        );

    }

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

    return property;

};


// ======================================================
// Validate Resource Scope
// ======================================================

const validateResourceScope = async (
    user,
    building,
    property
) => {

    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // --------------------------------------------------
    // Determine resource Complexes
    // --------------------------------------------------

    const buildingComplexId =
        building
            ? building.complexId
            : null;


    const propertyComplexId =
        property
            ? property.complexId
            : null;


    // --------------------------------------------------
    // Building and Property must belong
    // to the same Complex
    // --------------------------------------------------

    if (
        buildingComplexId &&
        propertyComplexId &&
        buildingComplexId !== propertyComplexId
    ) {

        throw new AppError(
            "Building and Property must belong to the same complex.",
            400
        );

    }


    // --------------------------------------------------
    // Determine effective Complex
    // --------------------------------------------------

    const complexId =
        buildingComplexId ||
        propertyComplexId;


    // --------------------------------------------------
    // Unit must belong to a Complex
    // --------------------------------------------------

    if (!complexId) {

        throw new AppError(
            "Unit must be connected to a building or property.",
            400
        );

    }


    // --------------------------------------------------
    // ADMIN has global access
    // --------------------------------------------------

    if (user.role === "ADMIN") {

        return complexId;

    }


    // --------------------------------------------------
    // USER has no management access
    // --------------------------------------------------

    if (user.role !== "MANAGER") {

        throw new AppError(
            "Forbidden.",
            403
        );

    }


    // --------------------------------------------------
    // MANAGER must have access to Complex
    // --------------------------------------------------

    await accessService.requireComplexAccess(
        user,
        complexId
    );


    return complexId;

};


// ======================================================
// Validate Create Data
// ======================================================

const validateCreateData = async (
    data,
    user
) => {

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new AppError(
            "Unit data is required.",
            400
        );

    }


    validateUnitNumber(
        data.unitNumber
    );

    validateFloor(
        data.floor
    );

    validateArea(
        data.area
    );

    validateCode(
        data.code
    );


    const building =
        await getBuilding(
            data.buildingId
        );


    const property =
        await getProperty(
            data.propertyId
        );


    await validateResourceScope(
        user,
        building,
        property
    );

};


// ======================================================
// Validate Update Data
// ======================================================

const validateUpdateData = async (
    data
) => {

    if (
        !data ||
        typeof data !== "object" ||
        Object.keys(data).length === 0
    ) {

        throw new AppError(
            "Unit update data is required.",
            400
        );

    }


    if (
        data.unitNumber !== undefined
    ) {

        validateUnitNumber(
            data.unitNumber
        );

    }


    if (
        data.floor !== undefined
    ) {

        validateFloor(
            data.floor
        );

    }


    if (
        data.area !== undefined
    ) {

        validateArea(
            data.area
        );

    }


    if (
        data.code !== undefined
    ) {

        validateCode(
            data.code
        );

    }

};


// ======================================================
// Create Unit
// ======================================================

const createUnit = async (
    data,
    user
) => {

    await validateCreateData(
        data,
        user
    );


    try {

        return await unitRepository.create(
            data
        );

    } catch (error) {

        if (error.code === "P2002") {

            throw new AppError(
                "Unit code already exists.",
                409
            );

        }

        throw error;

    }

};


// ======================================================
// Get All Units
// ======================================================

const getUnits = async (
    user
) => {

    if (!user) {
        throw new AppError(
            "Unauthorized.",
            401
        );
    }

    const units = await unitRepository.findAll();

    // ADMIN has global access, including visibility of orphan Units.
    if (user.role === "ADMIN") {
        return units;
    }

    if (user.role !== "MANAGER") {
        throw new AppError(
            "Forbidden.",
            403
        );
    }

    const result = [];

    for (const unit of units) {
        const building = await getBuilding(unit.buildingId);
        const property = await getProperty(unit.propertyId);

        // Deleting a Building and a Property sets both foreign keys
        // to null. Such an orphan Unit cannot be assigned to a
        // Manager's complex, so skip it instead of failing the list.
        if (!building && !property) {
            continue;
        }

        // Do not let an inconsistent legacy record break the entire list.
        if (
            building &&
            property &&
            building.complexId !== property.complexId
        ) {
            continue;
        }

        try {
            await validateResourceScope(
                user,
                building,
                property
            );

            result.push(unit);
        } catch (error) {
            if (
                error.statusCode === 403 ||
                error.statusCode === 404 ||
                error.status === 403 ||
                error.status === 404
            ) {
                continue;
            }

            throw error;
        }
    }

    return result;
};


// ======================================================
// Get Unit By ID
// ======================================================

const getUnitById = async (
    id,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit ID. Must be a valid UUID.",
            400
        );

    }


    const unit =
        await unitRepository.findById(
            id
        );


    if (!unit) {

        throw new AppError(
            "Unit not found.",
            404
        );

    }


    const building =
        await getBuilding(
            unit.buildingId
        );


    const property =
        await getProperty(
            unit.propertyId
        );


    await validateResourceScope(
        user,
        building,
        property
    );


    return unit;

};


// ======================================================
// Update Unit
// ======================================================

const updateUnit = async (
    id,
    data,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit ID. Must be a valid UUID.",
            400
        );

    }


    const existingUnit =
        await unitRepository.findById(
            id
        );


    if (!existingUnit) {

        throw new AppError(
            "Unit not found.",
            404
        );

    }


    // --------------------------------------------------
    // Current resources
    // --------------------------------------------------

    const existingBuilding =
        await getBuilding(
            existingUnit.buildingId
        );


    const existingProperty =
        await getProperty(
            existingUnit.propertyId
        );


    // --------------------------------------------------
    // Current Unit must be accessible
    // --------------------------------------------------

    await validateResourceScope(
        user,
        existingBuilding,
        existingProperty
    );


    await validateUpdateData(
        data
    );


    // --------------------------------------------------
    // Determine new resources
    // --------------------------------------------------

    const newBuildingId =
        data.buildingId !== undefined
            ? data.buildingId
            : existingUnit.buildingId;


    const newPropertyId =
        data.propertyId !== undefined
            ? data.propertyId
            : existingUnit.propertyId;


    const newBuilding =
        await getBuilding(
            newBuildingId
        );


    const newProperty =
        await getProperty(
            newPropertyId
        );


    // --------------------------------------------------
    // New target must also be accessible
    // --------------------------------------------------

    await validateResourceScope(
        user,
        newBuilding,
        newProperty
    );


    try {

        return await unitRepository.update(
            id,
            data
        );

    } catch (error) {

        if (error.code === "P2002") {

            throw new AppError(
                "Unit code already exists.",
                409
            );

        }

        throw error;

    }

};


// ======================================================
// Delete Unit
// ======================================================

const deleteUnit = async (
    id,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit ID. Must be a valid UUID.",
            400
        );

    }


    const existingUnit =
        await unitRepository.findById(
            id
        );


    if (!existingUnit) {

        throw new AppError(
            "Unit not found.",
            404
        );

    }


    const building =
        await getBuilding(
            existingUnit.buildingId
        );


    const property =
        await getProperty(
            existingUnit.propertyId
        );


    await validateResourceScope(
        user,
        building,
        property
    );


    return await unitRepository.delete(
        id
    );

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createUnit,

    getUnits,

    getUnitById,

    updateUnit,

    deleteUnit

};