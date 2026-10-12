const AppError =
    require("../utils/AppError");


const unitAccountRepository =
    require("../repositories/unitAccount.repository");


const unitRepository =
    require("../repositories/unit.repository");


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
// Validate User
// ======================================================

const validateUser = (user) => {

    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }

};


// ======================================================
// Get Unit
// ======================================================

const getUnit = async (unitId) => {

    if (!isValidUUID(unitId)) {

        throw new AppError(
            "Invalid unitId. Must be a valid UUID.",
            400
        );

    }


    const unit =
        await unitRepository.findById(
            unitId
        );


    if (!unit) {

        throw new AppError(
            "Unit not found.",
            404
        );

    }


    return unit;

};


// ======================================================
// Validate Complex Access
// ======================================================

const validateUnitAccess = async (
    user,
    unit
) => {

    validateUser(user);

    if (
        user.role !== "ADMIN" &&
        user.role !== "MANAGER"
    ) {
        throw new AppError(
            "Forbidden.",
            403
        );
    }

    if (!unit) {
        throw new AppError(
            "Unit not found.",
            404
        );
    }

    // A unit may be linked through a Building, a Property, or both.
    // If both links exist, they must resolve to the same complex.
    const complexIds = [
        ...new Set([
            unit.building?.complexId,
            unit.property?.complexId
        ].filter(Boolean))
    ];

    if (complexIds.length === 0) {
        throw new AppError(
            "Unit must be connected to a building or property.",
            400
        );
    }

    if (complexIds.length > 1) {
        throw new AppError(
            "Unit account is linked to different complexes.",
            403
        );
    }

    // ADMIN has global access, but inconsistent unit links are rejected.
    if (user.role === "ADMIN") {
        return;
    }

    await accessService.requireComplexAccess(
        user,
        complexIds[0]
    );
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
            "Unit account data is required.",
            400
        );

    }


    if (!data.unitId) {

        throw new AppError(
            "unitId is required.",
            400
        );

    }


    if (!data.code) {

        throw new AppError(
            "code is required.",
            400
        );

    }


    if (
        typeof data.code !== "string" ||
        data.code.trim() === ""
    ) {

        throw new AppError(
            "code must be a non-empty string.",
            400
        );

    }


    const unit =
        await getUnit(
            data.unitId
        );


    await validateUnitAccess(
        user,
        unit
    );


    // --------------------------------------------------
    // One account per Unit
    // --------------------------------------------------

    const existingAccount =
        await unitAccountRepository.findByUnitId(
            data.unitId
        );


    if (existingAccount) {

        throw new AppError(
            "Unit already has a financial account.",
            409
        );

    }


    return unit;

};


// ======================================================
// Create Unit Account
// ======================================================

const createUnitAccount = async (
    data,
    user
) => {

    await validateCreateData(
        data,
        user
    );


    const accountData = {

        unitId:
            data.unitId,

        code:
            data.code.trim(),

        title:
            data.title !== undefined &&
            data.title !== null
                ? String(data.title).trim()
                : null,

        isActive:
            data.isActive !== undefined
                ? Boolean(data.isActive)
                : true

    };


    try {

        return await unitAccountRepository.create(
            accountData
        );

    } catch (error) {

        if (error.code === "P2002") {

            throw new AppError(
                "Unit account code or unit already exists.",
                409
            );

        }

        throw error;

    }

};


// ======================================================
// Get All Unit Accounts
// ======================================================

const getUnitAccounts = async (
    user
) => {

    validateUser(user);


    const accounts =
        await unitAccountRepository.findAll();


    // --------------------------------------------------
    // ADMIN sees everything
    // --------------------------------------------------

    if (user.role === "ADMIN") {

        return accounts;

    }


    // --------------------------------------------------
    // Only MANAGER
    // --------------------------------------------------

    if (user.role !== "MANAGER") {

        throw new AppError(
            "Forbidden.",
            403
        );

    }


    const result = [];


    for (const account of accounts) {

        const unit =
            account.unit;


        try {

            await validateUnitAccess(
                user,
                unit
            );


            result.push(account);

        } catch (error) {

            // ------------------------------------------------
            // Account outside Manager scope remains invisible
            // ------------------------------------------------

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
// Get Unit Account By ID
// ======================================================

const getUnitAccountById = async (
    id,
    user
) => {

    validateUser(user);


    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit account ID. Must be a valid UUID.",
            400
        );

    }


    const account =
        await unitAccountRepository.findById(
            id
        );


    if (!account) {

        throw new AppError(
            "Unit account not found.",
            404
        );

    }


    await validateUnitAccess(
        user,
        account.unit
    );


    return account;

};


// ======================================================
// Get Unit Account By Unit ID
// ======================================================

const getUnitAccountByUnitId = async (
    unitId,
    user
) => {

    validateUser(user);


    const unit =
        await getUnit(
            unitId
        );


    await validateUnitAccess(
        user,
        unit
    );


    const account =
        await unitAccountRepository.findByUnitId(
            unitId
        );


    if (!account) {

        throw new AppError(
            "Unit account not found.",
            404
        );

    }


    return account;

};


// ======================================================
// Update Unit Account
// ======================================================

const updateUnitAccount = async (
    id,
    data,
    user
) => {

    validateUser(user);


    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit account ID. Must be a valid UUID.",
            400
        );

    }


    if (
        !data ||
        typeof data !== "object" ||
        Object.keys(data).length === 0
    ) {

        throw new AppError(
            "Unit account update data is required.",
            400
        );

    }


    const existingAccount =
        await unitAccountRepository.findById(
            id
        );


    if (!existingAccount) {

        throw new AppError(
            "Unit account not found.",
            404
        );

    }


    await validateUnitAccess(
        user,
        existingAccount.unit
    );


    const updateData = {};


    if (data.code !== undefined) {

        if (
            typeof data.code !== "string" ||
            data.code.trim() === ""
        ) {

            throw new AppError(
                "code must be a non-empty string.",
                400
            );

        }


        updateData.code =
            data.code.trim();

    }


    if (data.title !== undefined) {

        updateData.title =
            data.title === null
                ? null
                : String(data.title).trim();

    }


    if (data.isActive !== undefined) {

        if (
            typeof data.isActive !== "boolean"
        ) {

            throw new AppError(
                "isActive must be a boolean.",
                400
            );

        }


        updateData.isActive =
            data.isActive;

    }


    try {

        return await unitAccountRepository.update(
            id,
            updateData
        );

    } catch (error) {

        if (error.code === "P2002") {

            throw new AppError(
                "Unit account code already exists.",
                409
            );

        }

        throw error;

    }

};


// ======================================================
// Delete Unit Account
// ======================================================

const deleteUnitAccount = async (
    id,
    user
) => {

    validateUser(user);


    if (!isValidUUID(id)) {

        throw new AppError(
            "Invalid unit account ID. Must be a valid UUID.",
            400
        );

    }


    const existingAccount =
        await unitAccountRepository.findById(
            id
        );


    if (!existingAccount) {

        throw new AppError(
            "Unit account not found.",
            404
        );

    }


    await validateUnitAccess(
        user,
        existingAccount.unit
    );


    // --------------------------------------------------
    // Do not delete an account that has transactions
    // --------------------------------------------------

    if (
        existingAccount.charges.length > 0 ||
        existingAccount.payments.length > 0
    ) {

        throw new AppError(
            "Unit account with financial transactions cannot be deleted.",
            409
        );

    }


    return await unitAccountRepository.delete(
        id
    );

};


// ======================================================
// Export
// ======================================================

module.exports = {

    createUnitAccount,

    getUnitAccounts,

    getUnitAccountById,

    getUnitAccountByUnitId,

    updateUnitAccount,

    deleteUnitAccount

};