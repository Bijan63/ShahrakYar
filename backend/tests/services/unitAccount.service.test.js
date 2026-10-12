jest.mock("../../src/repositories/unitAccount.repository", () => ({
    create: jest.fn(),
    findByUnitId: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
}));

jest.mock("../../src/repositories/unit.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireComplexAccess: jest.fn(),
}));

const unitAccountService = require("../../src/services/unitAccount.service");
const unitAccountRepository = require("../../src/repositories/unitAccount.repository");
const unitRepository = require("../../src/repositories/unit.repository");
const accessService = require("../../src/services/access.service");

const UNIT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UNIT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACCOUNT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const COMPLEX_A = "11111111-1111-4111-8111-111111111111";
const COMPLEX_B = "22222222-2222-4222-8222-222222222222";

const manager = {
    id: "33333333-3333-4333-8333-333333333333",
    role: "MANAGER",
};

const admin = {
    id: "44444444-4444-4444-8444-444444444444",
    role: "ADMIN",
};

function makeUnit({
    id = UNIT_A_ID,
    buildingComplexId = COMPLEX_A,
    propertyComplexId = null,
} = {}) {
    return {
        id,
        building: buildingComplexId
            ? { complexId: buildingComplexId }
            : null,
        property: propertyComplexId
            ? { complexId: propertyComplexId }
            : null,
    };
}

function makeAccount(unit, overrides = {}) {
    return {
        id: ACCOUNT_ID,
        unit,
        charges: [],
        payments: [],
        ...overrides,
    };
}

function forbiddenError() {
    const error = new Error("Forbidden.");
    error.statusCode = 403;
    return error;
}

describe("UnitAccountService access control", () => {
    beforeEach(() => {
        jest.resetAllMocks();
        accessService.requireComplexAccess.mockResolvedValue(true);
    });

    test("creates an account for a MANAGER with complex access", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());
        unitAccountRepository.findByUnitId.mockResolvedValue(null);
        unitAccountRepository.create.mockResolvedValue({
            id: ACCOUNT_ID,
            unitId: UNIT_A_ID,
            code: "UA-01",
        });

        await expect(
            unitAccountService.createUnitAccount(
                { unitId: UNIT_A_ID, code: " UA-01 " },
                manager
            )
        ).resolves.toEqual(
            expect.objectContaining({ code: "UA-01" })
        );

        expect(accessService.requireComplexAccess)
            .toHaveBeenCalledWith(manager, COMPLEX_A);

        expect(unitAccountRepository.create)
            .toHaveBeenCalledWith({
                unitId: UNIT_A_ID,
                code: "UA-01",
                title: null,
                isActive: true,
            });
    });

    test("does not create an account for an unassigned complex", async () => {
        unitRepository.findById.mockResolvedValue(
            makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B })
        );
        accessService.requireComplexAccess.mockRejectedValue(
            forbiddenError()
        );

        await expect(
            unitAccountService.createUnitAccount(
                { unitId: UNIT_B_ID, code: "UA-02" },
                manager
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(unitAccountRepository.create).not.toHaveBeenCalled();
        expect(unitAccountRepository.findByUnitId).not.toHaveBeenCalled();
    });

    test("returns only accounts from complexes the MANAGER can access", async () => {
        const accountA = makeAccount(makeUnit());
        const accountB = makeAccount(
            makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B }),
            { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" }
        );

        unitAccountRepository.findAll.mockResolvedValue([
            accountA,
            accountB,
        ]);

        accessService.requireComplexAccess.mockImplementation(
            async (_user, complexId) => {
                if (complexId === COMPLEX_B) {
                    throw forbiddenError();
                }
            }
        );

        await expect(
            unitAccountService.getUnitAccounts(manager)
        ).resolves.toEqual([accountA]);
    });

    test("rejects reading an account belonging to another complex", async () => {
        unitAccountRepository.findById.mockResolvedValue(
            makeAccount(
                makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B })
            )
        );
        accessService.requireComplexAccess.mockRejectedValue(
            forbiddenError()
        );

        await expect(
            unitAccountService.getUnitAccountById(ACCOUNT_ID, manager)
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });
    });

    test("rejects updating an account belonging to another complex", async () => {
        unitAccountRepository.findById.mockResolvedValue(
            makeAccount(
                makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B })
            )
        );
        accessService.requireComplexAccess.mockRejectedValue(
            forbiddenError()
        );

        await expect(
            unitAccountService.updateUnitAccount(
                ACCOUNT_ID,
                { title: "Unauthorized change" },
                manager
            )
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(unitAccountRepository.update).not.toHaveBeenCalled();
    });

    test("rejects deleting an account belonging to another complex", async () => {
        unitAccountRepository.findById.mockResolvedValue(
            makeAccount(
                makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B })
            )
        );
        accessService.requireComplexAccess.mockRejectedValue(
            forbiddenError()
        );

        await expect(
            unitAccountService.deleteUnitAccount(ACCOUNT_ID, manager)
        ).rejects.toMatchObject({
            message: "Forbidden.",
            statusCode: 403,
        });

        expect(unitAccountRepository.delete).not.toHaveBeenCalled();
    });

    test("rejects a unit linked to different complexes", async () => {
        unitAccountRepository.findById.mockResolvedValue(
            makeAccount(
                makeUnit({
                    buildingComplexId: COMPLEX_A,
                    propertyComplexId: COMPLEX_B,
                })
            )
        );

        await expect(
            unitAccountService.getUnitAccountById(ACCOUNT_ID, manager)
        ).rejects.toMatchObject({
            message: "Unit account is linked to different complexes.",
            statusCode: 403,
        });

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("allows ADMIN to list all unit accounts", async () => {
        const accounts = [
            makeAccount(makeUnit()),
            makeAccount(
                makeUnit({ id: UNIT_B_ID, buildingComplexId: COMPLEX_B }),
            ),
        ];
        unitAccountRepository.findAll.mockResolvedValue(accounts);

        await expect(
            unitAccountService.getUnitAccounts(admin)
        ).resolves.toEqual(accounts);

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("does not delete an account with financial transactions", async () => {
        unitAccountRepository.findById.mockResolvedValue(
            makeAccount(makeUnit(), {
                payments: [{ id: "payment-1" }],
            })
        );

        await expect(
            unitAccountService.deleteUnitAccount(ACCOUNT_ID, manager)
        ).rejects.toMatchObject({
            message: "Unit account with financial transactions cannot be deleted.",
            statusCode: 409,
        });

        expect(unitAccountRepository.delete).not.toHaveBeenCalled();
    });
});
