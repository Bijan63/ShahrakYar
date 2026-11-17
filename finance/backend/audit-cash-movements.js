const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const fiscalPeriodId = "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2";

  console.log("\n==============================================");
  console.log("CASH MOVEMENT AUDIT");
  console.log("==============================================");

  // --------------------------------------------------
  // 1. Load all 11xx accounts
  // --------------------------------------------------
  const allCashRangeAccounts = await prisma.account.findMany({
    where: {
      fiscalPeriodId,
      code: {
        startsWith: "11",
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      parentId: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  // An account is a PARENT if another account points to it
  // through parentId. Otherwise it is a LEAF.
  const parentIds = new Set(
    allCashRangeAccounts
      .map(a => a.parentId)
      .filter(Boolean)
  );

  const cashAccounts = allCashRangeAccounts.filter(
    a => !parentIds.has(a.id)
  );

  const parentAccounts = allCashRangeAccounts.filter(
    a => parentIds.has(a.id)
  );

  console.log("\nCash Accounts (11xx):");

  for (const a of allCashRangeAccounts) {
    const role = parentIds.has(a.id) ? "PARENT" : "LEAF";
    console.log(
      `${a.code} | ${a.name} | ${role} | parentId=${a.parentId ?? "NULL"}`
    );
  }

  console.log("\nDetected Cash LEAF Accounts:");

  for (const a of cashAccounts) {
    console.log(
      `${a.code} | ${a.name} | ${a.id}`
    );
  }

  const cashIds = cashAccounts.map(a => a.id);

  if (cashIds.length === 0) {
    throw new Error("No cash leaf accounts were detected.");
  }

  // --------------------------------------------------
  // 2. Fetch POSTED journal lines on cash accounts
  // --------------------------------------------------
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: {
        in: cashIds,
      },
      journalEntry: {
        fiscalPeriodId,
        status: "POSTED",
      },
    },
    select: {
      id: true,
      journalEntryId: true,
      accountId: true,
      debit: true,
      credit: true,

      account: {
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          cashFlowClassification: true,
          parentId: true,
        },
      },

      journalEntry: {
        select: {
          id: true,
          entryNumber: true,
          entryDate: true,
          description: true,
          status: true,

          lines: {
            select: {
              id: true,
              accountId: true,
              debit: true,
              credit: true,

              account: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  type: true,
                  cashFlowClassification: true,
                  parentId: true,
                },
              },
            },
          },
        },
      },
    },

    orderBy: [
      {
        journalEntry: {
          entryDate: "asc",
        },
      },
      {
        journalEntryId: "asc",
      },
    ],
  });

  console.log("\n==============================================");
  console.log("POSTED CASH JOURNAL ENTRIES");
  console.log("==============================================");

  let totalCashDebit = 0;
  let totalCashCredit = 0;

  for (const line of lines) {
    const counterpartLines =
      line.journalEntry.lines.filter(
        x => x.accountId !== line.accountId
      );

    totalCashDebit += Number(line.debit || 0);
    totalCashCredit += Number(line.credit || 0);

    console.log("\n----------------------------------------------");
    console.log(
      `${line.journalEntry.entryNumber} | ${line.journalEntry.entryDate.toISOString()}`
    );
    console.log(
      `Description: ${line.journalEntry.description}`
    );
    console.log(
      `Status: ${line.journalEntry.status}`
    );

    console.log(
      `Cash: ${line.account.code} ${line.account.name}` +
      ` | Debit=${line.debit} | Credit=${line.credit}`
    );

    console.log(
      `Cash Classification: ${line.account.cashFlowClassification}`
    );

    if (counterpartLines.length === 0) {
      console.log("Counterparts: NONE");
    } else {
      console.log("Counterparts:");

      for (const cp of counterpartLines) {
        console.log(
          `  ${cp.account.code} ${cp.account.name}` +
          ` | Debit=${cp.debit}` +
          ` | Credit=${cp.credit}` +
          ` | Type=${cp.account.accountType}` +
          ` | CF=${cp.account.cashFlowClassification}`
        );
      }
    }
  }

  // --------------------------------------------------
  // 3. Totals
  // --------------------------------------------------
  console.log("\n==============================================");
  console.log("CASH JOURNAL TOTALS");
  console.log("==============================================");

  console.log(`Cash Debit Total  : ${totalCashDebit.toLocaleString()}`);
  console.log(`Cash Credit Total : ${totalCashCredit.toLocaleString()}`);
  console.log(
    `Net Cash Movement : ${(totalCashDebit - totalCashCredit).toLocaleString()}`
  );

  // --------------------------------------------------
  // 4. Highlight the four Investing / Financing tests
  // --------------------------------------------------
  const targetEntries = [
    "JV-1405-INV-001",
    "JV-1405-INV-002",
    "JV-1405-FIN-001",
    "JV-1405-FIN-002",
  ];

  console.log("\n==============================================");
  console.log("INVESTING / FINANCING TEST DOCUMENTS");
  console.log("==============================================");

  for (const target of targetEntries) {
    const matches = lines.filter(
      l => l.journalEntry.entryNumber === target
    );

    console.log(`\n${target}`);

    if (matches.length === 0) {
      console.log("  NOT FOUND");
      continue;
    }

    for (const line of matches) {
      console.log(
        `  Cash ${line.account.code}` +
        ` | Debit=${line.debit}` +
        ` | Credit=${line.credit}`
      );

      for (
        const cp of line.journalEntry.lines.filter(
          x => x.accountId !== line.accountId
        )
      ) {
        console.log(
          `  Counterpart ${cp.account.code}` +
          ` | Debit=${cp.debit}` +
          ` | Credit=${cp.credit}` +
          ` | CF=${cp.account.cashFlowClassification}`
        );
      }
    }
  }

  console.log("\n==============================================");
  console.log("END AUDIT");
  console.log("==============================================\n");
}

main()
  .catch(err => {
    console.error("\nAUDIT ERROR:");
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
