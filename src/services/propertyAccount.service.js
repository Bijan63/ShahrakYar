const propertyAccountRepository =
    require("../repositories/propertyAccount.repository");

const {
    mainBackendRequest
} = require("../utils/mainBackendClient");


class PropertyAccountService {

    // ======================================================
    // Get All Property Accounts
    // ======================================================

    async getAll() {

        return await propertyAccountRepository.findAll();

    }


    // ======================================================
    // Get Property Account by ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const propertyAccount =
            await propertyAccountRepository.findById(id);


        if (!propertyAccount) {

            throw new Error(
                "Property account not found"
            );

        }


        return propertyAccount;

    }


    // ======================================================
    // Get Property Account by Property ID
    // ======================================================

    async getByPropertyId(propertyId) {

        if (!propertyId) {

            throw new Error(
                "propertyId is required"
            );

        }


        const propertyAccount =
            await propertyAccountRepository
                .findByPropertyId(propertyId);


        if (!propertyAccount) {

            throw new Error(
                "Property account not found"
            );

        }


        return propertyAccount;

    }


    // ======================================================
    // Create Property Account
    // ======================================================

    async create(data, token) {

        // --------------------------------------------------
        // Validate request body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Validate propertyId
        // --------------------------------------------------

        if (!data.propertyId) {

            throw new Error(
                "propertyId is required"
            );

        }


        // --------------------------------------------------
        // Validate accountNumber
        // --------------------------------------------------

        if (!data.accountNumber) {

            throw new Error(
                "accountNumber is required"
            );

        }


        // --------------------------------------------------
        // Validate name
        // --------------------------------------------------

        if (!data.name) {

            throw new Error(
                "name is required"
            );

        }


        // --------------------------------------------------
        // Validate status
        // --------------------------------------------------

        if (
            data.status !== undefined &&
            data.status !== "ACTIVE" &&
            data.status !== "INACTIVE"
        ) {

            throw new Error(
                "Invalid status"
            );

        }


        // --------------------------------------------------
        // Validate Property in Main Backend
        // --------------------------------------------------

        if (!token) {

            throw new Error(
                "Unauthorized"
            );

        }


        const propertyResponse =
            await mainBackendRequest(
                `/api/properties/${data.propertyId}`,
                token
            );


        if (
            !propertyResponse ||
            !propertyResponse.data
        ) {

            throw new Error(
                "Property not found in Main Backend"
            );

        }


        // --------------------------------------------------
        // Prevent duplicate Property Account
        // --------------------------------------------------

        const existingPropertyAccount =
            await propertyAccountRepository
                .findByPropertyId(
                    data.propertyId
                );


        if (existingPropertyAccount) {

            throw new Error(
                "Property already has a finance account"
            );

        }


        // --------------------------------------------------
        // Prevent duplicate Account Number
        // --------------------------------------------------

        const existingAccountNumber =
            await propertyAccountRepository
                .findByAccountNumber(
                    data.accountNumber
                );


        if (existingAccountNumber) {

            throw new Error(
                "Property account number already exists"
            );

        }


        // --------------------------------------------------
        // Prepare data
        // --------------------------------------------------

        const createData = {

            propertyId:
                data.propertyId,

            accountNumber:
                data.accountNumber,

            name:
                data.name,

            status:
                data.status || "ACTIVE"

        };


        // --------------------------------------------------
        // Optional Fiscal Period
        // --------------------------------------------------

        if (data.fiscalPeriodId !== undefined) {

            createData.fiscalPeriodId =
                data.fiscalPeriodId || null;

        }


        // --------------------------------------------------
        // Optional Fund
        // --------------------------------------------------

        if (data.fundId !== undefined) {

            createData.fundId =
                data.fundId || null;

        }


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await propertyAccountRepository.create(
            createData
        );

    }


    // ======================================================
    // Update Property Account
    // ======================================================

    async update(id, data) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Make sure account exists
        // --------------------------------------------------

        const existing =
            await this.getById(id);


        const updateData = {};


        // --------------------------------------------------
        // Account Number
        // --------------------------------------------------

        if (
            data.accountNumber !== undefined
        ) {

            if (!data.accountNumber) {

                throw new Error(
                    "accountNumber is required"
                );

            }


            const duplicate =
                await propertyAccountRepository
                    .findByAccountNumber(
                        data.accountNumber
                    );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Property account number already exists"
                );

            }


            updateData.accountNumber =
                data.accountNumber;

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (data.name !== undefined) {

            if (!data.name) {

                throw new Error(
                    "name is required"
                );

            }


            updateData.name =
                data.name;

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (data.status !== undefined) {

            if (
                data.status !== "ACTIVE" &&
                data.status !== "INACTIVE"
            ) {

                throw new Error(
                    "Invalid status"
                );

            }


            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Property ID
        // --------------------------------------------------

        if (
            data.propertyId !== undefined &&
            data.propertyId !== existing.propertyId
        ) {

            throw new Error(
                "propertyId cannot be changed"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined
        ) {

            updateData.fiscalPeriodId =
                data.fiscalPeriodId || null;

        }


        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        if (
            data.fundId !== undefined
        ) {

            updateData.fundId =
                data.fundId || null;

        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        return await propertyAccountRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Delete Property Account
    // ======================================================

    async delete(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        await this.getById(id);


        return await propertyAccountRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new PropertyAccountService();