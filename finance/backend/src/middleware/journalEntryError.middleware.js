
// ======================================================
// Journal Entry Error Middleware
// ======================================================

const getJournalEntryErrorStatus = (error) => {

    const message = error?.message || "";
    const code = error?.code;


    // --------------------------------------------------
    // Prisma Errors
    // --------------------------------------------------

    if (code === "P2002" || code === "P2003" || code === "P2004") {
        return 409;
    }

    if (code === "P2025") {
        return 404;
    }

    if (code === "P2023") {
        return 400;
    }


    // --------------------------------------------------
    // 404 - Not Found
    // --------------------------------------------------

    const notFoundMessages = [
        "Journal entry not found",
        "Fiscal period not found",
        "Fund not found"
    ];

    if (
        notFoundMessages.includes(message) ||
        message.startsWith("Account not found:")
    ) {
        return 404;
    }


    // --------------------------------------------------
    // 409 - Conflict
    // --------------------------------------------------

    const conflictMessages = [

        "Entry number already exists",

        "Only DRAFT journal entries can be modified",

        "Only DRAFT journal entries can be updated",

        "Only DRAFT journal entries can be deleted",

        "Only DRAFT journal entries can be posted",

        "Journal entry must be posted using the post operation",

        "Journal entry fiscal period cannot be changed",

        "Journal entry can only be created in an active fiscal period",

        "Journal entry can only be modified in an active fiscal period",

        "Journal entry can only be posted in an active fiscal period",

        "Journal entry can only use an active fund"

    ];

    if (conflictMessages.includes(message)) {
        return 409;
    }

    if (
        message.startsWith("Account is inactive:")
    ) {
        return 409;
    }


    // --------------------------------------------------
    // 400 - Bad Request
    // --------------------------------------------------

    const badRequestMessages = [

        "id is required",

        "Journal entry ID is required",

        "Journal entry status is required",

        "entryNumber is required",

        "entryDate is required",

        "fiscalPeriodId is required",

        "fundId is required",

        "Invalid fundId",

        "Request body is required",

        "Invalid entryDate",

        "Invalid time in entryDate",

        "Invalid Gregorian calendar date",

        "Invalid journal entry status",

        "Journal entry must have at least two lines",

        "Invalid journal entry line",

        "accountId is required for every journal entry line",

        "Debit and credit must be valid numbers",

        "Debit and credit cannot be negative",

        "A journal entry line cannot have both debit and credit",

        "A journal entry line must have debit or credit amount"

    ];

    if (badRequestMessages.includes(message)) {
        return 400;
    }


    // --------------------------------------------------
    // Dynamic Validation Errors
    // --------------------------------------------------

    if (
        message.startsWith("Invalid entryDate:")
    ) {
        return 400;
    }

    if (
        message.startsWith("Journal entry is not balanced.")
    ) {
        return 400;
    }

    if (
        message.startsWith("Journal entry can only be posted to a leaf account:")
    ) {
        return 400;
    }

    if (
        message.startsWith("Account ") &&
        message.includes(" does not belong to the journal entry fiscal period")
    ) {
        return 400;
    }

    if (
        message === "Fund does not belong to the selected fiscal period"
    ) {
        return 400;
    }

    if (
        message === "Entry date is outside the fiscal period"
    ) {
        return 400;
    }


    // --------------------------------------------------
    // 500 - Internal Server Error
    // --------------------------------------------------

    return 500;

};


// ======================================================
// Express Error Handler
// ======================================================

const journalEntryErrorMiddleware = (
    error,
    req,
    res,
    next
) => {

    if (res.headersSent) {
        return next(error);
    }

    const status =
        getJournalEntryErrorStatus(error);


    if (status >= 500) {

        console.error(
            "Journal Entry Error:",
            error
        );

    }


    return res.status(status).json({

        success: false,

        message:
            status === 500
                ? "Internal server error"
                : error.message

    });

};


module.exports = journalEntryErrorMiddleware;
