
"use strict";

const propertyAccountService =
    require("../services/propertyAccount.service");


// ======================================================
// Extract Bearer Token
// ======================================================

const getBearerToken = (req) => {

    const authorization =
        req.headers.authorization || "";

    const match =
        authorization.match(/^Bearer\s+(.+)$/i);

    return match
        ? match[1].trim()
        : null;

};


// ======================================================
// Error Status Mapper
// ======================================================

const getErrorStatus = (error) => {

    // --------------------------------------------------
    // Preserve Main Backend HTTP Status
    // --------------------------------------------------

    const upstreamStatus =
        Number(error?.statusCode);

    if (
        [400, 401, 403, 404, 409, 503].includes(
            upstreamStatus
        )
    ) {

        return upstreamStatus;

    }


    const message =
        error?.message || "";


    // --------------------------------------------------
    // 401 - Unauthorized
    // --------------------------------------------------

    if (
        message === "Unauthorized"
    ) {

        return 401;

    }


    // --------------------------------------------------
    // 404 - Not Found
    // --------------------------------------------------

    if (
        message === "Property account not found" ||
        message === "Property not found in Main Backend" ||
        message === "Fiscal period not found" ||
        message === "Fund not found"
    ) {

        return 404;

    }


    // --------------------------------------------------
    // 409 - Conflict
    // --------------------------------------------------

    if (
        message.includes("already exists") ||
        message.includes("already has") ||
        message.includes("payment records exist") ||
        message.includes("charge or payment records exist") ||
        message.includes("linked unit accounts") ||
        message.includes("linked records exist") ||
        message.includes("Operation blocked")
    ) {

        return 409;

    }


    // --------------------------------------------------
    // 400 - Validation Error
    // --------------------------------------------------

    if (
        message.includes("is required") ||
        message.startsWith("Invalid ") ||
        message === "Request body is required" ||
        message === "No fields provided for update" ||
        message === "propertyId cannot be changed" ||
        message.includes("must match fund fiscal period")
    ) {

        return 400;

    }


    // --------------------------------------------------
    // 503 - Main Backend Unavailable
    // --------------------------------------------------

    if (
        message.includes("Main Backend is unavailable") ||
        message.includes("Main Backend request timed out") ||
        message.includes("Main Backend request failed") ||
        message.includes("Unable to retrieve") ||
        message.includes("Invalid response from Main Backend")
    ) {

        return 503;

    }


    // --------------------------------------------------
    // Default
    // --------------------------------------------------

    return 500;

};


// ======================================================
// Send Controller Error
// ======================================================

const sendControllerError = (
    res,
    label,
    error,
    fallbackMessage
) => {

    console.error(
        `${label}:`,
        error
    );

    return res.status(
        getErrorStatus(error)
    ).json({

        success: false,

        message:
            error?.message || fallbackMessage

    });

};


// ======================================================
// Get All Property Accounts
// ======================================================

const getPropertyAccounts = async (req, res) => {

    try {

        const result =
            await propertyAccountService.getAll();

        return res.status(200).json({

            success: true,

            message:
                "Property accounts fetched successfully",

            data: result

        });

    } catch (error) {

        return sendControllerError(
            res,
            "Get Property Accounts Error",
            error,
            "Failed to fetch property accounts"
        );

    }

};


// ======================================================
// Get Property Account by ID
// ======================================================

const getPropertyAccountById = async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await propertyAccountService.getById(id);

        return res.status(200).json({

            success: true,

            message:
                "Property account fetched successfully",

            data: result

        });

    } catch (error) {

        return sendControllerError(
            res,
            "Get Property Account Error",
            error,
            "Failed to fetch property account"
        );

    }

};


// ======================================================
// Get Property Account by Property ID
// ======================================================

const getPropertyAccountByPropertyId =
    async (req, res) => {

        try {

            const { propertyId } =
                req.params;

            const result =
                await propertyAccountService.getByPropertyId(
                    propertyId
                );

            return res.status(200).json({

                success: true,

                message:
                    "Property account fetched successfully",

                data: result

            });

        } catch (error) {

            return sendControllerError(
                res,
                "Get Property Account By Property ID Error",
                error,
                "Failed to fetch property account"
            );

        }

    };


// ======================================================
// Create Property Account
// ======================================================

const createPropertyAccount =
    async (req, res) => {

        try {

            const token =
                getBearerToken(req);


            if (!token) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Unauthorized"

                });

            }


            const result =
                await propertyAccountService.create(
                    req.body,
                    token
                );


            return res.status(201).json({

                success: true,

                message:
                    "Property account created successfully",

                data: result

            });

        } catch (error) {

            return sendControllerError(
                res,
                "Create Property Account Error",
                error,
                "Failed to create property account"
            );

        }

    };


// ======================================================
// Update Property Account
// ======================================================

const updatePropertyAccount =
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const token =
                getBearerToken(req);


            if (!token) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Unauthorized"

                });

            }


            const result =
                await propertyAccountService.update(
                    id,
                    req.body,
                    token
                );


            return res.status(200).json({

                success: true,

                message:
                    "Property account updated successfully",

                data: result

            });

        } catch (error) {

            return sendControllerError(
                res,
                "Update Property Account Error",
                error,
                "Failed to update property account"
            );

        }

    };


// ======================================================
// Delete Property Account
// ======================================================

const deletePropertyAccount =
    async (req, res) => {

        try {

            const { id } =
                req.params;


            const token =
                getBearerToken(req);


            if (!token) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Unauthorized"

                });

            }


            await propertyAccountService.delete(
                id,
                token
            );


            return res.status(200).json({

                success: true,

                message:
                    "Property account deleted successfully"

            });

        } catch (error) {

            return sendControllerError(
                res,
                "Delete Property Account Error",
                error,
                "Failed to delete property account"
            );

        }

    };


// ======================================================
// Export
// ======================================================

module.exports = {

    getPropertyAccounts,

    getPropertyAccountById,

    getPropertyAccountByPropertyId,

    createPropertyAccount,

    updatePropertyAccount,

    deletePropertyAccount

};
