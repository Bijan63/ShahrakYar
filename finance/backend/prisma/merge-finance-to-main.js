/**
 * ============================================================
 * ShahrakYar
 * Finance DB -> Main DB One-Time Data Merge
 * ============================================================
 *
 * Source:
 *   shahrakyar_finance
 *
 * Target:
 *   shahrakyar_v2
 *
 * IMPORTANT:
 *   - Source database is READ ONLY from this script.
 *   - Target insertion is performed inside ONE transaction.
 *   - If anything fails, the target transaction is rolled back.
 *   - Prisma migration history is NOT transferred.
 *
 * Expected source rows:
 *
 *   FiscalPeriod       4
 *   Fund               1
 *   Account           10
 *   PropertyAccount    1
 *   FinancialAccount   1
 *   JournalEntry      14
 *   JournalEntryLine  28
 *   OpeningBalance     3
 *
 * Total = 62
 * ============================================================
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const {
    PrismaClient: MainPrismaClient
} = require("../../../backend/node_modules/@prisma/client");

const {
    PrismaClient: FinancePrismaClient
} = require("../node_modules/@prisma/client");


// ============================================================
// Database configuration
// ============================================================

const MAIN_ENV_PATH = path.resolve(
    __dirname,
    "../../../backend/.env"
);

const FINANCE_ENV_PATH = path.resolve(
    __dirname,
    "../.env"
);

if (!fs.existsSync(MAIN_ENV_PATH)) {
    throw new Error(
        `Main .env not found: ${MAIN_ENV_PATH}`
    );
}

if (!fs.existsSync(FINANCE_ENV_PATH)) {
    throw new Error(
        `Finance .env not found: ${FINANCE_ENV_PATH}`
    );
}

const mainEnv = dotenv.parse(
    fs.readFileSync(MAIN_ENV_PATH, "utf8")
);

const financeEnv = dotenv.parse(
    fs.readFileSync(FINANCE_ENV_PATH, "utf8")
);

const MAIN_DATABASE_URL = mainEnv.DATABASE_URL;
const FINANCE_DATABASE_URL = financeEnv.DATABASE_URL;

if (!MAIN_DATABASE_URL) {
    throw new Error(
        "Main DATABASE_URL is missing."
    );
}

if (!FINANCE_DATABASE_URL) {
    throw new Error(
        "Finance DATABASE_URL is missing."
    );
}


// ============================================================
// Prisma Clients
// ============================================================

// DATABASE_IDENTITY_SAFETY_GUARD
function databaseIdentity(connectionString) {
    let url;

    try {
        url = new URL(connectionString);
    } catch {
        throw new Error("Invalid database connection URL.");
    }

    const database = decodeURIComponent(
        url.pathname.slice(1)
    );

    const rawHost = url.hostname.toLowerCase();
    const host = [
        "localhost", "127.0.0.1", "::1", "[::1]"
    ].includes(rawHost)
        ? "loopback"
        : rawHost;

    if (!database) {
        throw new Error("Database name is missing.");
    }

    return {
        host,
        port: url.port || "5432",
        database
    };
}

const mainDatabaseIdentity = databaseIdentity(MAIN_DATABASE_URL);
const financeDatabaseIdentity = databaseIdentity(FINANCE_DATABASE_URL);

if (
    mainDatabaseIdentity.host === financeDatabaseIdentity.host &&
    mainDatabaseIdentity.port === financeDatabaseIdentity.port &&
    mainDatabaseIdentity.database === financeDatabaseIdentity.database
) {
    throw new Error(
        "Unsafe merge configuration: source and target resolve " +
        "to the same database. Transfer refused."
    );
}

const mainPrisma = new MainPrismaClient({
    datasources: {
        db: {
            url: MAIN_DATABASE_URL
        }
    }
});

const financePrisma = new FinancePrismaClient({
    datasources: {
        db: {
            url: FINANCE_DATABASE_URL
        }
    }
});

// ============================================================
// Expected source counts
// ============================================================

const EXPECTED = {
    FiscalPeriod: 4,
    Fund: 1,
    Account: 10,
    PropertyAccount: 1,
    FinancialAccount: 1,
    JournalEntry: 14,
    JournalEntryLine: 28,
    OpeningBalance: 3
};


// ============================================================
// Helpers
// ============================================================

function log(message) {
    console.log(`[MERGE] ${message}`);
}


function fail(message) {
    throw new Error(message);
}


// ============================================================
// Source validation
// ============================================================

async function loadSourceData() {

    log("Reading Finance database...");

        const debugDatabase =
        await financePrisma.$queryRaw`
            SELECT current_database() AS database,
                   current_schema() AS schema
        `;

    const debugFiscalPeriodCount =
        await financePrisma.fiscalPeriod.count();

    console.log("[DEBUG] Finance connection:");
    console.table(debugDatabase);

    console.log(
        "[DEBUG] Finance FiscalPeriod count:",
        debugFiscalPeriodCount
    );
    const [
        fiscalPeriods,
        funds,
        accounts,
        propertyAccounts,
        financialAccounts,
        journalEntries,
        journalEntryLines,
        openingBalances
    ] = await Promise.all([

        financePrisma.fiscalPeriod.findMany({
            orderBy: {
                code: "asc"
            }
        }),

        financePrisma.fund.findMany({
            orderBy: {
                code: "asc"
            }
        }),

        financePrisma.account.findMany({
            orderBy: [
                {
                    parentId: "asc"
                },
                {
                    code: "asc"
                }
            ]
        }),

        financePrisma.propertyAccount.findMany({
            orderBy: {
                accountNumber: "asc"
            }
        }),

        financePrisma.financialAccount.findMany({
            orderBy: {
                code: "asc"
            }
        }),

        financePrisma.journalEntry.findMany({
            orderBy: {
                entryNumber: "asc"
            }
        }),

        financePrisma.journalEntryLine.findMany({
            orderBy: {
                createdAt: "asc"
            }
        }),

        financePrisma.openingBalance.findMany({
            orderBy: {
                createdAt: "asc"
            }
        })

    ]);


    const data = {
        fiscalPeriods,
        funds,
        accounts,
        propertyAccounts,
        financialAccounts,
        journalEntries,
        journalEntryLines,
        openingBalances
    };


    // --------------------------------------------------------
    // Count validation
    // --------------------------------------------------------

    const actual = {
        FiscalPeriod: fiscalPeriods.length,
        Fund: funds.length,
        Account: accounts.length,
        PropertyAccount: propertyAccounts.length,
        FinancialAccount: financialAccounts.length,
        JournalEntry: journalEntries.length,
        JournalEntryLine: journalEntryLines.length,
        OpeningBalance: openingBalances.length
    };


    log("Source row counts:");

    console.table(actual);


    for (const [table, expected] of Object.entries(EXPECTED)) {

        if (actual[table] !== expected) {

            fail(
                `Source count mismatch for ${table}: ` +
                `expected ${expected}, found ${actual[table]}`
            );

        }

    }


    // --------------------------------------------------------
    // Finance source referential checks
    // --------------------------------------------------------

    const fiscalPeriodIds =
        new Set(fiscalPeriods.map(x => x.id));

    const fundIds =
        new Set(funds.map(x => x.id));

    const accountIds =
        new Set(accounts.map(x => x.id));

    const journalEntryIds =
        new Set(journalEntries.map(x => x.id));


    for (const account of accounts) {

        if (!fiscalPeriodIds.has(account.fiscalPeriodId)) {

            fail(
                `Invalid Account.fiscalPeriodId: ${account.id}`
            );

        }


        if (
            account.parentId !== null &&
            !accountIds.has(account.parentId)
        ) {

            fail(
                `Invalid Account.parentId: ${account.id}`
            );

        }

    }


    for (const propertyAccount of propertyAccounts) {

        if (
            propertyAccount.fiscalPeriodId !== null &&
            !fiscalPeriodIds.has(propertyAccount.fiscalPeriodId)
        ) {

            fail(
                `Invalid PropertyAccount.fiscalPeriodId: ${propertyAccount.id}`
            );

        }


        if (
            propertyAccount.fundId !== null &&
            !fundIds.has(propertyAccount.fundId)
        ) {

            fail(
                `Invalid PropertyAccount.fundId: ${propertyAccount.id}`
            );

        }

    }


    for (const financialAccount of financialAccounts) {

        if (
            financialAccount.fiscalPeriodId !== null &&
            !fiscalPeriodIds.has(financialAccount.fiscalPeriodId)
        ) {

            fail(
                `Invalid FinancialAccount.fiscalPeriodId: ${financialAccount.id}`
            );

        }


        if (
            financialAccount.fundId !== null &&
            !fundIds.has(financialAccount.fundId)
        ) {

            fail(
                `Invalid FinancialAccount.fundId: ${financialAccount.id}`
            );

        }


        if (
            financialAccount.accountId !== null &&
            !accountIds.has(financialAccount.accountId)
        ) {

            fail(
                `Invalid FinancialAccount.accountId: ${financialAccount.id}`
            );

        }

    }


    for (const journalEntry of journalEntries) {

        if (!fiscalPeriodIds.has(journalEntry.fiscalPeriodId)) {

            fail(
                `Invalid JournalEntry.fiscalPeriodId: ${journalEntry.id}`
            );

        }


        if (
            journalEntry.fundId !== null &&
            !fundIds.has(journalEntry.fundId)
        ) {

            fail(
                `Invalid JournalEntry.fundId: ${journalEntry.id}`
            );

        }

    }


    for (const line of journalEntryLines) {

        if (!journalEntryIds.has(line.journalEntryId)) {

            fail(
                `Invalid JournalEntryLine.journalEntryId: ${line.id}`
            );

        }


        if (!accountIds.has(line.accountId)) {

            fail(
                `Invalid JournalEntryLine.accountId: ${line.id}`
            );

        }

    }


    for (const openingBalance of openingBalances) {

        if (!fiscalPeriodIds.has(openingBalance.fiscalPeriodId)) {

            fail(
                `Invalid OpeningBalance.fiscalPeriodId: ${openingBalance.id}`
            );

        }


        if (!accountIds.has(openingBalance.accountId)) {

            fail(
                `Invalid OpeningBalance.accountId: ${openingBalance.id}`
            );

        }

    }


    log("Source referential integrity: OK");


    return data;
}


// ============================================================
// Target preflight
// ============================================================

async function validateTargetIsEmpty() {

    log("Checking target Finance tables...");

    const counts = await Promise.all([

        mainPrisma.fiscalPeriod.count(),

        mainPrisma.fund.count(),

        mainPrisma.account.count(),

        mainPrisma.propertyAccount.count(),

        mainPrisma.financialAccount.count(),

        mainPrisma.journalEntry.count(),

        mainPrisma.journalEntryLine.count(),

        mainPrisma.openingBalance.count()

    ]);


    const names = [
        "FiscalPeriod",
        "Fund",
        "Account",
        "PropertyAccount",
        "FinancialAccount",
        "JournalEntry",
        "JournalEntryLine",
        "OpeningBalance"
    ];


    const targetCounts = {};


    names.forEach((name, index) => {

        targetCounts[name] = counts[index];

    });


    console.log("[MERGE] Target counts:");

    console.table(targetCounts);


    const nonEmpty = Object.entries(targetCounts)
        .filter(([, count]) => count !== 0);


    if (nonEmpty.length > 0) {

        console.error(
            "[MERGE] Target is NOT empty:"
        );

        console.table(
            Object.fromEntries(nonEmpty)
        );

        fail(
            "Target Finance tables are not empty. " +
            "Merge aborted."
        );

    }


    log("Target Finance tables are empty");


    // --------------------------------------------------------
    // Important PropertyAccount property validation
    // --------------------------------------------------------

    const propertyAccounts =
        await mainPrisma.propertyAccount.count();


    if (propertyAccounts !== 0) {

        fail(
            "Target PropertyAccount table is not empty."
        );

    }

}


// ============================================================
// UUID collision preflight
// ============================================================

async function validateIdCollisions(data) {

    log("Checking UUID collisions...");


    const tables = [

        ["FiscalPeriod", data.fiscalPeriods],
        ["Fund", data.funds],
        ["Account", data.accounts],
        ["PropertyAccount", data.propertyAccounts],
        ["FinancialAccount", data.financialAccounts],
        ["JournalEntry", data.journalEntries],
        ["JournalEntryLine", data.journalEntryLines],
        ["OpeningBalance", data.openingBalances]

    ];


    for (const [table, rows] of tables) {

        for (const row of rows) {

            const id = row.id;

            let exists = false;


            switch (table) {

                case "FiscalPeriod":
                    exists =
                        await mainPrisma.fiscalPeriod.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "Fund":
                    exists =
                        await mainPrisma.fund.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "Account":
                    exists =
                        await mainPrisma.account.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "PropertyAccount":
                    exists =
                        await mainPrisma.propertyAccount.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "FinancialAccount":
                    exists =
                        await mainPrisma.financialAccount.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "JournalEntry":
                    exists =
                        await mainPrisma.journalEntry.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "JournalEntryLine":
                    exists =
                        await mainPrisma.journalEntryLine.findUnique({
                            where: { id }
                        }) !== null;
                    break;


                case "OpeningBalance":
                    exists =
                        await mainPrisma.openingBalance.findUnique({
                            where: { id }
                        }) !== null;
                    break;

            }


            if (exists) {

                fail(
                    `UUID collision detected: ${table}.${id}`
                );

            }

        }

    }


    log("UUID collision check: OK");

}


// ============================================================
// Unique collision preflight
// ============================================================

async function validateUniqueCollisions(data) {

    log("Checking unique constraints...");


    for (const period of data.fiscalPeriods) {

        const existing =
            await mainPrisma.fiscalPeriod.findUnique({
                where: {
                    code: period.code
                }
            });


        if (existing) {

            fail(
                `FiscalPeriod.code collision: ${period.code}`
            );

        }

    }


    for (const fund of data.funds) {

        const existing =
            await mainPrisma.fund.findUnique({
                where: {
                    code: fund.code
                }
            });


        if (existing) {

            fail(
                `Fund.code collision: ${fund.code}`
            );

        }

    }


    for (const account of data.accounts) {

        const existing =
            await mainPrisma.account.findUnique({
                where: {
                    fiscalPeriodId_code: {
                        fiscalPeriodId: account.fiscalPeriodId,
                        code: account.code
                    }
                }
            });


        if (existing) {

            fail(
                `Account unique collision: ` +
                `${account.fiscalPeriodId}/${account.code}`
            );

        }

    }


    for (const propertyAccount of data.propertyAccounts) {

        const byNumber =
            await mainPrisma.propertyAccount.findUnique({
                where: {
                    accountNumber:
                        propertyAccount.accountNumber
                }
            });


        if (byNumber) {

            fail(
                `PropertyAccount.accountNumber collision: ` +
                `${propertyAccount.accountNumber}`
            );

        }


        const byProperty =
            await mainPrisma.propertyAccount.findUnique({
                where: {
                    propertyId:
                        propertyAccount.propertyId
                }
            });


        if (byProperty) {

            fail(
                `PropertyAccount.propertyId collision: ` +
                `${propertyAccount.propertyId}`
            );

        }

    }


    for (const financialAccount of data.financialAccounts) {

        const byCode =
            await mainPrisma.financialAccount.findUnique({
                where: {
                    code: financialAccount.code
                }
            });


        if (byCode) {

            fail(
                `FinancialAccount.code collision: ` +
                `${financialAccount.code}`
            );

        }


        if (financialAccount.accountId) {

            const byAccount =
                await mainPrisma.financialAccount.findUnique({
                    where: {
                        accountId:
                            financialAccount.accountId
                    }
                });


            if (byAccount) {

                fail(
                    `FinancialAccount.accountId collision: ` +
                    `${financialAccount.accountId}`
                );

            }

        }

    }


    for (const journalEntry of data.journalEntries) {

        const existing =
            await mainPrisma.journalEntry.findUnique({
                where: {
                    entryNumber:
                        journalEntry.entryNumber
                }
            });


        if (existing) {

            fail(
                `JournalEntry.entryNumber collision: ` +
                `${journalEntry.entryNumber}`
            );

        }

    }


    for (const openingBalance of data.openingBalances) {

        const existing =
            await mainPrisma.openingBalance.findUnique({
                where: {
                    fiscalPeriodId_accountId: {
                        fiscalPeriodId:
                            openingBalance.fiscalPeriodId,

                        accountId:
                            openingBalance.accountId
                    }
                }
            });


        if (existing) {

            fail(
                `OpeningBalance unique collision: ` +
                `${openingBalance.fiscalPeriodId}/` +
                `${openingBalance.accountId}`
            );

        }

    }


    log("Unique collision check: OK");

}


// ============================================================
// Account dependency ordering
// ============================================================

function sortAccountsForInsert(accounts) {

    const result = [];

    const pending =
        new Map(accounts.map(account => [
            account.id,
            account
        ]));


    while (pending.size > 0) {

        let insertedThisRound = false;


        for (const [id, account] of pending) {

            if (
                account.parentId === null ||
                !pending.has(account.parentId)
            ) {

                result.push(account);

                pending.delete(id);

                insertedThisRound = true;

            }

        }


        if (!insertedThisRound) {

            fail(
                "Unable to resolve Account.parentId dependency."
            );

        }

    }


    return result;
}


// ============================================================
// Main transfer
// ============================================================

async function transfer(data) {

    log("Starting MAIN transaction...");


    await mainPrisma.$transaction(
        async (tx) => {

            // ------------------------------------------------
            // 1. FiscalPeriod
            // ------------------------------------------------

            log("1/8 Inserting FiscalPeriod...");

            for (const row of data.fiscalPeriods) {

                await tx.fiscalPeriod.create({
                    data: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        startDate: row.startDate,
                        endDate: row.endDate,
                        status: row.status,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 2. Fund
            // ------------------------------------------------

            log("2/8 Inserting Fund...");

            for (const row of data.funds) {

                await tx.fund.create({
                    data: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        type: row.type,
                        description: row.description,
                        status: row.status,
                        fiscalPeriodId: row.fiscalPeriodId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 3. Account
            // ------------------------------------------------

            log("3/8 Inserting Account...");

            const sortedAccounts =
                sortAccountsForInsert(
                    data.accounts
                );


            for (const row of sortedAccounts) {

                await tx.account.create({
                    data: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        type: row.type,
                        description: row.description,
                        isActive: row.isActive,
                        parentId: row.parentId,
                        fiscalPeriodId: row.fiscalPeriodId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 4. PropertyAccount
            // ------------------------------------------------

            log("4/8 Inserting PropertyAccount...");

            for (const row of data.propertyAccounts) {

                await tx.propertyAccount.create({
                    data: {
                        id: row.id,
                        accountNumber: row.accountNumber,
                        propertyId: row.propertyId,
                        name: row.name,
                        status: row.status,
                        fiscalPeriodId: row.fiscalPeriodId,
                        fundId: row.fundId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 5. FinancialAccount
            // ------------------------------------------------

            log("5/8 Inserting FinancialAccount...");

            for (const row of data.financialAccounts) {

                await tx.financialAccount.create({
                    data: {
                        id: row.id,
                        code: row.code,
                        name: row.name,
                        type: row.type,
                        bankName: row.bankName,
                        accountNumber: row.accountNumber,
                        cardNumber: row.cardNumber,
                        iban: row.iban,
                        openingBalance: row.openingBalance,
                        status: row.status,
                        fiscalPeriodId: row.fiscalPeriodId,
                        fundId: row.fundId,
                        accountId: row.accountId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 6. JournalEntry
            // ------------------------------------------------

            log("6/8 Inserting JournalEntry...");

            for (const row of data.journalEntries) {

                await tx.journalEntry.create({
                    data: {
                        id: row.id,
                        entryNumber: row.entryNumber,
                        entryDate: row.entryDate,
                        description: row.description,
                        status: row.status,
                        fiscalPeriodId: row.fiscalPeriodId,
                        fundId: row.fundId,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 7. JournalEntryLine
            // ------------------------------------------------

            log("7/8 Inserting JournalEntryLine...");

            for (const row of data.journalEntryLines) {

                await tx.journalEntryLine.create({
                    data: {
                        id: row.id,
                        journalEntryId: row.journalEntryId,
                        accountId: row.accountId,
                        description: row.description,
                        debit: row.debit,
                        credit: row.credit,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            // ------------------------------------------------
            // 8. OpeningBalance
            // ------------------------------------------------

            log("8/8 Inserting OpeningBalance...");

            for (const row of data.openingBalances) {

                await tx.openingBalance.create({
                    data: {
                        id: row.id,
                        fiscalPeriodId: row.fiscalPeriodId,
                        accountId: row.accountId,
                        debit: row.debit,
                        credit: row.credit,
                        description: row.description,
                        status: row.status,
                        createdAt: row.createdAt,
                        updatedAt: row.updatedAt
                    }
                });

            }


            log("All 62 rows inserted inside transaction.");

        },
        {
            maxWait: 10000,
            timeout: 60000
        }
    );


    log("Transaction COMMITTED successfully.");

}


// ============================================================
// Post-merge verification
// ============================================================

async function verifyTarget() {

    log("Running post-merge verification...");


    const [
        fiscalPeriods,
        funds,
        accounts,
        propertyAccounts,
        financialAccounts,
        journalEntries,
        journalEntryLines,
        openingBalances
    ] = await Promise.all([

        mainPrisma.fiscalPeriod.count(),

        mainPrisma.fund.count(),

        mainPrisma.account.count(),

        mainPrisma.propertyAccount.count(),

        mainPrisma.financialAccount.count(),

        mainPrisma.journalEntry.count(),

        mainPrisma.journalEntryLine.count(),

        mainPrisma.openingBalance.count()

    ]);


    const actual = {
        FiscalPeriod: fiscalPeriods,
        Fund: funds,
        Account: accounts,
        PropertyAccount: propertyAccounts,
        FinancialAccount: financialAccounts,
        JournalEntry: journalEntries,
        JournalEntryLine: journalEntryLines,
        OpeningBalance: openingBalances
    };


    console.table(actual);


    for (const [table, expected] of Object.entries(EXPECTED)) {

        if (actual[table] !== expected) {

            fail(
                `Post-merge count mismatch for ${table}: ` +
                `expected ${expected}, found ${actual[table]}`
            );

        }

    }


    const total =
        Object.values(actual)
            .reduce(
                (sum, value) => sum + value,
                0
            );


    if (total !== 62) {

        fail(
            `Post-merge total mismatch: expected 62, found ${total}`
        );

    }


    log("Post-merge row counts: OK");


    // --------------------------------------------------------
    // Verify important records
    // --------------------------------------------------------

    const bankAccount =
        await mainPrisma.financialAccount.findUnique({
            where: {
                code: "BANK-MELLAT-1405"
            }
        });


    if (!bankAccount) {

        fail(
            "BANK-MELLAT-1405 was not found after merge."
        );

    }


    const propertyAccount =
        await mainPrisma.propertyAccount.findUnique({
            where: {
                accountNumber: "PROP-VILLA-002"
            }
        });


    if (!propertyAccount) {

        fail(
            "PROP-VILLA-002 was not found after merge."
        );

    }


    const atomicEntry =
        await mainPrisma.journalEntry.findUnique({
            where: {
                entryNumber:
                    "JV-1405-ATOMIC-TEST-001"
            },
            include: {
                lines: true
            }
        });


    if (!atomicEntry) {

        fail(
            "JV-1405-ATOMIC-TEST-001 was not found."
        );

    }


    if (atomicEntry.lines.length !== 2) {

        fail(
            `Atomic test journal expected 2 lines, ` +
            `found ${atomicEntry.lines.length}`
        );

    }


    log("Important records: OK");


    // --------------------------------------------------------
    // Verify journal balance
    // --------------------------------------------------------

    const journalEntriesWithLines =
        await mainPrisma.journalEntry.findMany({
            include: {
                lines: true
            }
        });


    let unbalanced = 0;


    for (const entry of journalEntriesWithLines) {

        const debit =
            entry.lines.reduce(
                (sum, line) =>
                    sum + Number(line.debit),
                0
            );


        const credit =
            entry.lines.reduce(
                (sum, line) =>
                    sum + Number(line.credit),
                0
            );


        if (
            Math.abs(debit - credit) > 0.000001
        ) {

            unbalanced++;

            console.error(
                `[UNBALANCED] ${entry.entryNumber}: ` +
                `debit=${debit}, credit=${credit}`
            );

        }

    }


    if (unbalanced !== 0) {

        fail(
            `${unbalanced} unbalanced journal entries detected.`
        );

    }


    log("Journal balance verification: OK");


    // --------------------------------------------------------
    // Opening balance verification
    // --------------------------------------------------------

    const openingTotals =
        await mainPrisma.openingBalance.aggregate({
            _sum: {
                debit: true,
                credit: true
            }
        });


    const debit =
        Number(openingTotals._sum.debit || 0);

    const credit =
        Number(openingTotals._sum.credit || 0);


    console.log(
        `[MERGE] OpeningBalance totalDebit=${debit}`
    );

    console.log(
        `[MERGE] OpeningBalance totalCredit=${credit}`
    );


    if (
        Math.abs(debit - credit) > 0.000001
    ) {

        fail(
            "OpeningBalance is not balanced."
        );

    }


    log("OpeningBalance balance: OK");


    // --------------------------------------------------------
    // Property relation verification
    // --------------------------------------------------------

    const property =
        await mainPrisma.property.findUnique({
            where: {
                id:
                    propertyAccount.propertyId
            }
        });


    if (!property) {

        fail(
            "Transferred PropertyAccount points to missing Property."
        );

    }


    console.log(
        `[MERGE] PropertyAccount ${propertyAccount.accountNumber} ` +
        `-> Property ${property.code}`
    );


    log("PropertyAccount -> Property verification: OK");


    log("================================================");
    log("POST-MERGE VERIFICATION SUCCESSFUL");
    log("================================================");

}


// ============================================================
// Main
// ============================================================

async function main() {

    console.log("");
    console.log("================================================");
    console.log("   ShahrakYar Finance -> Main Merge");
    console.log("================================================");
    console.log("");


    try {

        // ----------------------------------------------------
        // 1. Load Finance data
        // ----------------------------------------------------

        const data =
            await loadSourceData();


        // ----------------------------------------------------
        // 2. Verify target is empty
        // ----------------------------------------------------

        await validateTargetIsEmpty();


        // ----------------------------------------------------
        // 3. UUID collision check
        // ----------------------------------------------------

        await validateIdCollisions(data);


        // ----------------------------------------------------
        // 4. Unique collision check
        // ----------------------------------------------------

        await validateUniqueCollisions(data);


        log("================================================");
        log("ALL PREFLIGHT CHECKS PASSED");
        log("================================================");


        // ----------------------------------------------------
        // 5. Transfer
        // ----------------------------------------------------

        await transfer(data);


        // ----------------------------------------------------
        // 6. Verify
        // ----------------------------------------------------

        await verifyTarget();


        console.log("");
        console.log("================================================");
        console.log("   MERGE COMPLETED SUCCESSFULLY");
        console.log("================================================");
        console.log("");


    } catch (error) {

        console.error("");
        console.error("================================================");
        console.error("   MERGE FAILED");
        console.error("================================================");
        console.error("");

        console.error(
            error && error.stack
                ? error.stack
                : error
        );

        console.error("");
        console.error(
            "If the transaction had already started, " +
            "all target inserts were rolled back."
        );

        process.exitCode = 1;

    } finally {

        await financePrisma.$disconnect();

        await mainPrisma.$disconnect();

    }

}


main();