require("dotenv").config();

const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("=================================");
    console.log(" ShahrakYar Seed Started");
    console.log("=================================");

    // -----------------------------
    // Admin User
    // -----------------------------

    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await prisma.user.upsert({
        where: {
            email: "admin@shahrakyar.ir"
        },

        update: {},

        create: {
            fullName: "System Administrator",

            email: "admin@shahrakyar.ir",

            password: hashedPassword,

            role: "ADMIN"
        }
    });

    console.log("✅ Admin");

    // -----------------------------
    // Building
    // -----------------------------

    const building = await prisma.building.create({
        data: {
            name: "Building A",

            address: "Sample Address",

            floors: 5,

            totalUnits: 20
        }
    });

    console.log("✅ Building");

    // -----------------------------
    // Unit
    // -----------------------------

    const unit = await prisma.unit.create({
        data: {
            unitNumber: "101",

            floor: 1,

            area: 120,

            buildingId: building.id
        }
    });

    console.log("✅ Unit");

    // -----------------------------
    // Resident
    // -----------------------------

    const resident = await prisma.resident.create({
        data: {
            fullName: "Ali Hoss",

            mobile: "09121234567",

            residentType: "OWNER",

            userId: admin.id,

            unitId: unit.id
        }
    });

    console.log("✅ Resident");

    // -----------------------------
    // Election
    // -----------------------------

    const election = await prisma.election.create({
        data: {
            title: "Board Election",

            description: "Initial Election",

            startDate: new Date(),

            endDate: new Date(Date.now() + 86400000 * 7),

            status: "OPEN"
        }
    });

    console.log("✅ Election");

    // -----------------------------
    // Candidate
    // -----------------------------

    await prisma.candidate.create({
        data: {
            fullName: resident.fullName,

            biography: "System Seed Candidate",

            electionId: election.id
        }
    });

    console.log("✅ Candidate");

    console.log("=================================");
    console.log(" Seed Finished Successfully");
    console.log("=================================");
}

main()
    .catch((e) => {
        console.error(e);

        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
