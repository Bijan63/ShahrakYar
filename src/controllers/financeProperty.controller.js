const financePropertyService =
    require("../services/financeProperty.service");


// ======================================================
// Get Properties for Finance
// ======================================================

const getProperties = async (req, res) => {

    try {

        const token =
            req.headers.authorization?.replace(
                "Bearer ",
                ""
            );


        if (!token) {

            return res.status(401).json({

                success: false,

                message: "Unauthorized"

            });

        }


        const result =
            await financePropertyService.getProperties(
                token
            );


        return res.status(200).json({

            success: true,

            message:
                "Finance properties fetched successfully",

            data:
                result?.data || []

        });

    } catch (error) {

        console.error(
            "Finance Properties Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch finance properties"

        });

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    getProperties,

};