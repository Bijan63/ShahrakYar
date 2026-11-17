const express =
    require("express");

const {
    getAccountLedger
} =
    require("../controllers/accountLedger.controller");


const router =
    express.Router();


// ======================================================
// Account Ledger
// ======================================================

router.get(
    "/accounts/:accountId/ledger",
    getAccountLedger
);


// ======================================================
// Export
// ======================================================

module.exports =
    router;