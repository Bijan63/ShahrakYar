jest.mock("../../src/repositories/person.repository", () => ({
    getPersonById: jest.fn(),
}));

jest.mock("../../src/repositories/resident.repository", () => ({
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByMobile: jest.fn(),
    findByPersonId: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    findByComplexIds: jest.fn(),
    countByComplexIds: jest.fn(),
    search: jest.fn(),
    countSearch: jest.fn(),
    searchByComplexIds: jest.fn(),
    countSearchByComplexIds: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
}));

jest.mock("../../src/repositories/user.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/repositories/unit.repository", () => ({
    findById: jest.fn(),
}));

jest.mock("../../src/services/access.service", () => ({
    requireComplexAccess: jest.fn(),
}));

const AppError = require("../../src/utils/AppError");
const personRepository = require("../../src/repositories/person.repository");
const residentRepository = require("../../src/repositories/resident.repository");
const userRepository = require("../../src/repositories/user.repository");
const unitRepository = require("../../src/repositories/unit.repository");
const accessService = require("../../src/services/access.service");
const residentService = require("../../src/services/resident.service");

const admin = {
    id: "admin-test",
    role: "ADMIN",
};

const manager = {
    id: "manager-test",
    role: "MANAGER",
};

const regularUser = {
    id: "user-test",
    role: "USER",
};

const COMPLEX_A = "complex-a";
const COMPLEX_B = "complex-b";

function makeError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function makeResident(id, complexId, fullName = "Ali Test") {
    return {
        id,
        fullName,
        mobile: "09123456789",
        userId: `user-${id}`,
        personId: null,
        unitId: `unit-${id}`,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-02T00:00:00Z"),
        unit: {
            id: `unit-${id}`,
            unitNumber: id,
            floor: 1,
            area: 100,
            code: `U-${id}`,
            building: {
                id: `building-${id}`,
                name: `Building ${id}`,
                complexId,
            },
            property: null,
        },
    };
}

beforeEach(() => {
    jest.clearAllMocks();

    residentRepository.findById.mockResolvedValue(null);
    residentRepository.findAll.mockResolvedValue([]);
    residentRepository.count.mockResolvedValue(0);
    residentRepository.search.mockResolvedValue([]);
    residentRepository.countSearch.mockResolvedValue(0);

    unitRepository.findById.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(null);
    personRepository.getPersonById.mockResolvedValue(null);

    accessService.requireComplexAccess.mockResolvedValue(true);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("ResidentService validateMobile", () => {
    test("accepts a valid Iranian mobile number", () => {
        expect(
            residentService.validateMobile("09123456789")
        ).toBeUndefined();
    });

    test.each([
        undefined,
        null,
        9123456789,
        "",
        "08123456789",
        "0912345678",
        "091234567890",
        "09abcdefghj",
    ])("rejects an invalid mobile value: %p", mobile => {
        expect(() => residentService.validateMobile(mobile))
            .toThrow("شماره موبایل نامعتبر است.");
    });
});

describe("ResidentService validateFullName", () => {
    test("trims and returns a valid name", () => {
        expect(
            residentService.validateFullName("  Ali Test  ")
        ).toBe("Ali Test");
    });

    test.each([undefined, null])(
        "rejects missing fullName: %p",
        fullName => {
            expect(() => residentService.validateFullName(fullName))
                .toThrow("fullName is required.");
        }
    );

    test("rejects a non-string name", () => {
        expect(() => residentService.validateFullName(123))
            .toThrow("fullName must be a string.");
    });

    test.each(["", "   "])(
        "rejects an empty name: %p",
        fullName => {
            expect(() => residentService.validateFullName(fullName))
                .toThrow("fullName cannot be empty.");
        }
    );
});

describe("ResidentService handleRepositoryError", () => {
    test("preserves an existing AppError", () => {
        const original = new AppError("Original error", 418);

        expect(() =>
            residentService.handleRepositoryError(original, "create")
        ).toThrow(original);
    });

    test.each([
        ["mobile", "Mobile number already exists."],
        ["userId", "This user is already a resident."],
        [
            "personId",
            "This person is already connected to another resident.",
        ],
        ["other", "Resident already exists."],
    ])("maps P2002 target %s to a conflict", (target, message) => {
        const error = {
            code: "P2002",
            meta: { target: [target] },
        };

        expect(() =>
            residentService.handleRepositoryError(error, "create")
        ).toThrow(message);
    });

    test("maps a non-array P2002 target to a general conflict", () => {
        const error = {
            code: "P2002",
            meta: { target: "mobile" },
        };

        expect(() =>
            residentService.handleRepositoryError(error, "create")
        ).toThrow("Resident already exists.");
    });

    test("maps P2003 to an invalid reference error", () => {
        expect(() =>
            residentService.handleRepositoryError(
                { code: "P2003" },
                "create"
            )
        ).toThrow("Invalid resident reference.");
    });

    test("maps P2025 to not found", () => {
        expect(() =>
            residentService.handleRepositoryError(
                { code: "P2025" },
                "update"
            )
        ).toThrow("Resident not found.");
    });

    test("maps Prisma validation errors to a client error", () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        const error = new Error("Invalid Prisma data");
        error.name = "PrismaClientValidationError";

        expect(() =>
            residentService.handleRepositoryError(error, "create")
        ).toThrow("Invalid resident data.");
    });

    test("maps unexpected repository errors to HTTP 500", () => {
        jest.spyOn(console, "error").mockImplementation(() => {});

        expect(() =>
            residentService.handleRepositoryError(
                new Error("Database offline"),
                "read"
            )
        ).toThrow("Unable to read resident.");
    });
});

describe("ResidentService getUnit and getUser", () => {
    test("getUnit rejects a missing ID", async () => {
        await expect(residentService.getUnit())
            .rejects.toThrow("unitId is required.");
    });

    test("getUnit rejects an unknown unit", async () => {
        unitRepository.findById.mockResolvedValue(null);

        await expect(residentService.getUnit("missing"))
            .rejects.toThrow("Unit not found.");
    });

    test("getUnit returns an existing unit", async () => {
        const unit = { id: "unit-1" };
        unitRepository.findById.mockResolvedValue(unit);

        await expect(residentService.getUnit("unit-1"))
            .resolves.toBe(unit);
    });

    test("getUser rejects an unknown user", async () => {
        userRepository.findById.mockResolvedValue(null);

        await expect(residentService.getUser("missing"))
            .rejects.toThrow("User not found.");
    });

    test("getUser returns an existing user", async () => {
        const target = { id: "target-user" };
        userRepository.findById.mockResolvedValue(target);

        await expect(residentService.getUser("target-user"))
            .resolves.toBe(target);
    });
});

describe("ResidentService validateUnitAccess", () => {
    test("rejects a missing authenticated user", async () => {
        await expect(
            residentService.validateUnitAccess(
                makeResident("1", COMPLEX_A).unit,
                null
            )
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("allows ADMIN without a complex access lookup", async () => {
        await expect(
            residentService.validateUnitAccess(
                makeResident("1", COMPLEX_A).unit,
                admin
            )
        ).resolves.toBeUndefined();

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("rejects a regular USER", async () => {
        await expect(
            residentService.validateUnitAccess(
                makeResident("1", COMPLEX_A).unit,
                regularUser
            )
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("rejects a unit not connected to a complex", async () => {
        const unit = {
            id: "unassigned-unit",
            building: null,
            property: null,
        };

        await expect(
            residentService.validateUnitAccess(unit, manager)
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("checks the building complex for a manager", async () => {
        const unit = {
            id: "unit-building",
            building: { complexId: COMPLEX_A },
            property: { complexId: COMPLEX_B },
        };

        await residentService.validateUnitAccess(unit, manager);

        expect(accessService.requireComplexAccess)
            .toHaveBeenCalledWith(manager, COMPLEX_A);
    });

    test("uses the property complex when there is no building", async () => {
        const unit = {
            id: "unit-property",
            building: null,
            property: { complexId: COMPLEX_A },
        };

        await residentService.validateUnitAccess(unit, manager);

        expect(accessService.requireComplexAccess)
            .toHaveBeenCalledWith(manager, COMPLEX_A);
    });

    test("propagates a manager access denial", async () => {
        accessService.requireComplexAccess.mockRejectedValue(
            makeError("Forbidden", 403)
        );

        await expect(
            residentService.validateUnitAccess(
                makeResident("1", COMPLEX_B).unit,
                manager
            )
        ).rejects.toMatchObject({ statusCode: 403 });
    });
});

describe("ResidentService getResidentById", () => {
    test("returns 404 when the resident is missing", async () => {
        residentRepository.findById.mockResolvedValue(null);

        await expect(
            residentService.getResidentById("missing", admin)
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("returns a mapped resident for an admin", async () => {
        const resident = makeResident("r1", COMPLEX_A);
        residentRepository.findById.mockResolvedValue(resident);

        const result = await residentService.getResidentById("r1", admin);

        expect(result).toMatchObject({
            id: "r1",
            name: "Ali Test",
            mobile: "09123456789",
            userId: "user-r1",
            unit: {
                id: "unit-r1",
                building: {
                    id: "building-r1",
                    name: "Building r1",
                },
            },
        });

        expect(accessService.requireComplexAccess).not.toHaveBeenCalled();
    });

    test("denies a manager access to a resident in another complex", async () => {
        residentRepository.findById.mockResolvedValue(
            makeResident("r2", COMPLEX_B)
        );
        accessService.requireComplexAccess.mockRejectedValue(
            makeError("Forbidden", 403)
        );

        await expect(
            residentService.getResidentById("r2", manager)
        ).rejects.toMatchObject({ statusCode: 403 });
    });
});

describe("ResidentService getResidents", () => {
    test("requires authentication", async () => {
        await expect(
            residentService.getResidents(1, 20, null)
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("returns a paginated list for ADMIN", async () => {
        const records = [
            makeResident("r1", COMPLEX_A, "Ali"),
            makeResident("r2", COMPLEX_B, "Sara"),
        ];

        residentRepository.findAll.mockResolvedValue([records[0]]);
        residentRepository.count.mockResolvedValue(2);

        const result = await residentService.getResidents(1, 1, admin);

        expect(residentRepository.findAll).toHaveBeenCalledWith(0, 1);
        expect(residentRepository.count).toHaveBeenCalledTimes(1);
        expect(result).toMatchObject({
            total: 2,
            page: 1,
            limit: 1,
            pages: 2,
            data: [{ id: "r1", name: "Ali" }],
        });
    });

    test("filters out residents in other complexes for MANAGER", async () => {
        residentRepository.findAll.mockResolvedValue([
            makeResident("own", COMPLEX_A, "Own Resident"),
            makeResident("foreign", COMPLEX_B, "Other Resident"),
        ]);

        accessService.requireComplexAccess.mockImplementation(
            async (_user, complexId) => {
                if (complexId !== COMPLEX_A) {
                    throw makeError("Forbidden", 403);
                }
            }
        );

        const result = await residentService.getResidents(1, 20, manager);

        expect(residentRepository.findAll).toHaveBeenCalledWith(0, 100000);
        expect(result.total).toBe(1);
        expect(result.data.map(item => item.id)).toEqual(["own"]);
    });

    test("propagates unexpected access errors while listing for MANAGER", async () => {
        residentRepository.findAll.mockResolvedValue([
            makeResident("r1", COMPLEX_A),
        ]);

        accessService.requireComplexAccess.mockRejectedValue(
            makeError("Database unavailable", 500)
        );

        await expect(
            residentService.getResidents(1, 20, manager)
        ).rejects.toMatchObject({
            message: "Database unavailable",
            statusCode: 500,
        });
    });

    test("denies regular USER access to the list", async () => {
        await expect(
            residentService.getResidents(1, 20, regularUser)
        ).rejects.toMatchObject({ statusCode: 403 });
    });
});

describe("ResidentService searchResidents", () => {
    test("requires authentication", async () => {
        await expect(
            residentService.searchResidents({}, null)
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("builds filters and paginates search results for ADMIN", async () => {
        const records = [
            makeResident("r1", COMPLEX_A, "Ali"),
        ];

        residentRepository.search.mockResolvedValue([]);
        residentRepository.countSearch.mockResolvedValue(1);

        const result = await residentService.searchResidents(
            {
                page: "2",
                limit: "5",
                search: "  Ali  ",
                unitId: "unit-filter",
                buildingId: "building-filter",
            },
            admin
        );

        expect(residentRepository.search).toHaveBeenCalledWith({
            skip: 5,
            take: 5,
            where: {
                OR: [
                    {
                        fullName: {
                            contains: "Ali",
                            mode: "insensitive",
                        },
                    },
                    {
                        mobile: {
                            contains: "Ali",
                        },
                    },
                ],
                unitId: "unit-filter",
                unit: {
                    buildingId: "building-filter",
                },
            },
            orderBy: { fullName: "asc" },
        });

        expect(residentRepository.countSearch).toHaveBeenCalledWith({
            OR: [
                {
                    fullName: {
                        contains: "Ali",
                        mode: "insensitive",
                    },
                },
                {
                    mobile: {
                        contains: "Ali",
                    },
                },
            ],
            unitId: "unit-filter",
            unit: {
                buildingId: "building-filter",
            },
        });

        expect(result).toMatchObject({
            total: 1,
            page: 2,
            limit: 5,
            pages: 1,
            data: [],
        });
    });

    test("returns only residents accessible to MANAGER", async () => {
        residentRepository.search.mockResolvedValue([
            makeResident("own", COMPLEX_A, "Own Resident"),
            makeResident("foreign", COMPLEX_B, "Other Resident"),
        ]);

        accessService.requireComplexAccess.mockImplementation(
            async (_user, complexId) => {
                if (complexId !== COMPLEX_A) {
                    throw makeError("Forbidden", 403);
                }
            }
        );

        const result = await residentService.searchResidents(
            { search: "Resident", page: "1", limit: "20" },
            manager
        );

        expect(residentRepository.search).toHaveBeenCalledWith({
            skip: 0,
            take: 100000,
            where: {
                OR: [
                    {
                        fullName: {
                            contains: "Resident",
                            mode: "insensitive",
                        },
                    },
                    {
                        mobile: {
                            contains: "Resident",
                        },
                    },
                ],
            },
            orderBy: { fullName: "asc" },
        });

        expect(result.total).toBe(1);
        expect(result.data.map(item => item.id)).toEqual(["own"]);
    });

    test("defaults empty search parameters for ADMIN", async () => {
        await residentService.searchResidents({}, admin);

        expect(residentRepository.search).toHaveBeenCalledWith({
            skip: 0,
            take: 20,
            where: {},
            orderBy: { fullName: "asc" },
        });

        expect(residentRepository.countSearch).toHaveBeenCalledWith({});
    });

    test("denies regular USER access to resident search", async () => {
        await expect(
            residentService.searchResidents({}, regularUser)
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("propagates unexpected errors while searching for MANAGER", async () => {
        residentRepository.search.mockResolvedValue([
            makeResident("r1", COMPLEX_A),
        ]);

        accessService.requireComplexAccess.mockRejectedValue(
            makeError("Unexpected failure", 500)
        );

        await expect(
            residentService.searchResidents({ search: "Ali" }, manager)
        ).rejects.toMatchObject({
            message: "Unexpected failure",
            statusCode: 500,
        });
    });
});

describe("ResidentService createResident validation", () => {
    test("rejects a missing request body", async () => {
        await expect(
            residentService.createResident(null, admin)
        ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("rejects missing required fields", async () => {
        await expect(
            residentService.createResident({}, admin)
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(unitRepository.findById).not.toHaveBeenCalled();
    });

    test("rejects an invalid mobile before looking up a unit", async () => {
        await expect(
            residentService.createResident(
                {
                    fullName: "Ali Test",
                    mobile: "invalid",
                    userId: "user-1",
                    unitId: "unit-1",
                },
                admin
            )
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(unitRepository.findById).not.toHaveBeenCalled();
    });
});

describe("ResidentService create, update and delete paths", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const resident = makeResident("r1", COMPLEX_A, "Ali Test");

        unitRepository.findById.mockResolvedValue(resident.unit);
        userRepository.findById.mockResolvedValue({
            id: "user-1",
            personId: null,
        });
        personRepository.getPersonById.mockResolvedValue(null);

        residentRepository.findById.mockResolvedValue(resident);
        residentRepository.findByUserId.mockResolvedValue(null);
        residentRepository.findByMobile.mockResolvedValue(null);
        residentRepository.findByPersonId.mockResolvedValue(null);
        residentRepository.create.mockResolvedValue(resident);
        residentRepository.update.mockResolvedValue(resident);
        residentRepository.delete.mockResolvedValue(resident);

        accessService.requireComplexAccess.mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const validCreateData = (overrides = {}) => ({
        fullName: "  Ali Test  ",
        mobile: "09123456789",
        userId: "user-1",
        unitId: "unit-1",
        ...overrides,
    });

    describe("createResident success and duplicate checks", () => {
        test("creates a resident without an optional personId", async () => {
            const resident = makeResident(
                "created-1",
                COMPLEX_A,
                "Ali Test"
            );

            residentRepository.create.mockResolvedValue(resident);

            const result = await residentService.createResident(
                validCreateData(),
                admin
            );

            expect(residentRepository.findByUserId)
                .toHaveBeenCalledWith("user-1");
            expect(residentRepository.findByMobile)
                .toHaveBeenCalledWith("09123456789");
            expect(residentRepository.create).toHaveBeenCalledWith({
                fullName: "Ali Test",
                mobile: "09123456789",
                userId: "user-1",
                unitId: "unit-1",
            });
            expect(personRepository.getPersonById).not.toHaveBeenCalled();
            expect(result).toMatchObject({
                id: "created-1",
                name: "Ali Test",
            });
        });

        test("creates a resident linked to an existing person", async () => {
            const person = {
                id: "person-1",
                firstName: "Ali",
                lastName: "Test",
            };
            const resident = makeResident(
                "created-2",
                COMPLEX_A,
                "Ali Test"
            );

            validCreateData({ personId: "person-1" });

            userRepository.findById.mockResolvedValue({
                id: "user-1",
                personId: "person-1",
            });
            personRepository.getPersonById.mockResolvedValue(person);
            residentRepository.create.mockResolvedValue(resident);

            const result = await residentService.createResident(
                validCreateData({ personId: "person-1" }),
                admin
            );

            expect(personRepository.getPersonById)
                .toHaveBeenCalledWith("person-1");
            expect(residentRepository.findByPersonId)
                .toHaveBeenCalledWith("person-1");
            expect(residentRepository.create).toHaveBeenCalledWith({
                fullName: "Ali Test",
                mobile: "09123456789",
                userId: "user-1",
                unitId: "unit-1",
                personId: "person-1",
            });
            expect(result.id).toBe("created-2");
        });

        test("treats an empty personId as not supplied", async () => {
            await residentService.createResident(
                validCreateData({ personId: "" }),
                admin
            );

            expect(personRepository.getPersonById).not.toHaveBeenCalled();
            expect(residentRepository.findByPersonId).not.toHaveBeenCalled();
            expect(residentRepository.create).toHaveBeenCalledWith({
                fullName: "Ali Test",
                mobile: "09123456789",
                userId: "user-1",
                unitId: "unit-1",
            });
        });

        test("rejects a person not found in the person repository", async () => {
            personRepository.getPersonById.mockResolvedValue(null);

            await expect(
                residentService.createResident(
                    validCreateData({ personId: "missing-person" }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Person not found.",
            });

            expect(residentRepository.findByUserId).not.toHaveBeenCalled();
        });

        test("rejects a person that does not match the target user", async () => {
            personRepository.getPersonById.mockResolvedValue({
                id: "person-1",
            });
            userRepository.findById.mockResolvedValue({
                id: "user-1",
                personId: "person-2",
            });

            await expect(
                residentService.createResident(
                    validCreateData({ personId: "person-1" }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "This person is not connected to this user.",
            });

            expect(residentRepository.findByUserId).not.toHaveBeenCalled();
        });

        test("rejects a user who is already a resident", async () => {
            residentRepository.findByUserId.mockResolvedValue({
                id: "existing-resident",
                userId: "user-1",
            });

            await expect(
                residentService.createResident(validCreateData(), admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "This user is already a resident.",
            });

            expect(residentRepository.findByMobile).not.toHaveBeenCalled();
            expect(residentRepository.create).not.toHaveBeenCalled();
        });

        test("rejects a mobile number already used by another resident", async () => {
            residentRepository.findByMobile.mockResolvedValue({
                id: "existing-resident",
                mobile: "09123456789",
            });

            await expect(
                residentService.createResident(validCreateData(), admin)
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Mobile number already exists.",
            });

            expect(residentRepository.findByPersonId).not.toHaveBeenCalled();
            expect(residentRepository.create).not.toHaveBeenCalled();
        });

        test("rejects a person already linked to another resident", async () => {
            personRepository.getPersonById.mockResolvedValue({
                id: "person-1",
            });
            residentRepository.findByPersonId.mockResolvedValue({
                id: "existing-resident",
                personId: "person-1",
            });

            await expect(
                residentService.createResident(
                    validCreateData({ personId: "person-1" }),
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "This person is already connected to another resident.",
            });

            expect(residentRepository.create).not.toHaveBeenCalled();
        });

        test("maps a repository create error to an AppError", async () => {
            residentRepository.create.mockRejectedValue(
                new Error("Unexpected create failure")
            );

            await expect(
                residentService.createResident(validCreateData(), admin)
            ).rejects.toMatchObject({
                statusCode: 500,
                message: "Unable to create resident.",
            });
        });
    });

    describe("updateResident", () => {
        test("returns 404 when the resident does not exist", async () => {
            residentRepository.findById.mockResolvedValue(null);

            await expect(
                residentService.updateResident(
                    "missing-resident",
                    { fullName: "New Name" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Resident not found.",
            });

            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("trims fullName and removes immutable or unsupported fields", async () => {
            const resident = makeResident("r1", COMPLEX_A, "Ali Test");
            residentRepository.findById.mockResolvedValue(resident);

            await residentService.updateResident(
                "r1",
                {
                    fullName: "  Updated Name  ",
                    residentType: "OWNER",
                    buildingId: "building-1",
                    userId: "attempted-user-change",
                },
                admin
            );

            expect(residentRepository.update).toHaveBeenCalledWith("r1", {
                fullName: "Updated Name",
            });
        });

        test("rejects an invalid fullName", async () => {
            await expect(
                residentService.updateResident(
                    "r1",
                    { fullName: "   " },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "fullName cannot be empty.",
            });

            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("rejects an invalid mobile number", async () => {
            await expect(
                residentService.updateResident(
                    "r1",
                    { mobile: "123" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "شماره موبایل نامعتبر است.",
            });

            expect(residentRepository.findByMobile).not.toHaveBeenCalled();
            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("rejects a mobile number used by another resident", async () => {
            residentRepository.findByMobile.mockResolvedValue({
                id: "another-resident",
                mobile: "09123456789",
            });

            await expect(
                residentService.updateResident(
                    "r1",
                    { mobile: "09123456789" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message: "Mobile already exists.",
            });

            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("allows retaining the current resident's mobile number", async () => {
            residentRepository.findByMobile.mockResolvedValue({
                id: "r1",
                mobile: "09123456789",
            });

            await residentService.updateResident(
                "r1",
                { mobile: "09123456789" },
                admin
            );

            expect(residentRepository.update).toHaveBeenCalledWith(
                "r1",
                { mobile: "09123456789" }
            );
        });

        test("rejects updating to a person that does not exist", async () => {
            personRepository.getPersonById.mockResolvedValue(null);

            await expect(
                residentService.updateResident(
                    "r1",
                    { personId: "missing-person" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Person not found.",
            });

            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("rejects a person already assigned to another resident", async () => {
            personRepository.getPersonById.mockResolvedValue({
                id: "person-2",
            });
            residentRepository.findByPersonId.mockResolvedValue({
                id: "another-resident",
                personId: "person-2",
            });

            await expect(
                residentService.updateResident(
                    "r1",
                    { personId: "person-2" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 409,
                message:
                    "This person is already connected to another resident.",
            });

            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("normalizes an empty personId to null", async () => {
            await residentService.updateResident(
                "r1",
                { personId: "" },
                admin
            );

            expect(residentRepository.update).toHaveBeenCalledWith(
                "r1",
                { personId: null }
            );
        });

        test("rejects an explicitly empty unitId", async () => {
            await expect(
                residentService.updateResident(
                    "r1",
                    { unitId: "" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "unitId cannot be empty.",
            });

            expect(unitRepository.findById).not.toHaveBeenCalled();
            expect(residentRepository.update).not.toHaveBeenCalled();
        });

        test("validates and applies a new unitId", async () => {
            const newUnit = makeResident(
                "unit-resident",
                COMPLEX_A
            ).unit;
            unitRepository.findById.mockResolvedValue(newUnit);

            await residentService.updateResident(
                "r1",
                { unitId: "unit-new" },
                admin
            );

            expect(unitRepository.findById).toHaveBeenCalledWith("unit-new");
            expect(residentRepository.update).toHaveBeenCalledWith(
                "r1",
                { unitId: "unit-new" }
            );
        });

        test("maps a repository update error to an AppError", async () => {
            residentRepository.update.mockRejectedValue(
                new Error("Unexpected update failure")
            );

            await expect(
                residentService.updateResident(
                    "r1",
                    { fullName: "Updated Name" },
                    admin
                )
            ).rejects.toMatchObject({
                statusCode: 500,
                message: "Unable to update resident.",
            });
        });
    });

    describe("deleteResident", () => {
        test("returns 404 when the resident does not exist", async () => {
            residentRepository.findById.mockResolvedValue(null);

            await expect(
                residentService.deleteResident("missing-resident", admin)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Resident not found.",
            });

            expect(residentRepository.delete).not.toHaveBeenCalled();
        });

        test("propagates access denial and does not delete the resident", async () => {
            const managerUser = {
                id: "manager-1",
                role: "MANAGER",
            };

            accessService.requireComplexAccess.mockRejectedValue(
                new AppError("Forbidden.", 403)
            );

            await expect(
                residentService.deleteResident("r1", managerUser)
            ).rejects.toMatchObject({
                statusCode: 403,
            });

            expect(residentRepository.delete).not.toHaveBeenCalled();
        });

        test("deletes an accessible resident and returns success", async () => {
            const result = await residentService.deleteResident("r1", admin);

            expect(residentRepository.delete).toHaveBeenCalledWith("r1");
            expect(result).toEqual({
                success: true,
                message: "Resident deleted successfully.",
            });
        });
    });
});

describe("ResidentService remaining branch coverage", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        const resident = makeResident("r1", COMPLEX_A, "Ali Test");

        residentRepository.findAll.mockResolvedValue([resident]);
        residentRepository.count.mockResolvedValue(1);

        residentRepository.findById.mockResolvedValue(resident);
        residentRepository.findByPersonId.mockResolvedValue(null);
        residentRepository.update.mockResolvedValue(resident);

        personRepository.getPersonById.mockResolvedValue({
            id: "person-1",
            firstName: "Ali",
            lastName: "Test",
        });

        accessService.requireComplexAccess.mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("uses default page and limit when getResidents receives undefined", async () => {
        const result = await residentService.getResidents(
            undefined,
            undefined,
            admin
        );

        expect(residentRepository.findAll).toHaveBeenCalledWith(0, 20);
        expect(residentRepository.count).toHaveBeenCalledTimes(1);

        expect(result).toMatchObject({
            total: 1,
            page: 1,
            limit: 20,
            pages: 1,
        });
        expect(result.data).toHaveLength(1);
    });

    test("allows keeping the same person linked to the current resident", async () => {
        residentRepository.findByPersonId.mockResolvedValue({
            id: "r1",
            personId: "person-1",
        });

        await residentService.updateResident(
            "r1",
            { personId: "person-1" },
            admin
        );

        expect(residentRepository.findByPersonId).toHaveBeenCalledWith(
            "person-1"
        );
        expect(residentRepository.update).toHaveBeenCalledWith(
            "r1",
            { personId: "person-1" }
        );
    });

    test("allows linking a person that is not connected to another resident", async () => {
        residentRepository.findByPersonId.mockResolvedValue(null);

        await residentService.updateResident(
            "r1",
            { personId: "person-1" },
            admin
        );

        expect(residentRepository.findByPersonId).toHaveBeenCalledWith(
            "person-1"
        );
        expect(residentRepository.update).toHaveBeenCalledWith(
            "r1",
            { personId: "person-1" }
        );
    });
});
