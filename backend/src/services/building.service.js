const AppError = require("../utils/AppError");

const buildingRepository =
    require("../repositories/building.repository");

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
// Filter Buildings By Access
// ======================================================

const filterBuildingsByAccess = async (
    buildings,
    user
) => {

    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // --------------------------------------------------
    // ADMIN → all buildings
    // --------------------------------------------------

    if (user.role === "ADMIN") {

        return buildings;

    }


    // --------------------------------------------------
    // MANAGER → assigned complexes only
    // --------------------------------------------------

    if (user.role === "MANAGER") {

        const accessibleComplexIds =
            await accessService.getAccessibleComplexIds(
                user
            );


        return buildings.filter(
            building =>
                accessibleComplexIds.includes(
                    building.complexId
                )
        );

    }


    // --------------------------------------------------
    // USER → no management access
    // --------------------------------------------------

    return [];

};


// ======================================================
// Check Building Access
// ======================================================

const requireBuildingAccess = async (
    building,
    user
) => {

    if (!building) {

        throw new AppError(
            "Building not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        building.complexId
    );


    return true;

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
        typeof data !== "object" ||
        Array.isArray(data)
    ) {

        throw new AppError(
            "Building data is required.",
            400
        );

    }


    const {
        name,
        complexId,
        address,
        description
    } = data;


    // --------------------------------------------------
    // Name
    // --------------------------------------------------

    if (
        typeof name !== "string" ||
        !name.trim()
    ) {

        throw new AppError(
            "name is required.",
            400
        );

    }


    // --------------------------------------------------
    // Complex ID
    // --------------------------------------------------

    if (!complexId) {

        throw new AppError(
            "complexId is required.",
            400
        );

    }


    if (!isValidUUID(complexId)) {

        throw new AppError(
            "Invalid complexId. Must be a valid UUID.",
            400
        );

    }


    // --------------------------------------------------
    // Address
    // --------------------------------------------------

    if (
        address !== undefined &&
        address !== null &&
        typeof address !== "string"
    ) {

        throw new AppError(
            "address must be a string or null.",
            400
        );

    }


    // --------------------------------------------------
    // Description
    // --------------------------------------------------

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {

        throw new AppError(
            "description must be a string or null.",
            400
        );

    }


    // --------------------------------------------------
    // Complex Access
    // --------------------------------------------------

    await accessService.requireComplexAccess(
        user,
        complexId
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
        Array.isArray(data) ||
        Object.keys(data).length === 0
    ) {

        throw new AppError(
            "Building update data is required.",
            400
        );

    }


    if (data.name !== undefined) {

        if (
            typeof data.name !== "string" ||
            !data.name.trim()
        ) {

            throw new AppError(
                "name cannot be empty.",
                400
            );

        }

    }


    if (data.address !== undefined) {

        if (
            data.address !== null &&
            typeof data.address !== "string"
        ) {

            throw new AppError(
                "address must be a string or null.",
                400
            );

        }

    }


    if (data.description !== undefined) {

        if (
            data.description !== null &&
            typeof data.description !== "string"
        ) {

            throw new AppError(
                "description must be a string or null.",
                400
            );

        }

    }

};


// ======================================================
// Create Building
// ======================================================

const createBuilding = async (
    data,
    user
) => {

    await validateCreateData(
        data,
        user
    );


    const updateData = {

        name:
            data.name.trim(),

        address:
            data.address,

        description:
            data.description,

        complexId:
            data.complexId

    };


    try {

        return await buildingRepository.createBuilding(
            updateData
        );

    }
    catch (error) {

        // ------------------------------------------------
        // Duplicate Building
        // ------------------------------------------------

        if (error?.code === "P2002") {

            throw new AppError(
                "Building already exists.",
                409
            );

        }


        // ------------------------------------------------
        // Complex does not exist
        // ------------------------------------------------

        if (error?.code === "P2003") {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        throw error;

    }

};


// ======================================================
// Get All Buildings
// ======================================================

const getBuildings = async (
    user
) => {

    const buildings =
        await buildingRepository.getBuildings();


    return filterBuildingsByAccess(
        buildings,
        user
    );

};


// ======================================================
// Get Building By ID
// ======================================================

const getBuildingById = async (
    id,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid building ID. Must be a valid UUID.",
            400
        );

    }


    const building =
        await buildingRepository.getBuildingById(
            id
        );


    await requireBuildingAccess(
        building,
        user
    );


    return building;

};


// ======================================================
// Update Building
// ======================================================

const updateBuilding = async (
    id,
    data,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid building ID. Must be a valid UUID.",
            400
        );

    }


    await validateUpdateData(
        data
    );


    // --------------------------------------------------
    // Find existing building
    // --------------------------------------------------

    const existingBuilding =
        await buildingRepository.getBuildingById(
            id
        );


    // --------------------------------------------------
    // Current Building must be accessible
    // --------------------------------------------------

    await requireBuildingAccess(
        existingBuilding,
        user
    );


    // --------------------------------------------------
    // Allowed fields
    // --------------------------------------------------

    const updateData = {};


    if (data.name !== undefined) {

        updateData.name =
            data.name.trim();

    }


    if (data.address !== undefined) {

        updateData.address =
            data.address;

    }


    if (data.description !== undefined) {

        updateData.description =
            data.description;

    }


    // --------------------------------------------------
    // Update
    // --------------------------------------------------

    try {

        return await buildingRepository.updateBuilding(
            id,
            updateData
        );

    }
    catch (error) {

        // ------------------------------------------------
        // Duplicate Building
        // ------------------------------------------------

        if (error?.code === "P2002") {

            throw new AppError(
                "Building already exists.",
                409
            );

        }


        // ------------------------------------------------
        // Complex does not exist
        // ------------------------------------------------

        if (error?.code === "P2003") {

            throw new AppError(
                "Complex not found.",
                404
            );

        }


        throw error;

    }

};


// ======================================================
// Delete Building
// ======================================================

const deleteBuilding = async (
    id,
    user
) => {

    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid building ID. Must be a valid UUID.",
            400
        );

    }


    const existingBuilding =
        await buildingRepository.getBuildingById(
            id
        );


    await requireBuildingAccess(
        existingBuilding,
        user
    );


    return await buildingRepository.deleteBuilding(
        id
    );

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createBuilding,

    getBuildings,

    getBuildingById,

    updateBuilding,

    deleteBuilding

};