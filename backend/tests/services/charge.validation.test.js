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

const chargeService = require("../../src/services/charge.service");
const unitAccountRepository =
    require("../../src/repositories/unitAccount.repository");
const accessService =
    require("../../src/services/access.service");

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const COMPLEX_ID = "22222222-2222-4222-8222-222222222222";

function captureError(callback) {
    try {
        callback();
    } catch (error) {
        return error;
    }

    throw new Error("Expected the function to throw an error.");
}

describe("ChargeService input validation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("isValidUUID", () => {
        test("accepts a valid UUID", () => {
            expect(chargeService.isValidUUID(VALID_UUID)).toBe(true);
        });

        test.each([
            ["undefined", undefined],
            ["null", null],
            ["empty string", ""],
            ["non-string", 123],
            ["malformed UUID", "not-a-uuid"],
            ["invalid UUID version", "11111111-1111-0111-8111-111111111111"],
        ])("rejects %s", (_label, value) => {
            expect(chargeService.isValidUUID(value)).toBe(false);
        });
    });

    describe("validateChargeType", () => {
        test.each([
            "MONTHLY",
            "QUARTERLY",
            "ANNUAL",
            "SPECIAL",
            "UTILITY",
            "OTHER",
        ])("accepts type %s", type => {
            expect(() => chargeService.validateChargeType(type))
                .not.toThrow();
        });

        test.each([
            undefined,
            null,
            "",
            "monthly",
            "INVALID",
        ])("rejects invalid type %s", type => {
            const error = captureError(() =>
                chargeService.validateChargeType(type)
            );

            expect(error).toMatchObject({
                message: "Invalid charge type.",
                statusCode: 400,
            });
        });
    });

    describe("validatePeriod", () => {
        test("accepts a valid year with no month", () => {
            expect(() => chargeService.validatePeriod(1405))
                .not.toThrow();
        });

        test.each([1, 6, 12])("accepts month %s", month => {
            expect(() => chargeService.validatePeriod(1405, month))
                .not.toThrow();
        });

        test.each([undefined, null])(
            "requires a year when year is %s",
            year => {
                const error = captureError(() =>
                    chargeService.validatePeriod(year)
                );

                expect(error).toMatchObject({
                    message: "Period year is required.",
                    statusCode: 400,
                });
            }
        );

        test.each([
            1299,
            1501,
            1405.5,
            "1405",
        ])("rejects invalid year %s", year => {
            const error = captureError(() =>
                chargeService.validatePeriod(year)
            );

            expect(error).toMatchObject({
                message: "Invalid period year.",
                statusCode: 400,
            });
        });

        test.each([
            0,
            13,
            1.5,
            "6",
        ])("rejects invalid month %s", month => {
            const error = captureError(() =>
                chargeService.validatePeriod(1405, month)
            );

            expect(error).toMatchObject({
                message: "Period month must be between 1 and 12.",
                statusCode: 400,
            });
        });

        test("accepts a null month", () => {
            expect(() => chargeService.validatePeriod(1405, null))
                .not.toThrow();
        });
    });

    describe("validateAmount", () => {
        test("returns a number for a numeric string", () => {
            expect(chargeService.validateAmount("1250000"))
                .toBe(1250000);
        });

        test("accepts a positive number", () => {
            expect(chargeService.validateAmount(500))
                .toBe(500);
        });

        test.each([undefined, null, ""])(
            "rejects missing amount %s",
            amount => {
                const error = captureError(() =>
                    chargeService.validateAmount(amount)
                );

                expect(error).toMatchObject({
                    message: "Charge amount is required.",
                    statusCode: 400,
                });
            }
        );

        test.each([
            0,
            -1,
            "0",
            "-100",
            "not-a-number",
            NaN,
            Infinity,
            -Infinity,
        ])("rejects invalid amount %s", amount => {
            const error = captureError(() =>
                chargeService.validateAmount(amount)
            );

            expect(error).toMatchObject({
                message: "Charge amount must be greater than zero.",
                statusCode: 400,
            });
        });
    });

    describe("validateDescription", () => {
        test("trims surrounding whitespace", () => {
            expect(
                chargeService.validateDescription("  Monthly charge  ")
            ).toBe("Monthly charge");
        });

        test.each([
            undefined,
            null,
            "",
            "   ",
            123,
        ])("rejects invalid description %s", description => {
            const error = captureError(() =>
                chargeService.validateDescription(description)
            );

            expect(error).toMatchObject({
                message: "Charge description is required.",
                statusCode: 400,
            });
        });
    });

    describe("getUnitAccount", () => {
        test("rejects an invalid account ID before querying the repository", async () => {
            await expect(
                chargeService.getUnitAccount("invalid-id")
            ).rejects.toMatchObject({
                message: "Invalid unit account ID.",
                statusCode: 400,
            });

            expect(unitAccountRepository.findById)
                .not.toHaveBeenCalled();
        });

        test("returns a found account", async () => {
            const account = {
                id: VALID_UUID,
                isActive: true,
            };

            unitAccountRepository.findById.mockResolvedValue(account);

            await expect(
                chargeService.getUnitAccount(VALID_UUID)
            ).resolves.toBe(account);

            expect(unitAccountRepository.findById)
                .toHaveBeenCalledWith(VALID_UUID);
        });

        test("returns 404 when the account does not exist", async () => {
            unitAccountRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.getUnitAccount(VALID_UUID)
            ).rejects.toMatchObject({
                message: "Unit account not found.",
                statusCode: 404,
            });
        });
    });

    describe("validateUnitAccountAccess", () => {
        const account = {
            unit: {
                building: {
                    complexId: COMPLEX_ID,
                },
                property: null,
            },
        };

        test("rejects a missing user", async () => {
            await expect(
                chargeService.validateUnitAccountAccess(null, account)
            ).rejects.toMatchObject({
                message: "Authentication required.",
                statusCode: 401,
            });
        });

        test("allows ADMIN without a complex-level lookup", async () => {
            await expect(
                chargeService.validateUnitAccountAccess(
                    { id: "admin-1", role: "ADMIN" },
                    account
                )
            ).resolves.toBeUndefined();

            expect(accessService.requireComplexAccess)
                .not.toHaveBeenCalled();
        });

        test("rejects a USER", async () => {
            await expect(
                chargeService.validateUnitAccountAccess(
                    { id: "user-1", role: "USER" },
                    account
                )
            ).rejects.toMatchObject({
                message: "Access denied.",
                statusCode: 403,
            });
        });

        test("rejects a MANAGER when the account has no complex", async () => {
            await expect(
                chargeService.validateUnitAccountAccess(
                    { id: "manager-1", role: "MANAGER" },
                    { unit: { building: null, property: null } }
                )
            ).rejects.toMatchObject({
                message: "Unit account is not associated with a complex.",
                statusCode: 400,
            });

            expect(accessService.requireComplexAccess)
                .not.toHaveBeenCalled();
        });

        test("checks the assigned complex for a MANAGER", async () => {
            const manager = {
                id: "manager-1",
                role: "MANAGER",
            };

            accessService.requireComplexAccess.mockResolvedValue(true);

            await expect(
                chargeService.validateUnitAccountAccess(
                    manager,
                    account
                )
            ).resolves.toBeUndefined();

            expect(accessService.requireComplexAccess)
                .toHaveBeenCalledWith(manager, COMPLEX_ID);
        });

        test("propagates a complex access denial", async () => {
            const denied = new Error("Forbidden.");
            denied.statusCode = 403;

            accessService.requireComplexAccess.mockRejectedValue(denied);

            await expect(
                chargeService.validateUnitAccountAccess(
                    { id: "manager-1", role: "MANAGER" },
                    account
                )
            ).rejects.toBe(denied);
        });
    });
});
