"use strict";

const MAIN_BACKEND_URL =
    process.env.MAIN_BACKEND_URL || "http://localhost:5000";

const REQUEST_TIMEOUT = 5000;


// ======================================================
// Main Backend Request
// ======================================================

async function mainBackendRequest(path, token) {

    // --------------------------------------------------
    // Validate Path
    // --------------------------------------------------

    if (
        typeof path !== "string" ||
        !path.startsWith("/")
    ) {

        throw new Error(
            "Invalid Main Backend request path"
        );

    }


    // --------------------------------------------------
    // Validate Token
    // --------------------------------------------------

    if (
        typeof token !== "string" ||
        !token.trim()
    ) {

        throw new Error(
            "Unauthorized"
        );

    }


    const cleanToken =
        token.replace(/^Bearer\s+/i, "").trim();


    // --------------------------------------------------
    // Send Request
    // --------------------------------------------------

    let response;

    try {

        response = await fetch(
            `${MAIN_BACKEND_URL}${path}`,
            {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${cleanToken}`,
                    Accept: "application/json",
                },

                signal: AbortSignal.timeout(
                    REQUEST_TIMEOUT
                ),
            }
        );

    } catch (error) {

        if (
            error.name === "TimeoutError" ||
            error.name === "AbortError"
        ) {

            throw new Error(
                "Main Backend request timed out"
            );

        }


        throw new Error(
            "Main Backend is unavailable"
        );

    }


    // --------------------------------------------------
    // Read Response
    // --------------------------------------------------

    let data = null;

    try {

        data = await response.json();

    } catch {

        data = null;

    }


    // --------------------------------------------------
    // Handle HTTP Errors
    // --------------------------------------------------

    if (!response.ok) {

        const error = new Error(

            data?.message ||
            "Main Backend request failed"

        );

        error.statusCode =
            response.status;

        throw error;

    }


    // --------------------------------------------------
    // Validate Response
    // --------------------------------------------------

    if (
        !data ||
        typeof data !== "object"
    ) {

        throw new Error(
            "Invalid response from Main Backend"
        );

    }


    return data;

}


// ======================================================
// Export
// ======================================================

module.exports = {
    mainBackendRequest,
};