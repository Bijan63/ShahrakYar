const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const register = async (req, res) => {
    try {

        const { fullName, email, password } = req.body;

        // بررسی اطلاعات
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // بررسی وجود ایمیل
        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        // رمزنگاری رمز عبور
        const hashedPassword = await bcrypt.hash(password, 10);

        // ذخیره در دیتابیس
        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword
            }
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully 🚀",
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            }
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
    register
};