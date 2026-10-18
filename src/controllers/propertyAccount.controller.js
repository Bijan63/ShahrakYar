const propertyAccountService =
    require("../services/propertyAccount.service");


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

        console.error(
            "Get Property Accounts Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch property accounts"

        });

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

        console.error(
            "Get Property Account Error:",
            error
        );

        const status =
            error.message ===
            "Property account not found"
                ? 404
                : error.message ===
                  "id is required"
                    ? 400
                    : 500;

        return res.status(status).json({

            success: false,

            message: error.message

        });

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
                await propertyAccountService
                    .getByPropertyId(
                        propertyId
                    );

            return res.status(200).json({

                success: true,

                message:
                    "Property account fetched successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Get Property Account By Property ID Error:",
                error
            );

            const status =
                error.message ===
                "Property account not found"
                    ? 404
                    : error.message ===
                      "propertyId is required"
                        ? 400
                        : 500;

            return res.status(status).json({

                success: false,

                message: error.message

            });

        }

    };


// ======================================================
// Create Property Account
// ======================================================

const createPropertyAccount =
    async (req, res) => {

        try {

            const token =
                req.headers.authorization?.replace(
                    "Bearer ",
                    ""
                );


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

            console.error(
                "Create Property Account Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                "Unauthorized"
            ) {

                status = 401;

            }


            else if (
                error.message ===
                    "Request body is required" ||
                error.message ===
                    "propertyId is required" ||
                error.message ===
                    "accountNumber is required" ||
                error.message ===
                    "name is required" ||
                error.message ===
                    "Invalid status"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                    "Property already has a finance account" ||
                error.message ===
                    "Property account number already exists"
            ) {

                status = 409;

            }


            else if (
                error.message ===
                "Property not found in Main Backend"
            ) {

                status = 404;

            }


            return res.status(status).json({

                success: false,

                message: error.message

            });

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


            const result =
                await propertyAccountService.update(
                    id,
                    req.body
                );


            return res.status(200).json({

                success: true,

                message:
                    "Property account updated successfully",

                data: result

            });

        } catch (error) {

            console.error(
                "Update Property Account Error:",
                error
            );


            let status = 500;


            if (
                error.message ===
                    "Property account not found"
            ) {

                status = 404;

            }


            else if (
                error.message ===
                    "id is required" ||
                error.message ===
                    "Request body is required" ||
                error.message ===
                    "accountNumber is required" ||
                error.message ===
                    "name is required" ||
                error.message ===
                    "Invalid status" ||
                error.message ===
                    "propertyId cannot be changed"
            ) {

                status = 400;

            }


            else if (
                error.message ===
                "Property account number already exists"
            ) {

                status = 409;

            }


            return res.status(status).json({

                success: false,

                message: error.message

            });

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


            await propertyAccountService.delete(
                id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Property account deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete Property Account Error:",
                error
            );


            const status =
                error.message ===
                    "Property account not found"
                    ? 404
                    : error.message ===
                      "id is required"
                        ? 400
                        : 500;


            return res.status(status).json({

                success: false,

                message: error.message

            });

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