
"use strict";

// ======================================================
// API Base URLs
// ======================================================

const MAIN_API_BASE_URL =
    "http://localhost:5000/api";

const FINANCE_API_BASE_URL =
    "http://localhost:5100/api";


// ======================================================
// Common JSON Request
// ======================================================

async function requestJson(url, options = {}) {

    let response;

    try {

        response = await fetch(url, options);

    } catch (cause) {

        const error = new Error(
            "ارتباط با سرور برقرار نشد. لطفاً وضعیت Backend را بررسی کنید."
        );

        error.cause = cause;

        throw error;

    }


    const data = await response.json().catch(() => null);


    if (!response.ok) {

        const error = new Error(
            data?.message ||
            `خطای سرور (${response.status})`
        );

        error.status = response.status;

        error.data = data;

        throw error;

    }


    if (data === null) {

        const error = new Error(
            "پاسخ دریافتی از سرور معتبر نیست."
        );

        error.status = response.status;

        throw error;

    }


    return data;

}


// ======================================================
// Finance Request
// ======================================================

async function financeRequest(
    path,
    token,
    options = {}
) {

    if (!token) {

        const error = new Error(
            "Access token is required."
        );

        error.status = 401;

        throw error;

    }


    return await requestJson(

        `${FINANCE_API_BASE_URL}/finance${path}`,

        {

            ...options,

            headers: {

                Accept: "application/json",

                ...options.headers,

                Authorization: `Bearer ${token}`

            }

        }

    );

}


// ======================================================
// Login
// ======================================================

export async function login(
    email,
    password
) {

    return await requestJson(

        `${MAIN_API_BASE_URL}/auth/login`,

        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                Accept:
                    "application/json"

            },

            body: JSON.stringify({

                email,

                password

            })

        }

    );

}


// ======================================================
// Finance Properties
// ======================================================

export async function getFinanceProperties(
    token
) {

    return await financeRequest(
        "/properties",
        token
    );

}


// ======================================================
// Fiscal Periods
// ======================================================

export async function getFiscalPeriods(
    token
) {

    return await financeRequest(
        "/fiscal-periods",
        token
    );

}


// ======================================================
// Trial Balance
// ======================================================

export async function getTrialBalance(
    token,
    fiscalPeriodId
) {

    if (!fiscalPeriodId) {

        throw new Error(
            "شناسه دوره مالی الزامی است."
        );

    }


    const params = new URLSearchParams({

        fiscalPeriodId

    });


    return await financeRequest(

        `/reports/trial-balance?${params.toString()}`,

        token

    );

}


// ======================================================
// General Ledger
// ======================================================

export async function getGeneralLedger(
    token,
    fiscalPeriodId,
    accountId
) {

    if (!fiscalPeriodId) {

        throw new Error(
            "شناسه دوره مالی الزامی است."
        );

    }


    if (!accountId) {

        throw new Error(
            "شناسه حساب برای دریافت دفتر کل الزامی است."
        );

    }


    const params = new URLSearchParams({

        fiscalPeriodId,

        accountId

    });


    return await financeRequest(

        `/reports/general-ledger?${params.toString()}`,

        token

    );

}


// ======================================================
// Balance Sheet
// ======================================================

export async function getBalanceSheet(
    token,
    fiscalPeriodId
) {

    if (!fiscalPeriodId) {

        throw new Error(
            "شناسه دوره مالی الزامی است."
        );

    }


    return await financeRequest(

        `/reports/balance-sheet/${encodeURIComponent(fiscalPeriodId)}`,

        token

    );

}


// ======================================================
// Income Statement
// ======================================================

export async function getIncomeStatement(
    token,
    fiscalPeriodId
) {

    if (!fiscalPeriodId) {

        throw new Error(
            "شناسه دوره مالی الزامی است."
        );

    }


    return await financeRequest(

        `/reports/income-statement/${encodeURIComponent(fiscalPeriodId)}`,

        token

    );

}


// ======================================================
// Cash Flow Statement
// ======================================================

export async function getCashFlowStatement(
    token,
    fiscalPeriodId
) {

    if (!fiscalPeriodId) {

        throw new Error(
            "شناسه دوره مالی الزامی است."
        );

    }


    return await financeRequest(

        `/reports/cash-flow/${encodeURIComponent(fiscalPeriodId)}`,

        token

    );

}



// ======================================================
// Journal Entries - Get All
// ======================================================

export async function getJournalEntries(token) {

    return await financeRequest(
        "/journal-entries",
        token
    );

}


// ======================================================
// Journal Entries - Get by Fiscal Period
// ======================================================

export async function getJournalEntriesByFiscalPeriod(
    token,
    fiscalPeriodId
) {

    if (!fiscalPeriodId) {
        throw new Error("شناسه دوره مالی الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/fiscal-period/${encodeURIComponent(fiscalPeriodId)}`,
        token
    );

}


// ======================================================
// Journal Entry - Get by ID
// ======================================================

export async function getJournalEntryById(
    token,
    id
) {

    if (!id) {
        throw new Error("شناسه سند الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/${encodeURIComponent(id)}`,
        token
    );

}


// ======================================================
// Journal Entry - Get by Entry Number
// ======================================================

export async function getJournalEntryByEntryNumber(
    token,
    entryNumber
) {

    if (!entryNumber) {
        throw new Error("شماره سند الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/number/${encodeURIComponent(entryNumber)}`,
        token
    );

}


// ======================================================
// Journal Entries - Get by Fund
// ======================================================

export async function getJournalEntriesByFund(
    token,
    fundId
) {

    if (!fundId) {
        throw new Error("شناسه صندوق الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/fund/${encodeURIComponent(fundId)}`,
        token
    );

}


// ======================================================
// Journal Entry - Create
// ======================================================

export async function createJournalEntry(
    token,
    payload
) {

    return await financeRequest(
        "/journal-entries",
        token,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        }
    );

}


// ======================================================
// Journal Entry - Update
// ======================================================

export async function updateJournalEntry(
    token,
    id,
    payload
) {

    if (!id) {
        throw new Error("شناسه سند الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/${encodeURIComponent(id)}`,
        token,
        {
            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        }
    );

}


// ======================================================
// Journal Entry - Delete
// ======================================================

export async function deleteJournalEntry(
    token,
    id
) {

    if (!id) {
        throw new Error("شناسه سند الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/${encodeURIComponent(id)}`,
        token,
        {
            method: "DELETE"
        }
    );

}


// ======================================================
// Journal Entry - Post
// ======================================================

export async function postJournalEntry(
    token,
    id
) {

    if (!id) {
        throw new Error("شناسه سند الزامی است.");
    }

    return await financeRequest(
        `/journal-entries/${encodeURIComponent(id)}/post`,
        token,
        {
            method: "POST"
        }
    );

}
