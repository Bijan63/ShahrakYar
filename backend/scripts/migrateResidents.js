const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function migrate() {
    console.log("=================================");
    console.log(" Resident Migration Started");
    console.log("=================================");

    const residents = await prisma.resident.findMany();

    let updated = 0;
    let skipped = 0;

    for (const resident of residents) {
        const user = await prisma.user.findFirst({
            where: {
                fullName: resident.fullName
            }
        });

        if (!user) {
            console.log(`❌ User not found: ${resident.fullName}`);
            skipped++;

            continue;
        }

        await prisma.resident.update({
            where: {
                id: resident.id
            },

            data: {
                userId: user.id,

                residentType: resident.role
            }
        });

        console.log(`✅ ${resident.fullName}`);

        updated++;
    }

    console.log("");
    console.log("==============================");
    console.log(`Updated : ${updated}`);
    console.log(`Skipped : ${skipped}`);
    console.log("==============================");
}

migrate()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);

        await prisma.$disconnect();
    });
