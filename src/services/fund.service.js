const fundRepository =
    require("../repositories/fund.repository");


class FundService {


    // ======================================================
    // Get All Funds
    // ======================================================

    async getAll() {

        return await fundRepository.findAll();

    }


    // ======================================================
    // Get Fund by ID
    // ======================================================

    async getById(id) {

        const fund =
            await fundRepository.findById(id);


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        return fund;

    }


    // ======================================================
    // Get Fund by Code
    // ======================================================

    async getByCode(code) {

        const fund =
            await fundRepository.findByCode(code);


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        return fund;

    }


    // ======================================================
    // Create Fund
    // ======================================================

    async create(data) {


        // --------------------------------------------------
        // Validate Request Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Validate Code
        // --------------------------------------------------

        if (!data.code) {

            throw new Error(
                "code is required"
            );

        }


        // --------------------------------------------------
        // Validate Name
        // --------------------------------------------------

        if (!data.name) {

            throw new Error(
                "name is required"
            );

        }


        // --------------------------------------------------
        // Validate Type
        // --------------------------------------------------

        if (!data.type) {

            throw new Error(
                "type is required"
            );

        }


        const allowedTypes = [
            "OPERATING",
            "CAPITAL"
        ];


        if (!allowedTypes.includes(data.type)) {

            throw new Error(
                "Invalid fund type"
            );

        }


        // --------------------------------------------------
        // Prevent Duplicate Code
        // --------------------------------------------------

        const existing =
            await fundRepository.findByCode(
                data.code
            );


        if (existing) {

            throw new Error(
                "Fund code already exists"
            );

        }


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await fundRepository.create({

            code:
                data.code,

            name:
                data.name,

            type:
                data.type,

            description:
                data.description || null,

            status:
                data.status || "ACTIVE",

            fiscalPeriodId:
                data.fiscalPeriodId || null

        });

    }


    // ======================================================
    // Update Fund
    // ======================================================

    async update(id, data) {


        await this.getById(id);


        const updateData = {};


        // --------------------------------------------------
        // Code
        // --------------------------------------------------

        if (data.code !== undefined) {

            const duplicate =
                await fundRepository.findByCode(
                    data.code
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Fund code already exists"
                );

            }


            updateData.code =
                data.code;

        }


        // --------------------------------------------------
        // Name
        // --------------------------------------------------

        if (data.name !== undefined) {

            updateData.name =
                data.name;

        }


        // --------------------------------------------------
        // Type
        // --------------------------------------------------

        if (data.type !== undefined) {

            const allowedTypes = [
                "OPERATING",
                "CAPITAL"
            ];


            if (
                !allowedTypes.includes(
                    data.type
                )
            ) {

                throw new Error(
                    "Invalid fund type"
                );

            }


            updateData.type =
                data.type;

        }


        // --------------------------------------------------
        // Description
        // --------------------------------------------------

        if (data.description !== undefined) {

            updateData.description =
                data.description;

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (data.status !== undefined) {

            const allowedStatuses = [
                "ACTIVE",
                "INACTIVE"
            ];


            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {

                throw new Error(
                    "Invalid fund status"
                );

            }


            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined
        ) {

            updateData.fiscalPeriodId =
                data.fiscalPeriodId;

        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        return await fundRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Delete Fund
    // ======================================================

    async delete(id) {

        await this.getById(id);


        return await fundRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new FundService();