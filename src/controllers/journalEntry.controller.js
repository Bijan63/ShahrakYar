const journalEntryService =
    require("../services/journalEntry.service");


// ======================================================
// Get All Journal Entries
// ======================================================

const getJournalEntries = async (
    req,
    res,
    next
) => {

    try {

        const entries =
            await journalEntryService.getAll();

        return res.status(200).json({

            success: true,

            message:
                "Journal entries fetched successfully",

            data: entries

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Get Journal Entry by ID
// ======================================================

const getJournalEntryById = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.getById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entry fetched successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Get Journal Entry by Entry Number
// ======================================================

const getJournalEntryByEntryNumber = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.getByEntryNumber(
                req.params.entryNumber
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entry fetched successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Get Journal Entries by Fiscal Period
// ======================================================

const getJournalEntriesByFiscalPeriod = async (
    req,
    res,
    next
) => {

    try {

        const entries =
            await journalEntryService.getByFiscalPeriod(
                req.params.fiscalPeriodId
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entries fetched successfully",

            data: entries

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Get Journal Entries by Fund
// ======================================================

const getJournalEntriesByFund = async (
    req,
    res,
    next
) => {

    try {

        const entries =
            await journalEntryService.getByFund(
                req.params.fundId
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entries fetched successfully",

            data: entries

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Create Journal Entry
// ======================================================

const createJournalEntry = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.create(
                req.body
            );

        return res.status(201).json({

            success: true,

            message:
                "Journal entry created successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Update Journal Entry
// ======================================================

const updateJournalEntry = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.update(
                req.params.id,
                req.body
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entry updated successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Delete Journal Entry
// ======================================================

const deleteJournalEntry = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.delete(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entry deleted successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Post Journal Entry
// ======================================================

const postJournalEntry = async (
    req,
    res,
    next
) => {

    try {

        const entry =
            await journalEntryService.post(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            message:
                "Journal entry posted successfully",

            data: entry

        });

    }

    catch (error) {

        next(error);

    }

};


// ======================================================
// Export
// ======================================================

module.exports = {

    getJournalEntries,

    getJournalEntryById,

    getJournalEntryByEntryNumber,

    getJournalEntriesByFiscalPeriod,

    getJournalEntriesByFund,

    createJournalEntry,

    updateJournalEntry,

    deleteJournalEntry,

    postJournalEntry

};