const path = require("path");
const express = require("express");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const buildingRoutes = require("./routes/building.routes");
const unitRoutes = require("./routes/unit.routes");
const residentRoutes = require("./routes/resident.routes");
const electionRoutes = require("./routes/election.routes");
const candidateRoutes = require("./routes/candidate.routes");
const voteRoutes = require("./routes/vote.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
// Error Middleware
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.disable("x-powered-by");

app.use(express.json());
app.use(
    express.static(
        path.join(__dirname, "../public")
    )
);
app.use(express.static(path.join(__dirname, "../public")));
// ========================================
// Swagger Documentation
// ========================================

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========================================
// API Routes
// ========================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/buildings", buildingRoutes);

app.use("/api/units", unitRoutes);

app.use("/api/residents", residentRoutes);

app.use("/api/elections", electionRoutes);

app.use("/api/candidates", candidateRoutes);

app.use("/api/votes", voteRoutes);

// ========================================
// Home Route
// ========================================

app.get("/", (req, res) => {
    res.json({
        success: true,

        name: "ShahrakYar API",

        version: "1.0.0",

        status: "Running 🚀"
    });
});
app.use("/api/dashboard", dashboardRoutes);
// ========================================
// Error Handler
// ========================================

app.use(errorHandler);

module.exports = app;
