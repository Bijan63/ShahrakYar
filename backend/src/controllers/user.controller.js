const prisma = require("../config/prisma");

const profile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true
            }
        });

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    profile
};
