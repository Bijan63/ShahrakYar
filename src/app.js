const express =
    require("express");

const cors =
    require("cors");

const swaggerUi =
    require("swagger-ui-express");

const swaggerSpec =
    require("./config/swagger");


// ======================================================
// Routes
// ======================================================

const fiscalPeriodRoutes =
    require("./routes/fiscalPeriod.routes");

const financePropertyRoutes =
    require("./routes/financeProperty.routes");

const propertyAccountRoutes =
    require("./routes/propertyAccount.routes");

const fundRoutes =
    require("./routes/fund.routes");

const financialAccountRoutes =
    require("./routes/financialAccount.routes");

const accountLedgerRoutes =
    require("./routes/accountLedger.routes");

const accountRoutes =
    require("./routes/account.routes");

const journalEntryRoutes =
    require("./routes/journalEntry.routes");

const openingBalanceRoutes =
    require("./routes/openingBalance.routes");

const financialReportRoutes =
    require("./routes/financialReport.routes");

const financialIntegrityRoutes =
    require("./routes/financialIntegrity.routes");

    const accountingConfigurationRoutes =
    require("./routes/accountingConfiguration.routes");

// ======================================================
// App
// ======================================================

const mainBackendAuthMiddleware =
    require("./middleware/mainBackendAuth.middleware");
const financeAdminOnlyMiddleware =
    require("./middleware/financeAdminOnly.middleware");

const app =
    express();


// ======================================================
// Middleware
// ======================================================

app.use(cors());

app.use(express.json());


// ======================================================
// Swagger
// ======================================================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


// ======================================================
// Health Check
// ======================================================

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            message:
                "Finance API is running"

        });

    }
);


// ======================================================
// Finance API Security Boundary
// ======================================================

app.use(
    "/api/finance",
    mainBackendAuthMiddleware,
    financeAdminOnlyMiddleware
);

// ======================================================
// Finance Property Routes
// ======================================================

app.use(
    "/api/finance",
    financePropertyRoutes
);


// ======================================================
// Fiscal Period Routes
// ======================================================

app.use(
    "/api/finance/fiscal-periods",
    fiscalPeriodRoutes
);

app.use(
    "/api/finance",
    financialReportRoutes
);

// ======================================================
// Property Account Routes
// ======================================================

app.use(
    "/api/finance/property-accounts",
    propertyAccountRoutes
);


// ======================================================
// Fund Routes
// ======================================================

app.use(
    "/api/finance/funds",
    fundRoutes
);


// ======================================================
// Financial Account Routes
// ======================================================

app.use(
    "/api/finance/financial-accounts",
    financialAccountRoutes
);


// ======================================================
// Account Routes
// ======================================================

app.use(
    "/api/finance/accounts",
    accountRoutes
);

app.use(
    "/api/finance",
    accountLedgerRoutes
);


// ======================================================
// Journal Entry Routes
// ======================================================

app.use(
    "/api/finance/journal-entries",
    journalEntryRoutes
);

// ======================================================
// Opening Balance Routes
// ======================================================

app.use(
    "/api/finance/opening-balances",
    openingBalanceRoutes
);

// ======================================================
// Financial Integrity Routes
// ======================================================

app.use(
    "/api/finance/financial-integrity",
    financialIntegrityRoutes
);

app.use(
    "/api/finance/accounting-configurations",
    accountingConfigurationRoutes
);

// ======================================================
// Server
// ======================================================

const PORT =
    process.env.PORT || 5100;


app.listen(
    PORT,
    () => {

        console.log(
            `Finance API running on port ${PORT}`
        );

    }
);