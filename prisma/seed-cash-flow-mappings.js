const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const FISCAL_PERIOD_ID =
    "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2";

const MAPPINGS = [
    {
        counterpartAccountId:
            "22ce47fe-10e6-445b-915b-874cb940b2f4",
        cashAccountId: null,
        cashFlowItemCode: "OP-CHARGE-RECEIPT",
        direction: "INFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "342ea497-3724-4294-8dd2-27278e13622b",
        cashAccountId: null,
        cashFlowItemCode: "OP-OTHER-INCOME",
        direction: "INFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "554caa65-ae91-4d8c-a979-b637bab9be82",
        cashAccountId: null,
        cashFlowItemCode: "OP-CURRENT-EXPENSE",
        direction: "OUTFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "4b7d438d-5de2-4b31-8eb5-0ed79cc634c2",
        cashAccountId: null,
        cashFlowItemCode: "INV-ASSET-PURCHASE",
        direction: "OUTFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "4b7d438d-5de2-4b31-8eb5-0ed79cc634c2",
        cashAccountId: null,
        cashFlowItemCode: "INV-ASSET-SALE",
        direction: "INFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "b13a95b9-3119-4290-af99-ac078965c808",
        cashAccountId: null,
        cashFlowItemCode: "FIN-LOAN-RECEIPT",
        direction: "INFLOW",
        priority: 100,
    },

    {
        counterpartAccountId:
            "b13a95b9-3119-4290-af99-ac078965c808",
        cashAccountId: null,
        cashFlowItemCode: "FIN-LOAN-REPAYMENT",
        direction: "OUTFLOW",
        priority: 100,
    },
];

async function main() {
    console.log("");
    console.log("==============================================");
    console.log("CASH FLOW MAPPINGS SEED");
    console.log("==============================================");
    console.log("");

    for (const mapping of MAPPINGS) {
        const cashFlowItem =
            await prisma.cashFlowItem.findUnique({
                where: {
                    code: mapping.cashFlowItemCode,
                },
            });

        if (!cashFlowItem) {
            throw new Error(
                `CashFlowItem not found: ${mapping.cashFlowItemCode}`
            );
        }

        const existing =
            await prisma.cashFlowMapping.findFirst({
                where: {
                    fiscalPeriodId: FISCAL_PERIOD_ID,
                    counterpartAccountId:
                        mapping.counterpartAccountId,
                    cashAccountId:
                        mapping.cashAccountId,
                    direction:
                        mapping.direction,
                    cashFlowItemId:
                        cashFlowItem.id,
                },
            });

        let result;

        if (existing) {
            result =
                await prisma.cashFlowMapping.update({
                    where: {
                        id: existing.id,
                    },
                    data: {
                        priority: mapping.priority,
                        isActive: true,
                    },
                });
        } else {
            result =
                await prisma.cashFlowMapping.create({
                    data: {
                        fiscalPeriodId:
                            FISCAL_PERIOD_ID,

                        counterpartAccountId:
                            mapping.counterpartAccountId,

                        cashAccountId:
                            mapping.cashAccountId,

                        cashFlowItemId:
                            cashFlowItem.id,

                        direction:
                            mapping.direction,

                        priority:
                            mapping.priority,

                        isActive: true,
                    },
                });
        }

        console.log(
            `${mapping.cashFlowItemCode} | ` +
            `${mapping.direction} | ` +
            `Mapping ID: ${result.id}`
        );
    }

    console.log("");
    console.log("==============================================");
    console.log("CASH FLOW MAPPINGS SEED COMPLETED");
    console.log("==============================================");
    console.log("");
}

main()
    .catch((error) => {
        console.error("");
        console.error("CASH FLOW MAPPINGS SEED FAILED");
        console.error("");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });