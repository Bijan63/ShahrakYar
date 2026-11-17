// FINANCE_TEST_DATABASE_GUARD
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
  quiet: true
});

const EXPECTED_TEST_DATABASE = "shahrakyar_finance_test";
const configuredDatabaseUrl = process.env.DATABASE_URL;

if (!configuredDatabaseUrl) {
  console.error("REFUSING TO RUN: DATABASE_URL is not configured.");
  process.exit(1);
}

let actualDatabase;

try {
  actualDatabase = decodeURIComponent(
    new URL(configuredDatabaseUrl).pathname.slice(1)
  );
} catch {
  console.error("REFUSING TO RUN: DATABASE_URL is invalid.");
  process.exit(1);
}

if (actualDatabase !== EXPECTED_TEST_DATABASE) {
  console.error(
    `REFUSING TO RUN: expected database "${EXPECTED_TEST_DATABASE}", ` +
    `received "${actualDatabase}".`
  );
  process.exit(1);
}

console.log(`Database safety guard passed: ${actualDatabase}`);

const prisma = require("./src/config/prisma");
const journalEntryService =
    require("./src/services/journalEntry.service");
const financialReportService =
    require("./src/services/financialReport.service");

const fiscalPeriodId =
    "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2";

const testDate =
    "2026-09-24T11:00:00.000Z";

async function getOrCreateAccount({
    code,
    name,
    type,
    parentId = null,
    cashFlowClassification = "NONE"
}) {
    const existing =
        await prisma.account.findFirst({
            where: {
                fiscalPeriodId,
                code
            }
        });

    if (existing) {
        console.log(
            `EXISTS: ${code} ${name}`
        );

        const updated =
            await prisma.account.update({
                where: {
                    id: existing.id
                },
                data: {
                    cashFlowClassification,
                    isActive: true
                },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    type: true,
                    parentId: true,
                    isActive: true,
                    cashFlowClassification: true
                }
            });

        return updated;
    }

    const account =
        await prisma.account.create({
            data: {
                code,
                name,
                type,
                parentId,
                fiscalPeriodId,
                isActive: true,
                cashFlowClassification
            },
            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                parentId: true,
                isActive: true,
                cashFlowClassification: true
            }
        });

    console.log(
        `CREATED: ${code} ${name}`
    );

    return account;
}


async function createAndPost({
    entryNumber,
    description,
    lines
}) {
    const existing =
        await prisma.journalEntry.findFirst({
            where: {
                entryNumber
            },
            select: {
                id: true,
                entryNumber: true,
                status: true
            }
        });

    if (existing) {
        console.log(
            `EXISTS ENTRY: ${entryNumber}`
        );

        if (existing.status === "POSTED") {
            return existing;
        }

        return journalEntryService.post(
            existing.id
        );
    }

    const draft =
        await journalEntryService.create({
            entryNumber,
            entryDate: testDate,
            description,
            fiscalPeriodId,
            lines
        });

    console.log(
        `CREATED DRAFT: ${entryNumber} ${draft.id}`
    );

    const posted =
        await journalEntryService.post(
            draft.id
        );

    console.log(
        `POSTED: ${entryNumber} ${posted.id}`
    );

    return posted;
}


async function main() {

    console.log(
        "\n=============================================="
    );

    console.log(
        "CASH FLOW INVESTING + FINANCING TEST"
    );

    console.log(
        "=============================================="
    );


    // --------------------------------------------------
    // Existing cash account
    // --------------------------------------------------

    const bankMellat =
        await prisma.account.findFirst({
            where: {
                fiscalPeriodId,
                code: "1101"
            }
        });

    if (!bankMellat) {
        throw new Error(
            "Account 1101 not found"
        );
    }


    // --------------------------------------------------
    // Parent accounts
    // --------------------------------------------------

    const fixedAssetsParent =
        await getOrCreateAccount({
            code: "1500",
            name: "دارایی‌های ثابت",
            type: "ASSET",
            cashFlowClassification: "NONE"
        });


    const financingParent =
        await getOrCreateAccount({
            code: "2100",
            name: "تسهیلات مالی",
            type: "LIABILITY",
            cashFlowClassification: "NONE"
        });


    // --------------------------------------------------
    // Leaf accounts
    // --------------------------------------------------

    const fixedAssets =
        await getOrCreateAccount({
            code: "1501",
            name: "تجهیزات و تأسیسات",
            type: "ASSET",
            parentId: fixedAssetsParent.id,
            cashFlowClassification: "INVESTING"
        });


    const bankLoan =
        await getOrCreateAccount({
            code: "2101",
            name: "تسهیلات و وام بانکی",
            type: "LIABILITY",
            parentId: financingParent.id,
            cashFlowClassification: "FINANCING"
        });


    console.log(
        "\nAccounts used for test:"
    );

    console.log(
        JSON.stringify(
            {
                bankMellat,
                fixedAssets,
                bankLoan
            },
            null,
            2
        )
    );


    // ==================================================
    // TEST 1 - INVESTING OUTFLOW
    // ==================================================

    await createAndPost({

        entryNumber:
            "JV-CF-TEST-INVESTING-20260924",

        description:
            "تست Cash Flow - Investing Outflow",

        lines: [

            {
                accountId:
                    fixedAssets.id,

                description:
                    "خرید تجهیزات و تأسیسات",

                debit:
                    5000000,

                credit:
                    0
            },

            {
                accountId:
                    bankMellat.id,

                description:
                    "پرداخت خرید تجهیزات از بانک ملت",

                debit:
                    0,

                credit:
                    5000000
            }

        ]

    });


    // ==================================================
    // TEST 2 - FINANCING INFLOW
    // ==================================================

    await createAndPost({

        entryNumber:
            "JV-CF-TEST-FINANCING-20260924",

        description:
            "تست Cash Flow - Financing Inflow",

        lines: [

            {
                accountId:
                    bankMellat.id,

                description:
                    "دریافت تسهیلات بانکی",

                debit:
                    10000000,

                credit:
                    0
            },

            {
                accountId:
                    bankLoan.id,

                description:
                    "ثبت تسهیلات و وام بانکی",

                debit:
                    0,

                credit:
                    10000000
            }

        ]

    });


    // ==================================================
    // CASH FLOW REPORT
    // ==================================================

    const report =
        await financialReportService
            .getCashFlowStatement(
                fiscalPeriodId
            );


    console.log(
        "\n=============================================="
    );

    console.log(
        "CASH FLOW RESULT"
    );

    console.log(
        "=============================================="
    );


    console.log(
        "\nInvesting:"
    );

    console.log(
        JSON.stringify(
            {
                inflowTotal:
                    report
                        .investingActivities
                        .inflows
                        .total,

                outflowTotal:
                    report
                        .investingActivities
                        .outflows
                        .total,

                netCashFlow:
                    report
                        .investingActivities
                        .netCashFlow,

                items:
                    report
                        .investingActivities
                        .outflows
                        .items
            },
            null,
            2
        )
    );


    console.log(
        "\nFinancing:"
    );

    console.log(
        JSON.stringify(
            {
                inflowTotal:
                    report
                        .financingActivities
                        .inflows
                        .total,

                outflowTotal:
                    report
                        .financingActivities
                        .outflows
                        .total,

                netCashFlow:
                    report
                        .financingActivities
                        .netCashFlow,

                items:
                    report
                        .financingActivities
                        .inflows
                        .items
            },
            null,
            2
        )
    );


    console.log(
        "\nUnmapped:"
    );

    console.log(
        JSON.stringify(
            {
                total:
                    report
                        .unmappedCashMovements
                        .total,

                netCashFlow:
                    report
                        .unmappedCashMovements
                        .netCashFlow,

                count:
                    report
                        .reconciliation
                        .unmappedCashMovementCount,

                classificationComplete:
                    report
                        .reconciliation
                        .isClassificationComplete
            },
            null,
            2
        )
    );


    console.log(
        "\nReconciliation:"
    );

    console.log(
        JSON.stringify(
            {
                openingCash:
                    report.openingCash,

                netOperating:
                    report
                        .operatingActivities
                        .netCashFlow,

                netInvesting:
                    report
                        .investingActivities
                        .netCashFlow,

                netFinancing:
                    report
                        .financingActivities
                        .netCashFlow,

                internalTransferTotal:
                    report
                        .internalTransfers
                        .total,

                netChangeInCash:
                    report.netChangeInCash,

                closingCash:
                    report.closingCash,

                ledgerClosingCash:
                    report
                        .reconciliation
                        .ledgerClosingCash,

                difference:
                    report
                        .reconciliation
                        .difference,

                isReconciled:
                    report
                        .reconciliation
                        .isReconciled
            },
            null,
            2
        )
    );


    console.log(
        "\n=============================================="
    );

    console.log(
        "TEST COMPLETE"
    );

    console.log(
        "==============================================\n"
    );
}


main()
    .catch(error => {

        console.error(
            "\nTEST ERROR:"
        );

        console.error(error);

        process.exitCode = 1;

    })
    .finally(async () => {

        await prisma.$disconnect();

    });
