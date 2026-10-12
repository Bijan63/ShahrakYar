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

const service =
    require("../../src/services/unitAccount.service");

const accountRepository =
    require("../../src/repositories/unitAccount.repository");

const unitRepository =
    require("../../src/repositories/unit.repository");

const accessService =
    require("../../src/services/access.service");

const UNIT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const UNIT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ACCOUNT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

const COMPLEX_A = "11111111-1111-4111-8111-111111111111";
const COMPLEX_B = "22222222-2222-4222-8222-222222222222";
const COMPLEX_C = "33333333-3333-4333-8333-333333333333";
const COMPLEX_D = "44444444-4444-4444-8444-444444444444";

const manager = {
    id: "55555555-5555-4555-8555-555555555555",
    role: "MANAGER",
};

const admin = {
    id: "66666666-6666-4666-8666-666666666666",
    role: "ADMIN",
};

const ordinaryUser = {
    id: "77777777-7777-4777-8777-777777777777",
    role: "USER",
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

function makeAccount(unit = makeUnit(), overrides = {}) {
    return {
        id: ACCOUNT_ID,
        unit,
        charges: [],
        payments: [],
        ...overrides,
    };
}

function makeError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

beforeEach(() => {
    jest.resetAllMocks();

    accessService.requireComplexAccess.mockResolvedValue(true);
});

describe("UnitAccountService - create validation", () => {
    test("rejects missing create data", async () => {
        await expect(
            service.createUnitAccount(null, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Unit account data is required.",
        });

        expect(unitRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a missing unitId", async () => {
        await expect(
            service.createUnitAccount({ code: "UA-01" }, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "unitId is required.",
        });
    });

    test("rejects a missing code", async () => {
        await expect(
            service.createUnitAccount({ unitId: UNIT_A_ID }, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "code is required.",
        });
    });

    test.each([
        [42, "code must be a non-empty string."],
        ["", "code is required."],
        ["   ", "code must be a non-empty string."],
        [null, "code is required."],
    ])(
        "rejects invalid code value: %p",
        async (code, expectedMessage) => {
            await expect(
                service.createUnitAccount(
                    { unitId: UNIT_A_ID, code },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: expectedMessage,
            });
        }
    );

    test("rejects malformed unit UUID", async () => {
        await expect(
            service.createUnitAccount(
                { unitId: "not-a-uuid", code: "UA-01" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unitId. Must be a valid UUID.",
        });

        expect(unitRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects a unit that does not exist", async () => {
        unitRepository.findById.mockResolvedValue(null);

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit not found.",
        });
    });

    test("rejects an unauthenticated create request", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                null
            )
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });

        expect(accountRepository.create).not.toHaveBeenCalled();
    });

    test("rejects a user who is neither ADMIN nor MANAGER", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                ordinaryUser
            )
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Forbidden.",
        });
    });

    test("rejects a unit with no complex association", async () => {
        unitRepository.findById.mockResolvedValue(
            makeUnit({
                buildingComplexId: null,
                propertyComplexId: null,
            })
        );

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Unit must be connected to a building or property.",
        });
    });

    test("rejects conflicting building and property complexes", async () => {
        unitRepository.findById.mockResolvedValue(
            makeUnit({
                buildingComplexId: COMPLEX_A,
                propertyComplexId: COMPLEX_B,
            })
        );

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Unit account is linked to different complexes.",
        });

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("rejects a unit that already has a financial account", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(
            makeAccount()
        );

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-02" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Unit already has a financial account.",
        });

        expect(accountRepository.create).not.toHaveBeenCalled();
    });

    test("allows ADMIN to create an account without manager-scope checks", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(null);
        accountRepository.create.mockResolvedValue({
            id: ACCOUNT_ID,
            code: "UA-01",
        });

        await expect(
            service.createUnitAccount(
                {
                    unitId: UNIT_A_ID,
                    code: " UA-01 ",
                    title: 123,
                    isActive: 0,
                },
                admin
            )
        ).resolves.toEqual(
            expect.objectContaining({ code: "UA-01" })
        );

        expect(accountRepository.create).toHaveBeenCalledWith({
            unitId: UNIT_A_ID,
            code: "UA-01",
            title: "123",
            isActive: false,
        });

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("maps duplicate-code Prisma errors to HTTP 409", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(null);

        accountRepository.create.mockRejectedValue({
            code: "P2002",
        });

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Unit account code or unit already exists.",
        });
    });

    test("rethrows unexpected create errors", async () => {
        const dbError = new Error("Database unavailable");

        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(null);
        accountRepository.create.mockRejectedValue(dbError);

        await expect(
            service.createUnitAccount(
                { unitId: UNIT_A_ID, code: "UA-01" },
                admin
            )
        ).rejects.toBe(dbError);
    });
});

describe("UnitAccountService - list access and filtering", () => {
    test("rejects an unauthenticated list request", async () => {
        await expect(
            service.getUnitAccounts(null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });

        expect(accountRepository.findAll).not.toHaveBeenCalled();
    });

    test("rejects listing by an ordinary USER", async () => {
        accountRepository.findAll.mockResolvedValue([]);

        await expect(
            service.getUnitAccounts(ordinaryUser)
        ).rejects.toMatchObject({
            statusCode: 403,
            message: "Forbidden.",
        });
    });

    test("skips inaccessible or missing units in a MANAGER list", async () => {
        const visible = makeAccount(makeUnit());

        const statusCode404 = makeAccount(
            makeUnit({
                id: UNIT_B_ID,
                buildingComplexId: COMPLEX_B,
            }),
            { id: "88888888-8888-4888-8888-888888888888" }
        );

        const status403 = makeAccount(
            makeUnit({
                buildingComplexId: COMPLEX_C,
            }),
            { id: "99999999-9999-4999-8999-999999999999" }
        );

        const status404 = makeAccount(
            makeUnit({
                buildingComplexId: COMPLEX_D,
            }),
            { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" }
        );

        const noUnit = makeAccount(null, {
            id: "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff",
        });

        accountRepository.findAll.mockResolvedValue([
            visible,
            statusCode404,
            status403,
            status404,
            noUnit,
        ]);

        accessService.requireComplexAccess.mockImplementation(
            async (_user, complexId) => {
                if (complexId === COMPLEX_B) {
                    throw makeError("Not found", 404);
                }

                if (complexId === COMPLEX_C) {
                    const error = new Error("Forbidden");
                    error.status = 403;
                    throw error;
                }

                if (complexId === COMPLEX_D) {
                    const error = new Error("Not found");
                    error.status = 404;
                    throw error;
                }
            }
        );

        await expect(
            service.getUnitAccounts(manager)
        ).resolves.toEqual([visible]);
    });

    test("propagates unexpected errors while filtering MANAGER accounts", async () => {
        accountRepository.findAll.mockResolvedValue([
            makeAccount(makeUnit()),
        ]);

        const internalError = makeError("Unexpected validation failure", 400);

        accessService.requireComplexAccess.mockRejectedValue(internalError);

        await expect(
            service.getUnitAccounts(manager)
        ).rejects.toBe(internalError);
    });
});

describe("UnitAccountService - get account by ID", () => {
    test("rejects an unauthenticated request", async () => {
        await expect(
            service.getUnitAccountById(ACCOUNT_ID, null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });
    });

    test("rejects a malformed account UUID", async () => {
        await expect(
            service.getUnitAccountById("bad-id", admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unit account ID. Must be a valid UUID.",
        });

        expect(accountRepository.findById).not.toHaveBeenCalled();
    });

    test("returns 404 when the account is missing", async () => {
        accountRepository.findById.mockResolvedValue(null);

        await expect(
            service.getUnitAccountById(ACCOUNT_ID, admin)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit account not found.",
        });
    });

    test("allows ADMIN to read an existing account", async () => {
        const account = makeAccount();
        accountRepository.findById.mockResolvedValue(account);

        await expect(
            service.getUnitAccountById(ACCOUNT_ID, admin)
        ).resolves.toBe(account);

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });
});

describe("UnitAccountService - get account by unit ID", () => {
    test("rejects unauthenticated requests", async () => {
        await expect(
            service.getUnitAccountByUnitId(UNIT_A_ID, null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });
    });

    test("rejects invalid unit IDs", async () => {
        await expect(
            service.getUnitAccountByUnitId("invalid", admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unitId. Must be a valid UUID.",
        });
    });

    test("rejects a missing unit", async () => {
        unitRepository.findById.mockResolvedValue(null);

        await expect(
            service.getUnitAccountByUnitId(UNIT_A_ID, admin)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit not found.",
        });
    });

    test("rejects when the unit has no account", async () => {
        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(null);

        await expect(
            service.getUnitAccountByUnitId(UNIT_A_ID, admin)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit account not found.",
        });
    });

    test("returns the account for an authorized unit", async () => {
        const account = makeAccount();

        unitRepository.findById.mockResolvedValue(makeUnit());
        accountRepository.findByUnitId.mockResolvedValue(account);

        await expect(
            service.getUnitAccountByUnitId(UNIT_A_ID, manager)
        ).resolves.toBe(account);

        expect(accessService.requireComplexAccess)
            .toHaveBeenCalledWith(manager, COMPLEX_A);
    });
});

describe("UnitAccountService - update validation and errors", () => {
    test("rejects an unauthenticated update", async () => {
        await expect(
            service.updateUnitAccount(ACCOUNT_ID, { title: "New title" }, null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });
    });

    test("rejects a malformed account ID", async () => {
        await expect(
            service.updateUnitAccount("bad-id", { title: "New title" }, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unit account ID. Must be a valid UUID.",
        });
    });

    test.each([null, undefined, {}, "invalid"])(
        "rejects empty or invalid update data: %p",
        async (data) => {
            await expect(
                service.updateUnitAccount(ACCOUNT_ID, data, admin)
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Unit account update data is required.",
            });
        }
    );

    test("returns 404 when updating a missing account", async () => {
        accountRepository.findById.mockResolvedValue(null);

        await expect(
            service.updateUnitAccount(
                ACCOUNT_ID,
                { title: "New title" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit account not found.",
        });
    });

    test.each([42, null, ""])(
        "rejects an invalid update code: %p",
        async (code) => {
            accountRepository.findById.mockResolvedValue(makeAccount());

            await expect(
                service.updateUnitAccount(
                    ACCOUNT_ID,
                    { code },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "code must be a non-empty string.",
            });

            expect(accountRepository.update).not.toHaveBeenCalled();
        }
    );

    test("rejects a non-boolean isActive value", async () => {
        accountRepository.findById.mockResolvedValue(makeAccount());

        await expect(
            service.updateUnitAccount(
                ACCOUNT_ID,
                { isActive: "false" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "isActive must be a boolean.",
        });

        expect(accountRepository.update).not.toHaveBeenCalled();
    });

    test("normalizes code and title and updates isActive", async () => {
        const updated = {
            id: ACCOUNT_ID,
            code: "UA-99",
            title: "99",
            isActive: false,
        };

        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.update.mockResolvedValue(updated);

        await expect(
            service.updateUnitAccount(
                ACCOUNT_ID,
                {
                    code: " UA-99 ",
                    title: 99,
                    isActive: false,
                },
                admin
            )
        ).resolves.toBe(updated);

        expect(accountRepository.update).toHaveBeenCalledWith(
            ACCOUNT_ID,
            {
                code: "UA-99",
                title: "99",
                isActive: false,
            }
        );
    });

    test("allows clearing the title with null", async () => {
        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.update.mockResolvedValue({
            id: ACCOUNT_ID,
            title: null,
        });

        await service.updateUnitAccount(
            ACCOUNT_ID,
            { title: null },
            admin
        );

        expect(accountRepository.update).toHaveBeenCalledWith(
            ACCOUNT_ID,
            { title: null }
        );
    });

    test("maps duplicate update codes to HTTP 409", async () => {
        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.update.mockRejectedValue({ code: "P2002" });

        await expect(
            service.updateUnitAccount(
                ACCOUNT_ID,
                { code: "UA-99" },
                admin
            )
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Unit account code already exists.",
        });
    });

    test("rethrows unexpected update errors", async () => {
        const dbError = new Error("Unexpected update error");

        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.update.mockRejectedValue(dbError);

        await expect(
            service.updateUnitAccount(
                ACCOUNT_ID,
                { title: "New title" },
                admin
            )
        ).rejects.toBe(dbError);
    });
});

describe("UnitAccountService - delete behavior", () => {
    test("rejects an unauthenticated delete", async () => {
        await expect(
            service.deleteUnitAccount(ACCOUNT_ID, null)
        ).rejects.toMatchObject({
            statusCode: 401,
            message: "Unauthorized.",
        });
    });

    test("rejects an invalid account ID", async () => {
        await expect(
            service.deleteUnitAccount("bad-id", admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unit account ID. Must be a valid UUID.",
        });
    });

    test("returns 404 when the account does not exist", async () => {
        accountRepository.findById.mockResolvedValue(null);

        await expect(
            service.deleteUnitAccount(ACCOUNT_ID, admin)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Unit account not found.",
        });
    });

    test("rejects deleting an account with charges", async () => {
        accountRepository.findById.mockResolvedValue(
            makeAccount(makeUnit(), {
                charges: [{ id: "charge-1" }],
            })
        );

        await expect(
            service.deleteUnitAccount(ACCOUNT_ID, admin)
        ).rejects.toMatchObject({
            statusCode: 409,
            message: "Unit account with financial transactions cannot be deleted.",
        });

        expect(accountRepository.delete).not.toHaveBeenCalled();
    });

    test("deletes an account with no financial transactions", async () => {
        const deleted = { id: ACCOUNT_ID, deleted: true };

        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.delete.mockResolvedValue(deleted);

        await expect(
            service.deleteUnitAccount(ACCOUNT_ID, admin)
        ).resolves.toBe(deleted);

        expect(accountRepository.delete).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    test("propagates errors from the delete repository", async () => {
        const dbError = new Error("Delete failed");

        accountRepository.findById.mockResolvedValue(makeAccount());
        accountRepository.delete.mockRejectedValue(dbError);

        await expect(
            service.deleteUnitAccount(ACCOUNT_ID, admin)
        ).rejects.toBe(dbError);
    });
});

describe("UnitAccountService - non-string UUID input", () => {
    test("rejects a numeric account ID before querying the repository", async () => {
        await expect(
            service.getUnitAccountById(123, admin)
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "Invalid unit account ID. Must be a valid UUID.",
        });

        expect(accountRepository.findById).not.toHaveBeenCalled();
    });
});
