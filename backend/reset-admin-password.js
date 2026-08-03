require("dotenv").config();

const bcrypt = require("bcrypt");

const prisma = require("./src/config/prisma");

async function resetPassword() {
    try {
        const email = "admin@shahrakyar.ir";

        const newPassword = "Admin12345!";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: {
                email
            },

            data: {
                password: hashedPassword
            }
        });

        console.log("================================");

        console.log("Password changed successfully.");

        console.log("Email:", user.email);

        console.log("New Password:", newPassword);

        console.log("================================");
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
