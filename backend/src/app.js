const express = require("express");
const authRoutes = require("./routes/auth.routes");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        name: "ShahrakYar API",
        version: "0.1.0",
        status: "Running 🚀"
    });
});

module.exports = app;

