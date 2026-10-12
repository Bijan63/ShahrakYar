jest.mock("../../src/repositories/complexManager.repository", () => ({
    create: jest.fn(),
    findByUserAndComplex: jest.fn()
}));

jest.mock("../../src/repositories/user.repository", () => ({
    findById: jest.fn()
}));

jest.mock("../../src/repositories/complex.repository", () => ({
    findById: jest.fn()
}));

const complexManagerRepository =
    require("../../src/repositories/complexManager.repository");

const userRepository =
    require("../../src/repositories/user.repository");

const complexRepository =
    require("../../src/repositories/complex.repository");

const complexManagerService =
    require("../../src/services/complexManager.service");

describe("ComplexManagerService duplicate assignment", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        userRepository.findById.mockResolvedValue({
            id: "manager-1",
            role: "MANAGER",
            status: "ACTIVE"
        });

        complexRepository.findById.mockResolvedValue({
            id: "complex-1"
        });

        complexManagerRepository.findByUserAndComplex
            .mockResolvedValue(null);
    });

    test("maps Prisma P2002 to HTTP 409", async () => {
        complexManagerRepository.create.mockRejectedValue({
            code: "P2002"
        });

        await expect(
            complexManagerService.assignManager(
                "manager-1",
                "complex-1"
            )
        ).rejects.toMatchObject({
            message:
                "This manager is already assigned to this complex.",
            statusCode: 409
        });
    });

    test("rethrows unrelated database errors", async () => {
        const databaseError = new Error(
            "Unexpected database failure"
        );

        databaseError.code = "P1001";

        complexManagerRepository.create.mockRejectedValue(
            databaseError
        );

        await expect(
            complexManagerService.assignManager(
                "manager-1",
                "complex-1"
            )
        ).rejects.toBe(databaseError);
    });
});
