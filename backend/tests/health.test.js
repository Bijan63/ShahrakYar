const request = require("supertest");
const app = require("../src/app");

describe("Health API", () => {
    test("GET / should return API status", async () => {
        const response = await request(app).get("/");

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);
        expect(response.body.name).toBe("ShahrakYar API");
        expect(response.body.version).toBe("1.0.0");
        expect(response.body.status).toContain("Running");
    });
});
