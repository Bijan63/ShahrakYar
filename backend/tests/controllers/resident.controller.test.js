jest.mock("../../src/services/resident.service", () => ({
    createResident: jest.fn(),
    getResidents: jest.fn(),
    getResidentById: jest.fn(),
    searchResidents: jest.fn(),
    updateResident: jest.fn(),
    deleteResident: jest.fn(),
}));

jest.mock("../../src/helpers/response.helper", () => ({
    created: jest.fn(),
    success: jest.fn(),
}));

const residentService = require("../../src/services/resident.service");
const ResponseHelper = require("../../src/helpers/response.helper");

const {
    createResident,
    getResident,
    getResidents,
    searchResidents,
    updateResident,
    deleteResident,
} = require("../../src/controllers/resident.controller");

const user = {
    id: "user-1",
    role: "ADMIN",
};

const makeResponse = () => ({});

describe("ResidentController", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createResident", () => {
        test("creates a resident and sends the created response", async () => {
            const body = {
                fullName: "Ali Test",
                mobile: "09123456789",
                userId: "user-1",
                unitId: "unit-1",
            };
            const resident = {
                id: "resident-1",
                fullName: body.fullName,
            };
            const req = { body, user };
            const res = makeResponse();
            const next = jest.fn();

            residentService.createResident.mockResolvedValue(resident);

            await createResident(req, res, next);

            expect(residentService.createResident).toHaveBeenCalledWith(
                body,
                user
            );
            expect(ResponseHelper.created).toHaveBeenCalledWith(
                res,
                "Resident created successfully",
                resident
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Create resident failed");
            const req = { body: {}, user };
            const res = makeResponse();
            const next = jest.fn();

            residentService.createResident.mockRejectedValue(error);

            await createResident(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.created).not.toHaveBeenCalled();
        });
    });

    describe("getResidents", () => {
        test("uses numeric page and limit values", async () => {
            const result = {
                total: 12,
                page: 2,
                limit: 5,
                pages: 3,
                data: [],
            };
            const req = {
                query: {
                    page: "2",
                    limit: "5",
                },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.getResidents.mockResolvedValue(result);

            await getResidents(req, res, next);

            expect(residentService.getResidents).toHaveBeenCalledWith(
                2,
                5,
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Residents fetched successfully",
                result
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("uses default page and limit for zero or invalid values", async () => {
            const result = {
                total: 0,
                page: 1,
                limit: 20,
                pages: 0,
                data: [],
            };
            const req = {
                query: {
                    page: "0",
                    limit: "invalid",
                },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.getResidents.mockResolvedValue(result);

            await getResidents(req, res, next);

            expect(residentService.getResidents).toHaveBeenCalledWith(
                1,
                20,
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Residents fetched successfully",
                result
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Fetch residents failed");
            const req = {
                query: { page: "1", limit: "20" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.getResidents.mockRejectedValue(error);

            await getResidents(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.success).not.toHaveBeenCalled();
        });
    });

    describe("getResident", () => {
        test("returns the requested resident", async () => {
            const resident = {
                id: "resident-1",
                fullName: "Ali Test",
            };
            const req = {
                params: { id: "resident-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.getResidentById.mockResolvedValue(resident);

            await getResident(req, res, next);

            expect(residentService.getResidentById).toHaveBeenCalledWith(
                "resident-1",
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Resident fetched successfully",
                resident
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Get resident failed");
            const req = {
                params: { id: "resident-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.getResidentById.mockRejectedValue(error);

            await getResident(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.success).not.toHaveBeenCalled();
        });
    });

    describe("searchResidents", () => {
        test("returns search results", async () => {
            const query = {
                search: "Ali",
                page: "1",
                limit: "10",
            };
            const result = {
                total: 1,
                data: [{ id: "resident-1" }],
            };
            const req = { query, user };
            const res = makeResponse();
            const next = jest.fn();

            residentService.searchResidents.mockResolvedValue(result);

            await searchResidents(req, res, next);

            expect(residentService.searchResidents).toHaveBeenCalledWith(
                query,
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Residents searched successfully",
                result
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Search residents failed");
            const req = {
                query: { search: "Ali" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.searchResidents.mockRejectedValue(error);

            await searchResidents(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.success).not.toHaveBeenCalled();
        });
    });

    describe("updateResident", () => {
        test("returns the updated resident", async () => {
            const body = {
                fullName: "Ali Updated",
            };
            const resident = {
                id: "resident-1",
                fullName: body.fullName,
            };
            const req = {
                params: { id: "resident-1" },
                body,
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.updateResident.mockResolvedValue(resident);

            await updateResident(req, res, next);

            expect(residentService.updateResident).toHaveBeenCalledWith(
                "resident-1",
                body,
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Resident updated successfully",
                resident
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Update resident failed");
            const req = {
                params: { id: "resident-1" },
                body: {},
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.updateResident.mockRejectedValue(error);

            await updateResident(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.success).not.toHaveBeenCalled();
        });
    });

    describe("deleteResident", () => {
        test("returns the successful deletion response", async () => {
            const result = {
                id: "resident-1",
                deleted: true,
            };
            const req = {
                params: { id: "resident-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.deleteResident.mockResolvedValue(result);

            await deleteResident(req, res, next);

            expect(residentService.deleteResident).toHaveBeenCalledWith(
                "resident-1",
                user
            );
            expect(ResponseHelper.success).toHaveBeenCalledWith(
                res,
                "Resident deleted successfully",
                result
            );
            expect(next).not.toHaveBeenCalled();
        });

        test("passes service errors to next", async () => {
            const error = new Error("Delete resident failed");
            const req = {
                params: { id: "resident-1" },
                user,
            };
            const res = makeResponse();
            const next = jest.fn();

            residentService.deleteResident.mockRejectedValue(error);

            await deleteResident(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(ResponseHelper.success).not.toHaveBeenCalled();
        });
    });
});
