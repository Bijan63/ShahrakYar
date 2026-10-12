jest.mock("../../src/config/prisma", () => ({
    $transaction: jest.fn(),
}));

jest.mock("../../src/repositories/charge.repository", () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUnitAccountId: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createWithClient: jest.fn(),
}));

jest.mock("../../src/repositories/unitAccount.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireComplexAccess: jest.fn(),
}));

const AppError = require("../../src/utils/AppError");
const chargeRepository = require("../../src/repositories/charge.repository");
const unitAccountRepository =
    require("../../src/repositories/unitAccount.repository");
const accessService = require("../../src/services/access.service");
const chargeService = require("../../src/services/charge.service");

const CHARGE_ID = "11111111-1111-4111-8111-111111111111";
const UNIT_ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const COMPLEX_A = "complex-a";
const COMPLEX_B = "complex-b";

const admin = { id: "admin-1", role: "ADMIN" };
const manager = { id: "manager-1", role: "MANAGER" };
const regularUser = { id: "user-1", role: "USER" };

const makeUnitAccount = (complexId = COMPLEX_A) => ({
    id: UNIT_ACCOUNT_ID,
    isActive: true,
    unit: {
        building: complexId ? { complexId } : null,
        property: null,
    },
});

const makeCharge = (overrides = {}) => ({
    id: CHARGE_ID,
    unitAccountId: UNIT_ACCOUNT_ID,
    unitAccount: makeUnitAccount(),
    type: "MONTHLY",
    periodYear: 1405,
    periodMonth: 1,
    amount: 1000,
    description: "Monthly charge",
    status: "ISSUED",
    issueDate: new Date("2026-03-01T00:00:00.000Z"),
    dueDate: new Date("2026-03-10T00:00:00.000Z"),
    payments: [],
    ...overrides,
});

describe("ChargeService additional tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        chargeRepository.findAll.mockResolvedValue([]);
        chargeRepository.findById.mockResolvedValue(makeCharge());
        chargeRepository.findByUnitAccountId.mockResolvedValue([]);
        chargeRepository.update.mockImplementation(
            async (id, data) => ({ ...makeCharge(), id, ...data })
        );
        chargeRepository.delete.mockResolvedValue(makeCharge());

        unitAccountRepository.findById.mockResolvedValue(makeUnitAccount());

        accessService.requireComplexAccess.mockResolvedValue(undefined);
    });

    describe("getCharges", () => {
        test("requires an authenticated user", async () => {
            await expect(
                chargeService.getCharges(null)
            ).rejects.toMatchObject({
                statusCode: 401,
                message: "Authentication required.",
            });
        });

        test("returns all charges to ADMIN", async () => {
            const charges = [makeCharge(), makeCharge({ id: "charge-2" })];
            chargeRepository.findAll.mockResolvedValue(charges);

            const result = await chargeService.getCharges(admin);

            expect(result).toBe(charges);
            expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
        });

        test("denies a regular USER", async () => {
            await expect(
                chargeService.getCharges(regularUser)
            ).rejects.toMatchObject({
                statusCode: 403,
                message: "Access denied.",
            });
        });

        test("returns only charges accessible to MANAGER", async () => {
            const ownCharge = makeCharge();
            const foreignCharge = makeCharge({
                id: "charge-foreign",
                unitAccount: makeUnitAccount(COMPLEX_B),
            });

            chargeRepository.findAll.mockResolvedValue([
                ownCharge,
                foreignCharge,
            ]);

            accessService.requireComplexAccess.mockImplementation(
                async (_user, complexId) => {
                    if (complexId === COMPLEX_B) {
                        throw new AppError("Forbidden.", 403);
                    }
                }
            );

            const result = await chargeService.getCharges(manager);

            expect(result).toEqual([ownCharge]);
            expect(accessService.requireComplexAccess).toHaveBeenCalledWith(
                manager,
                COMPLEX_A
            );
            expect(accessService.requireComplexAccess).toHaveBeenCalledWith(
                manager,
                COMPLEX_B
            );
        });

        test("propagates access errors other than 403", async () => {
            chargeRepository.findAll.mockResolvedValue([
                makeCharge({
                    unitAccount: makeUnitAccount(null),
                }),
            ]);

            await expect(
                chargeService.getCharges(manager)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Unit account is not associated with a complex.",
            });
        });
    });

    describe("getChargeById", () => {
        test("rejects an invalid charge ID", async () => {
            await expect(
                chargeService.getChargeById("invalid-id", admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid charge ID.",
            });

            expect(chargeRepository.findById).not.toHaveBeenCalled();
        });

        test("returns 404 when the charge does not exist", async () => {
            chargeRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.getChargeById(CHARGE_ID, admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Charge not found.",
            });
        });

        test("returns a charge after validating access", async () => {
            const charge = makeCharge();
            chargeRepository.findById.mockResolvedValue(charge);

            const result = await chargeService.getChargeById(
                CHARGE_ID,
                admin
            );

            expect(result).toBe(charge);
        });

        test("propagates a manager access denial", async () => {
            accessService.requireComplexAccess.mockRejectedValue(
                new AppError("Forbidden.", 403)
            );

            await expect(
                chargeService.getChargeById(CHARGE_ID, manager)
            ).rejects.toMatchObject({
                statusCode: 403,
            });
        });
    });

    describe("getChargesByUnitAccount", () => {
        test("rejects an invalid unit account ID", async () => {
            await expect(
                chargeService.getChargesByUnitAccount("bad-id", admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid unit account ID.",
            });

            expect(unitAccountRepository.findById).not.toHaveBeenCalled();
        });

        test("returns 404 when the unit account does not exist", async () => {
            unitAccountRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.getChargesByUnitAccount(
                    UNIT_ACCOUNT_ID,
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Unit account not found.",
            });

            expect(
                chargeRepository.findByUnitAccountId
            ).not.toHaveBeenCalled();
        });

        test("returns charges for an accessible unit account", async () => {
            const charges = [makeCharge()];
            chargeRepository.findByUnitAccountId.mockResolvedValue(charges);

            const result = await chargeService.getChargesByUnitAccount(
                UNIT_ACCOUNT_ID,
                manager
            );

            expect(accessService.requireComplexAccess).toHaveBeenCalledWith(
                manager,
                COMPLEX_A
            );
            expect(
                chargeRepository.findByUnitAccountId
            ).toHaveBeenCalledWith(UNIT_ACCOUNT_ID);
            expect(result).toBe(charges);
        });
    });

    describe("updateCharge", () => {
        test("rejects an invalid charge ID", async () => {
            await expect(
                chargeService.updateCharge("bad-id", { amount: 2000 }, admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid charge ID.",
            });
        });

        test("returns 404 when the charge does not exist", async () => {
            chargeRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.updateCharge(CHARGE_ID, { amount: 2000 }, admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Charge not found.",
            });
        });

        test.each(["PAID", "PARTIALLY_PAID"])(
            "does not modify a %s charge",
            async (status) => {
                chargeRepository.findById.mockResolvedValue(
                    makeCharge({ status })
                );

                await expect(
                    chargeService.updateCharge(
                        CHARGE_ID,
                        { amount: 2000 },
                        admin
                    )
                ).rejects.toMatchObject({
                    statusCode: 409,
                });

                expect(chargeRepository.update).not.toHaveBeenCalled();
            }
        );

        test("updates supported fields and normalizes their values", async () => {
            const data = {
                type: "SPECIAL",
                periodYear: 1405,
                periodMonth: 2,
                amount: "2500",
                description: "  Special repair charge  ",
                issueDate: "2026-03-02T00:00:00.000Z",
                dueDate: "2026-03-15T00:00:00.000Z",
            };

            await chargeService.updateCharge(CHARGE_ID, data, admin);

            expect(chargeRepository.update).toHaveBeenCalledWith(
                CHARGE_ID,
                {
                    type: "SPECIAL",
                    periodYear: 1405,
                    periodMonth: 2,
                    amount: 2500,
                    description: "Special repair charge",
                    issueDate: new Date(data.issueDate),
                    dueDate: new Date(data.dueDate),
                }
            );
        });

        test("uses the existing period year when only periodMonth changes", async () => {
            chargeRepository.findById.mockResolvedValue(
                makeCharge({ periodYear: 1405 })
            );

            await chargeService.updateCharge(
                CHARGE_ID,
                { periodMonth: 3 },
                admin
            );

            expect(chargeRepository.update).toHaveBeenCalledWith(
                CHARGE_ID,
                { periodMonth: 3 }
            );
        });

        test("allows explicitly clearing the due date", async () => {
            await chargeService.updateCharge(
                CHARGE_ID,
                { dueDate: null },
                admin
            );

            expect(chargeRepository.update).toHaveBeenCalledWith(
                CHARGE_ID,
                { dueDate: null }
            );
        });

        test("rejects an invalid issue date", async () => {
            await expect(
                chargeService.updateCharge(
                    CHARGE_ID,
                    { issueDate: "invalid-date" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid issue date.",
            });

            expect(chargeRepository.update).not.toHaveBeenCalled();
        });

        test("rejects an invalid due date", async () => {
            await expect(
                chargeService.updateCharge(
                    CHARGE_ID,
                    { dueDate: "invalid-date" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid due date.",
            });

            expect(chargeRepository.update).not.toHaveBeenCalled();
        });

        test("rejects a period month outside the valid range", async () => {
            await expect(
                chargeService.updateCharge(
                    CHARGE_ID,
                    { periodMonth: 13 },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Period month must be between 1 and 12.",
            });
        });

        test("rejects an empty update", async () => {
            await expect(
                chargeService.updateCharge(CHARGE_ID, {}, admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "No valid fields to update.",
            });

            expect(chargeRepository.update).not.toHaveBeenCalled();
        });

        test("maps P2003 to an invalid related record error", async () => {
            const error = new Error("Foreign key error");
            error.code = "P2003";
            chargeRepository.update.mockRejectedValue(error);

            await expect(
                chargeService.updateCharge(
                    CHARGE_ID,
                    { amount: 2000 },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid related record.",
            });
        });

        test("propagates unexpected update errors", async () => {
            const error = new Error("Unexpected database failure");
            chargeRepository.update.mockRejectedValue(error);

            await expect(
                chargeService.updateCharge(
                    CHARGE_ID,
                    { amount: 2000 },
                    admin
                )
            ).rejects.toBe(error);
        });
    });

    describe("cancelCharge", () => {
        test("rejects an invalid charge ID", async () => {
            await expect(
                chargeService.cancelCharge("invalid-id", admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid charge ID.",
            });
        });

        test("returns 404 when the charge does not exist", async () => {
            chargeRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.cancelCharge(CHARGE_ID, admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Charge not found.",
            });
        });

        test.each([
            ["PAID", "Paid charge cannot be cancelled."],
            ["PARTIALLY_PAID", "Partially paid charge cannot be cancelled."],
        ])("rejects cancelling a %s charge", async (status, message) => {
            chargeRepository.findById.mockResolvedValue(
                makeCharge({ status })
            );

            await expect(
                chargeService.cancelCharge(CHARGE_ID, admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message,
            });

            expect(chargeRepository.update).not.toHaveBeenCalled();
        });

        test("marks an eligible charge as CANCELLED", async () => {
            const cancelled = makeCharge({ status: "CANCELLED" });
            chargeRepository.update.mockResolvedValue(cancelled);

            const result = await chargeService.cancelCharge(CHARGE_ID, admin);

            expect(chargeRepository.update).toHaveBeenCalledWith(CHARGE_ID, {
                status: "CANCELLED",
            });
            expect(result).toBe(cancelled);
        });
    });

    describe("deleteCharge", () => {
        test("rejects an invalid charge ID", async () => {
            await expect(
                chargeService.deleteCharge("invalid-id", admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid charge ID.",
            });
        });

        test("returns 404 when the charge does not exist", async () => {
            chargeRepository.findById.mockResolvedValue(null);

            await expect(
                chargeService.deleteCharge(CHARGE_ID, admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Charge not found.",
            });
        });

        test("rejects deletion when the charge has payments", async () => {
            chargeRepository.findById.mockResolvedValue(
                makeCharge({
                    payments: [{ id: "payment-1", amount: 100 }],
                })
            );

            await expect(
                chargeService.deleteCharge(CHARGE_ID, admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Charge with payments cannot be deleted.",
            });

            expect(chargeRepository.delete).not.toHaveBeenCalled();
        });

        test.each(["PAID", "PARTIALLY_PAID"])(
            "rejects deleting a %s charge even when the payments list is empty",
            async (status) => {
                chargeRepository.findById.mockResolvedValue(
                    makeCharge({ status, payments: [] })
                );

                await expect(
                    chargeService.deleteCharge(CHARGE_ID, admin)
                ).rejects.toMatchObject({
                    statusCode: 409,
                    message: "Paid charge cannot be deleted.",
                });

                expect(chargeRepository.delete).not.toHaveBeenCalled();
            }
        );

        test("deletes an eligible charge", async () => {
            const deleted = makeCharge();
            chargeRepository.delete.mockResolvedValue(deleted);

            const result = await chargeService.deleteCharge(CHARGE_ID, admin);

            expect(chargeRepository.delete).toHaveBeenCalledWith(CHARGE_ID);
            expect(result).toBe(deleted);
        });

        test("propagates access denial and does not delete the charge", async () => {
            accessService.requireComplexAccess.mockRejectedValue(
                new AppError("Forbidden.", 403)
            );

            await expect(
                chargeService.deleteCharge(CHARGE_ID, manager)
            ).rejects.toMatchObject({
                statusCode: 403,
            });

            expect(chargeRepository.delete).not.toHaveBeenCalled();
        });
    });
});
