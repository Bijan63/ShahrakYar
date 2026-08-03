const request = require("supertest");
const app = require("../../src/app");

describe("POST /api/auth/register", () => {
    test("should reject empty body", async () => {
        const response = await request(app).post("/api/auth/register").send({});

        expect(response.statusCode).toBe(400);
    });
});
