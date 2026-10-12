module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],
    setupFiles: ["<rootDir>/tests/setup-test-database.js"],
    collectCoverage: true,
    coverageDirectory: "coverage"
};
