const path = require("node:path");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
    quiet: true
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "[TEST SAFETY] DATABASE_URL is missing. Jest stopped."
    );
}

let url;

try {
    url = new URL(databaseUrl);
} catch {
    throw new Error(
        "[TEST SAFETY] DATABASE_URL is invalid. Jest stopped."
    );
}

const sourceDatabase = decodeURIComponent(
    url.pathname.replace(/^\/+/, "")
);

const allowedDatabases = [
    "shahrakyar_v2",
    "shahrakyar_test"
];

if (!allowedDatabases.includes(sourceDatabase)) {
    throw new Error(
        "[TEST SAFETY] Unexpected database name. Jest stopped."
    );
}

const allowedHosts = [
    "localhost",
    "127.0.0.1",
    "::1",
    "[::1]"
];

if (!allowedHosts.includes(url.hostname)) {
    throw new Error(
        "[TEST SAFETY] Non-local database host. Jest stopped."
    );
}

url.pathname = "/shahrakyar_test";

process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = "test";

if (
    decodeURIComponent(
        new URL(process.env.DATABASE_URL).pathname.replace(/^\/+/, "")
    ) !== "shahrakyar_test"
) {
    throw new Error(
        "[TEST SAFETY] Could not enforce test database. Jest stopped."
    );
}
