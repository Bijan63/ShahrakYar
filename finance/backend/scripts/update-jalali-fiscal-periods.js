"use strict";

const prisma = require("../src/config/prisma");
const { Prisma } = require("@prisma/client");

const {
    DEFAULT_TIME_ZONE,
    getJalaliFiscalPeriodRange
} = require("../src/utils/jalaliDate");

const TARGET_CODES = [
    "1405",
    "1406",
    "1407",
    "1408"
];

async function main() {

    console.log("\n===== JALALI FISCAL PERIOD UPDATE =====");

    const result = await prisma.$transaction(
        async (tx) => {

            const periods =
                await tx.fiscalPeriod.findMany({
                    where: {
                        code: {
                            in: TARGET_CODES
                        }
                    }
                });

            if (periods.length !== TARGET_CODES.length) {
                throw new Error(
                    "Not all target fiscal periods exist"
                );
            }

            const periodsByCode = new Map(
                periods.map(period => [period.code, period])
            );

            const missingCodes = TARGET_CODES.filter(
                code => !periodsByCode.has(code)
            );

            if (missingCodes.length) {
                throw new Error(
                    `Missing periods: ${missingCodes.join(", ")}`
                );
            }

            const funds =
                await tx.fund.findMany({
                    where: {
                        fiscalPeriodId: {
                            in: periods.map(p => p.id)
                        }
                    },
                    select: {
                        id: true,
                        fiscalPeriodId: true
                    }
                });

            const prepared = [];

            // ------------------------------------------
            // PREFLIGHT: CHECK ALL FINANCIAL HISTORY
            // ------------------------------------------

            for (const period of periods) {

                const fundIds = funds
                    .filter(f => f.fiscalPeriodId === period.id)
                    .map(f => f.id);

                const financialAccountFilters = [
                    { fiscalPeriodId: period.id }
                ];

                if (fundIds.length) {
                    financialAccountFilters.push({
                        fundId: {
                            in: fundIds
                        }
                    });
                }

                const [
                    journalEntries,
                    openingBalances,
                    financialAccounts
                ] = await Promise.all([

                    tx.journalEntry.count({
                        where: {
                            fiscalPeriodId: period.id
                        }
                    }),

                    tx.openingBalance.count({
                        where: {
                            fiscalPeriodId: period.id
                        }
                    }),

                    tx.financialAccount.findMany({
                        where: {
                            OR: financialAccountFilters
                        },
                        select: {
                            id: true,
                            openingBalance: true
                        }
                    })

                ]);

                const financialAccountIds =
                    financialAccounts.map(a => a.id);

                const chargePayments =
                    financialAccountIds.length
                        ? await tx.chargePayment.count({
                            where: {
                                financialAccountId: {
                                    in: financialAccountIds
                                }
                            }
                        })
                        : 0;

                const nonZeroOpeningBalances =
                    financialAccounts.filter(
                        account =>
                            Number(account.openingBalance || 0) !== 0
                    ).length;

                const history = {
                    journalEntries,
                    openingBalances,
                    chargePayments,
                    nonZeroFinancialAccountOpeningBalances:
                        nonZeroOpeningBalances
                };

                console.log(
                    `Period ${period.code} history:`,
                    history
                );

                const hasHistory =
                    journalEntries > 0 ||
                    openingBalances > 0 ||
                    chargePayments > 0 ||
                    nonZeroOpeningBalances > 0;

                if (hasHistory) {
                    throw new Error(
                        `Financial history exists in period ${period.code}. Update cancelled.`
                    );
                }

                const range =
                    getJalaliFiscalPeriodRange(
                        Number(period.code),
                        DEFAULT_TIME_ZONE
                    );

                prepared.push({
                    period,
                    range
                });

            }

            // ------------------------------------------
            // CHECK INTERNAL PERIOD OVERLAPS
            // ------------------------------------------

            const chronological =
                [...prepared].sort(
                    (a, b) =>
                        a.range.startDate - b.range.startDate
                );

            for (let i = 1; i < chronological.length; i++) {

                if (
                    chronological[i - 1].range.endDate >=
                    chronological[i].range.startDate
                ) {
                    throw new Error(
                        "Target fiscal periods overlap"
                    );
                }

            }

            // ------------------------------------------
            // CHECK OVERLAP WITH OTHER PERIODS
            // ------------------------------------------

            const targetIds =
                prepared.map(x => x.period.id);

            const otherPeriods =
                await tx.fiscalPeriod.findMany({
                    where: {
                        id: {
                            notIn: targetIds
                        }
                    }
                });

            for (const target of prepared) {
                for (const other of otherPeriods) {

                    if (
                        target.range.startDate <= other.endDate &&
                        target.range.endDate >= other.startDate
                    ) {
                        throw new Error(
                            `Period ${target.period.code} overlaps with ${other.code}`
                        );
                    }

                }
            }

            // ------------------------------------------
            // UPDATE ALL FOUR PERIODS
            // ------------------------------------------

            const updates = [];

            for (const item of prepared) {

                const current = item.period;
                const expected = item.range;

                const changed =
                    current.startDate.getTime() !==
                        expected.startDate.getTime() ||
                    current.endDate.getTime() !==
                        expected.endDate.getTime();

                if (changed) {

                    await tx.fiscalPeriod.update({
                        where: {
                            id: current.id
                        },
                        data: {
                            startDate: expected.startDate,
                            endDate: expected.endDate
                        }
                    });

                }

                updates.push({
                    code: current.code,
                    changed,
                    startDate: expected.startDate,
                    endDate: expected.endDate,
                    days: expected.days
                });

            }

            // ------------------------------------------
            // VERIFY DATABASE VALUES
            // ------------------------------------------

            const saved =
                await tx.fiscalPeriod.findMany({
                    where: {
                        id: {
                            in: targetIds
                        }
                    }
                });

            for (const item of prepared) {

                const actual =
                    saved.find(
                        p => p.id === item.period.id
                    );

                if (
                    !actual ||
                    actual.startDate.getTime() !==
                        item.range.startDate.getTime() ||
                    actual.endDate.getTime() !==
                        item.range.endDate.getTime()
                ) {
                    throw new Error(
                        `Verification failed for period ${item.period.code}`
                    );
                }

            }

            return updates;

        },
        {
            isolationLevel:
                Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 10000,
            timeout: 30000
        }
    );

    console.log("\n===== UPDATE SUCCESS =====");
    console.log(JSON.stringify(
        result.map(item => ({
            code: item.code,
            changed: item.changed,
            startDate: item.startDate.toISOString(),
            endDate: item.endDate.toISOString(),
            days: item.days
        })),
        null,
        2
    ));

    console.log(
        "\nAll four fiscal periods verified successfully."
    );

}

main()
    .catch(error => {
        console.error("\n===== UPDATE FAILED =====");
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
