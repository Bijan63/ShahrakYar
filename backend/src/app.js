const path = require("path");
const express = require("express");
const cors = require("cors");
const propertyAddressRoutes =
    require("./routes/propertyAddress.routes");
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
const complexRoutes = require("./routes/complex.routes");
const residencyRoutes = require("./routes/residency.routes");
const complexManagerRoutes =
    require("./routes/complexManager.routes");
const propertyRoutes = require("./routes/property.routes");
const personRoutes = require("./routes/person.routes");
const ownershipRoutes = require("./routes/ownership.routes");
const unitAccountRoutes =
    require("./routes/unitAccount.routes");
const chargeRoutes =
    require("./routes/charge.routes");
const chargePaymentRoutes =
    require("./routes/chargePayment.routes");

// Error Middleware
const errorHandler = require("./middleware/error.middleware");

const app = express();

app.disable("x-powered-by");

app.use(express.json());

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
    })
);

app.use(express.static(path.join(__dirname, "../public")));

// ========================================
// Swagger Documentation
// ========================================

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========================================
// API Routes
// ========================================
app.use(
    "/api/property-addresses",
    propertyAddressRoutes
);
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/buildings", buildingRoutes);

app.use("/api/units", unitRoutes);

app.use("/api/residents", residentRoutes);

app.use(
    "/api/complex-managers",
    complexManagerRoutes
);

app.use("/api/elections", electionRoutes);

app.use("/api/candidates", candidateRoutes);

app.use("/api/votes", voteRoutes);

app.use("/api/properties", propertyRoutes);

app.use("/api/ownerships", ownershipRoutes);

app.use("/api/persons", personRoutes);

app.use(
    "/api/residencies",
    residencyRoutes
);
app.use(
    "/api/unit-accounts",
    unitAccountRoutes
);
app.use(
    "/api/charges",
    chargeRoutes
);
app.use(
    "/api/charge-payments",
    chargePaymentRoutes
);
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

app.use("/api/complexes", complexRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ========================================
// Error Handler
// ========================================

app.use(errorHandler);

module.exports = app;
