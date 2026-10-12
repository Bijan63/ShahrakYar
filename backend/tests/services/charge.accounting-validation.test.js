jest.mock("../../src/config/prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../src/repositories/charge.repository", () => ({}));

jest.mock("../../src/repositories/unitAccount.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireComplexAccess: jest.fn(),
}));

const chargeService =
    require("../../src/services/charge.service");

const PERIOD_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_PERIOD_ID = "22222222-2222-4222-8222-222222222222";
const ACCOUNT_ID = "33333333-3333-4333-8333-333333333333";

function makeClient() {
    return {
        fiscalPeriod: {
            findUnique: jest.fn(),
        },
        accountingConfiguration: {
            findUnique: jest.fn(),
        },
        account: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
    };
}

function activePeriod(overrides = {}) {
    return {
        id: PERIOD_ID,
        code: "TEST-1405",
        name: "Test Fiscal Period",
        status: "ACTIVE",
        startDate: new Date("2026-03-21T00:00:00.000Z"),
        endDate: new Date("2027-03-20T23:59:59.999Z"),
        ...overrides,
    };
}

function postingAccount(overrides = {}) {
    return {
        id: ACCOUNT_ID,
        code: "1201",
        name: "Test Receivable",
        type: "ASSET",
        isActive: true,
        fiscalPeriodId: PERIOD_ID,
        ...overrides,
    };
}

describe("ChargeService accounting validation", () => {
    let client;

    beforeEach(() => {
        jest.clearAllMocks();
        client = makeClient();
    });

    describe("validateFiscalPeriod", () => {
        test("rejects a missing fiscal period ID", async () => {
            await expect(
                chargeService.validateFiscalPeriod(null, client)
            ).rejects.toMatchObject({
                message: "Fiscal period ID is required.",
                statusCode: 400,
            });

            expect(client.fiscalPeriod.findUnique)
                .not.toHaveBeenCalled();
        });

        test("rejects a malformed fiscal period ID", async () => {
            await expect(
                chargeService.validateFiscalPeriod("not-a-uuid", client)
            ).rejects.toMatchObject({
                message: "Invalid fiscal period ID.",
                statusCode: 400,
            });

            expect(client.fiscalPeriod.findUnique)
                .not.toHaveBeenCalled();
        });

        test("returns 404 when the fiscal period does not exist", async () => {
            client.fiscalPeriod.findUnique.mockResolvedValue(null);

            await expect(
                chargeService.validateFiscalPeriod(PERIOD_ID, client)
            ).rejects.toMatchObject({
                message: "Fiscal period not found.",
                statusCode: 404,
            });
        });

        test("rejects a fiscal period that is not active", async () => {
            client.fiscalPeriod.findUnique.mockResolvedValue(
                activePeriod({ status: "CLOSED" })
            );

            await expect(
                chargeService.validateFiscalPeriod(PERIOD_ID, client)
            ).rejects.toMatchObject({
                message: "Fiscal period is not active.",
                statusCode: 400,
            });
        });

        test("returns an active fiscal period", async () => {
            const period = activePeriod();
            client.fiscalPeriod.findUnique.mockResolvedValue(period);

            await expect(
                chargeService.validateFiscalPeriod(PERIOD_ID, client)
            ).resolves.toBe(period);

            expect(client.fiscalPeriod.findUnique).toHaveBeenCalledWith({
                where: { id: PERIOD_ID },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                },
            });
        });
    });

    describe("getAccountingConfiguration", () => {
        test("rejects a missing accounting configuration", async () => {
            client.accountingConfiguration.findUnique
                .mockResolvedValue(null);

            await expect(
                chargeService.getAccountingConfiguration(
                    client,
                    PERIOD_ID
                )
            ).rejects.toMatchObject({
                message:
                    "Accounting configuration for the fiscal period was not found.",
                statusCode: 400,
            });
        });

        test("rejects a missing receivable account configuration", async () => {
            client.accountingConfiguration.findUnique.mockResolvedValue({
                id: "config-1",
                fiscalPeriodId: PERIOD_ID,
                chargeReceivableAccountId: null,
                chargeRevenueAccountId: ACCOUNT_ID,
            });

            await expect(
                chargeService.getAccountingConfiguration(
                    client,
                    PERIOD_ID
                )
            ).rejects.toMatchObject({
                message: "Charge receivable account is not configured.",
                statusCode: 400,
            });
        });

        test("rejects a missing revenue account configuration", async () => {
            client.accountingConfiguration.findUnique.mockResolvedValue({
                id: "config-1",
                fiscalPeriodId: PERIOD_ID,
                chargeReceivableAccountId: ACCOUNT_ID,
                chargeRevenueAccountId: null,
            });

            await expect(
                chargeService.getAccountingConfiguration(
                    client,
                    PERIOD_ID
                )
            ).rejects.toMatchObject({
                message: "Charge revenue account is not configured.",
                statusCode: 400,
            });
        });

        test("returns a complete accounting configuration", async () => {
            const configuration = {
                id: "config-1",
                fiscalPeriodId: PERIOD_ID,
                chargeReceivableAccountId: ACCOUNT_ID,
                chargeRevenueAccountId: OTHER_PERIOD_ID,
            };

            client.accountingConfiguration.findUnique
                .mockResolvedValue(configuration);

            await expect(
                chargeService.getAccountingConfiguration(
                    client,
                    PERIOD_ID
                )
            ).resolves.toBe(configuration);

            expect(client.accountingConfiguration.findUnique)
                .toHaveBeenCalledWith({
                    where: { fiscalPeriodId: PERIOD_ID },
                    select: {
                        id: true,
                        fiscalPeriodId: true,
                        chargeReceivableAccountId: true,
                        chargeRevenueAccountId: true,
                    },
                });
        });
    });

    describe("validatePostingAccount", () => {
        const fieldName = "Charge receivable account";

        async function validate(account, child = null) {
            client.account.findUnique.mockResolvedValue(account);
            client.account.findFirst.mockResolvedValue(child);

            return chargeService.validatePostingAccount(
                client,
                ACCOUNT_ID,
                PERIOD_ID,
                "ASSET",
                fieldName
            );
        }

        test("rejects an account that does not exist", async () => {
            await expect(
                validate(null)
            ).rejects.toMatchObject({
                message: `${fieldName} was not found.`,
                statusCode: 400,
            });

            expect(client.account.findFirst).not.toHaveBeenCalled();
        });

        test("rejects an inactive account", async () => {
            await expect(
                validate(postingAccount({ isActive: false }))
            ).rejects.toMatchObject({
                message: `${fieldName} is inactive.`,
                statusCode: 400,
            });

            expect(client.account.findFirst).not.toHaveBeenCalled();
        });

        test("rejects an account from a different fiscal period", async () => {
            await expect(
                validate(postingAccount({
                    fiscalPeriodId: OTHER_PERIOD_ID,
                }))
            ).rejects.toMatchObject({
                message: `${fieldName} belongs to a different fiscal period.`,
                statusCode: 400,
            });
        });

        test("rejects an account with the wrong account type", async () => {
            await expect(
                validate(postingAccount({ type: "REVENUE" }))
            ).rejects.toMatchObject({
                message: `${fieldName} must be ASSET.`,
                statusCode: 400,
            });
        });

        test("rejects a parent account that has child accounts", async () => {
            await expect(
                validate(
                    postingAccount(),
                    { id: "child-account-id" }
                )
            ).rejects.toMatchObject({
                message: `${fieldName} must be a posting account.`,
                statusCode: 400,
            });
        });

        test("accepts an active posting account of the correct type and period", async () => {
            const account = postingAccount();

            const result = await validate(account);

            expect(result).toEqual(account);

            expect(client.account.findFirst).toHaveBeenCalledWith({
                where: { parentId: ACCOUNT_ID },
                select: { id: true },
            });
        });
    });
});
