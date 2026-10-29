const prisma = require("./src/config/prisma");

async function main() {
  const fiscalPeriodId =
    "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2";

  const entries =
    await prisma.journalEntry.findMany({
      where: {
        fiscalPeriodId,
        status: "POSTED",
        lines: {
          some: {
            account: {
              code: {
                startsWith: "11"
              }
            }
          }
        }
      },
      select: {
        id: true,
        entryNumber: true,
        entryDate: true,
        description: true,
        status: true,
        lines: {
          select: {
            accountId: true,
            debit: true,
            credit: true,
            account: {
              select: {
                code: true,
                name: true,
                type: true,
                cashFlowClassification: true
              }
            }
          },
          orderBy: {
            id: "asc"
          }
        }
      },
      orderBy: {
        entryDate: "asc"
      }
    });

  console.log("\n==============================================");
  console.log("CASH FLOW SCENARIO AUDIT - 1405");
  console.log("==============================================");

  if (entries.length === 0) {
    console.log("\nNO POSTED CASH ENTRIES FOUND.");
    return;
  }

  for (const entry of entries) {
    console.log("\n----------------------------------------------");
    console.log(`Entry       : ${entry.entryNumber}`);
    console.log(`Date        : ${entry.entryDate.toISOString()}`);
    console.log(`Description : ${entry.description || "-"}`);

    console.log("\nLines:");

    for (const line of entry.lines) {
      console.log(
        JSON.stringify(
          {
            code: line.account.code,
            name: line.account.name,
            type: line.account.type,
            classification:
              line.account.cashFlowClassification,
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0)
          },
          null,
          2
        )
      );
    }

    const cashLines =
      entry.lines.filter(
        line =>
          line.account.code.startsWith("11")
      );

    const nonCashLines =
      entry.lines.filter(
        line =>
          !line.account.code.startsWith("11")
      );

    console.log("\nScenario:");

    if (
      cashLines.length >= 2 &&
      cashLines.some(line => Number(line.debit || 0) > 0) &&
      cashLines.some(line => Number(line.credit || 0) > 0)
    ) {
      console.log("  INTERNAL TRANSFER");
    }
    else {
      for (const line of nonCashLines) {
        console.log(
          `  Counterpart ${line.account.code} ` +
          `=> ${line.account.cashFlowClassification}`
        );
      }
    }
  }

  console.log("\n==============================================");
  console.log("SUMMARY");
  console.log("==============================================");

  const counts = {
    OPERATING: 0,
    INVESTING: 0,
    FINANCING: 0,
    NONE: 0
  };

  let internalTransfers = 0;

  for (const entry of entries) {
    const cashLines =
      entry.lines.filter(
        line =>
          line.account.code.startsWith("11")
      );

    const nonCashLines =
      entry.lines.filter(
        line =>
          !line.account.code.startsWith("11")
      );

    if (
      cashLines.length >= 2 &&
      cashLines.some(line => Number(line.debit || 0) > 0) &&
      cashLines.some(line => Number(line.credit || 0) > 0)
    ) {
      internalTransfers++;
      continue;
    }

    for (const line of nonCashLines) {
      const classification =
        line.account.cashFlowClassification || "NONE";

      if (counts[classification] !== undefined) {
        counts[classification]++;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        postedCashEntries: entries.length,
        counterpartClassifications: counts,
        internalTransfers
      },
      null,
      2
    )
  );
}

main()
  .catch(error => {
    console.error("\nAUDIT ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
