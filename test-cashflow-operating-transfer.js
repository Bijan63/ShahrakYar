// FINANCE_TEST_DATABASE_GUARD
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
  quiet: true
});

const EXPECTED_TEST_DATABASE = "shahrakyar_finance_test_operating";
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
const journalEntryService = require("./src/services/journalEntry.service");
const financialReportService = require("./src/services/financialReport.service");

const fiscalPeriodId =
    "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2";

const TEST_DATE =
    "2026-09-24T10:00:00.000Z";

async function getAccountByCode(code) {

    const account =
        await prisma.account.findFirst({

            where: {
                fiscalPeriodId,
                code
            },

            select: {
                id: true,
                code: true,
                name: true,
                type: true,
                cashFlowClassification: true,
                parentId: true,
                isActive: true
            }

        });

    if (!account) {

        throw new Error(
            `Account ${code} not found`
        );

    }

    if (!account.isActive) {

        throw new Error(
            `Account ${code} is inactive`
        );

    }

    if (account.parentId) {

        // leaf account is expected
        return account;

    }

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
                status: true,
                entryNumber: true
            }

        });

    if (existing) {

        console.log(
            `\nSKIP: ${entryNumber} already exists`
        );

        console.log(
            JSON.stringify(
                existing,
                null,
                2
            )
        );

        if (
            existing.status !== "POSTED"
        ) {

            console.log(
                `Posting existing entry ${entryNumber}...`
            );

            const posted =
                await journalEntryService.post(
                    existing.id
                );

            return posted;

        }

        return existing;

    }


    console.log(
        `\nCreating DRAFT: ${entryNumber}`
    );

    const draft =
        await journalEntryService.create({

            entryNumber,

            entryDate:
                TEST_DATE,

            description,

            fiscalPeriodId,

            lines

        });

    console.log(
        `Created DRAFT: ${draft.id}`
    );


    console.log(
        `Posting: ${entryNumber}`
    );

    const posted =
        await journalEntryService.post(
            draft.id
        );

    console.log(
        `POSTED: ${posted.id}`
    );

    return posted;
}


async function main() {

    console.log(
        "\n=============================================="
    );

    console.log(
        "CASH FLOW OPERATING + INTERNAL TRANSFER TEST"
    );

    console.log(
        "=============================================="
    );


    const bankMellat =
        await getAccountByCode("1101");

    const bankSaderat =
        await getAccountByCode("1102");

    const operatingExpense =
        await getAccountByCode("5100");


    console.log("\nAccounts:");

    console.log(
        JSON.stringify(
            {
                bankMellat,
                bankSaderat,
                operatingExpense
            },
            null,
            2
        )
    );


    // ==================================================
    // TEST 1 - OPERATING OUTFLOW
    // ==================================================

    await createAndPost({

        entryNumber:
            "JV-CF-TEST-OPEX-20260924",

        description:
            "تست Cash Flow - Operating Outflow",

        lines: [

            {
                accountId:
                    operatingExpense.id,

                description:
                    "هزینه جاری تست Cash Flow",

                debit:
                    1000000,

                credit:
                    0
            },

            {
                accountId:
                    bankMellat.id,

                description:
                    "پرداخت هزینه جاری از بانک ملت",

                debit:
                    0,

                credit:
                    1000000
            }

        ]

    });


    // ==================================================
    // TEST 2 - INTERNAL TRANSFER
    // ==================================================

    await createAndPost({

        entryNumber:
            "JV-CF-TEST-TRANSFER-20260924",

        description:
            "تست Cash Flow - Internal Transfer",

        lines: [

            {
                accountId:
                    bankSaderat.id,

                description:
                    "دریافت از بانک ملت",

                debit:
                    2000000,

                credit:
                    0
            },

            {
                accountId:
                    bankMellat.id,

                description:
                    "انتقال به بانک صادرات",

                debit:
                    0,

                credit:
                    2000000
            }

        ]

    });


    // ==================================================
    // RUN CASH FLOW REPORT
    // ==================================================

    console.log(
        "\n=============================================="
    );

    console.log(
        "CASH FLOW RESULT"
    );

    console.log(
        "=============================================="
    );


    const report =
        await financialReportService
            .getCashFlowStatement(
                fiscalPeriodId
            );


    console.log(
        "\nOperating:"
    );

    console.log(
        JSON.stringify(
            {
                inflowTotal:
                    report
                        .operatingActivities
                        .inflows
                        .total,

                outflowTotal:
                    report
                        .operatingActivities
                        .outflows
                        .total,

                netCashFlow:
                    report
                        .operatingActivities
                        .netCashFlow
            },
            null,
            2
        )
    );


    console.log(
        "\nInternal Transfers:"
    );

    console.log(
        JSON.stringify(
            {
                total:
                    report
                        .internalTransfers
                        .total,

                items:
                    report
                        .internalTransfers
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
        "\nCash Reconciliation:"
    );

    console.log(
        JSON.stringify(
            {
                openingCash:
                    report.openingCash,

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

                differenceAfterUnmapped:
                    report
                        .reconciliation
                        .differenceAfterUnmapped,

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
