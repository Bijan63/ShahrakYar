const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
    res.json({
        name: "ShahrakYar API",
        version: "0.1.0",
        status: "Running 🚀"
    });
});

module.exports = app;