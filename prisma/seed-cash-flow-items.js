const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CASH_FLOW_ITEMS = [
    {
        code: "OP-CHARGE-RECEIPT",
        name: "دریافت شارژ",
        classification: "OPERATING",
        sortOrder: 10,
    },
    {
        code: "OP-OTHER-INCOME",
        name: "دریافت درآمد متفرقه",
        classification: "OPERATING",
        sortOrder: 20,
    },
    {
        code: "OP-CURRENT-EXPENSE",
        name: "پرداخت هزینه‌های جاری",
        classification: "OPERATING",
        sortOrder: 30,
    },
    {
        code: "OP-OTHER-OPERATING-INFLOW",
        name: "سایر دریافت‌های عملیاتی",
        classification: "OPERATING",
        sortOrder: 40,
    },
    {
        code: "OP-OTHER-OPERATING-OUTFLOW",
        name: "سایر پرداخت‌های عملیاتی",
        classification: "OPERATING",
        sortOrder: 50,
    },
    {
        code: "INV-ASSET-PURCHASE",
        name: "خرید دارایی ثابت",
        classification: "INVESTING",
        sortOrder: 60,
    },
    {
        code: "INV-ASSET-SALE",
        name: "فروش دارایی ثابت",
        classification: "INVESTING",
        sortOrder: 70,
    },
    {
        code: "FIN-LOAN-RECEIPT",
        name: "دریافت تسهیلات و وام",
        classification: "FINANCING",
        sortOrder: 80,
    },
    {
        code: "FIN-LOAN-REPAYMENT",
        name: "بازپرداخت تسهیلات و وام",
        classification: "FINANCING",
        sortOrder: 90,
    },
    {
        code: "FIN-CAPITAL-CONTRIBUTION",
        name: "دریافت آورده / افزایش سرمایه",
        classification: "FINANCING",
        sortOrder: 100,
    },
    {
        code: "FIN-CAPITAL-RETURN",
        name: "بازپرداخت / استرداد آورده",
        classification: "FINANCING",
        sortOrder: 110,
    },
];

async function main() {
    console.log("");
    console.log("==============================================");
    console.log("CASH FLOW ITEMS SEED");
    console.log("==============================================");
    console.log("");

    for (const item of CASH_FLOW_ITEMS) {
        const result = await prisma.cashFlowItem.upsert({
            where: {
                code: item.code,
            },

            update: {
                name: item.name,
                classification: item.classification,
                sortOrder: item.sortOrder,
                isActive: true,
            },

            create: {
                code: item.code,
                name: item.name,
                classification: item.classification,
                sortOrder: item.sortOrder,
                isActive: true,
            },
        });

        console.log(
            `${result.code} | ${result.name} | ${result.classification}`
        );
    }

    console.log("");
    console.log("==============================================");
    console.log("CASH FLOW ITEMS SEED COMPLETED");
    console.log("==============================================");
    console.log("");
}

main()
    .catch((error) => {
        console.error("");
        console.error("CASH FLOW ITEMS SEED FAILED");
        console.error("");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });