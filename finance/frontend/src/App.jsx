import { useCallback, useEffect, useState } from "react";

import {
    getFinanceProperties,
    getFiscalPeriods,
    getTrialBalance,
    getGeneralLedger,
    getBalanceSheet,
    getIncomeStatement,
    getCashFlowStatement,
} from "./api/api";

import Login from "./components/Login";

import IncomeStatement
    from "./components/reports/IncomeStatement";

import CashFlowStatement
    from "./components/reports/CashFlowStatement";
import JournalEntries
    from "./components/reports/JournalEntries";

import "./App.css";


// ======================================================
// App
// ======================================================

function App() {

    // ==================================================
    // Authentication
    // ==================================================

    const [token, setToken] = useState(
        localStorage.getItem("token")
    );


    // ==================================================
    // Finance Data
    // ==================================================

    const [properties, setProperties] = useState([]);

    const [fiscalPeriods, setFiscalPeriods] = useState([]);

    const [selectedFiscalPeriodId, setSelectedFiscalPeriodId] =
        useState("");


    // ==================================================
    // Trial Balance
    // ==================================================

    const [trialBalance, setTrialBalance] = useState(null);


    // ==================================================
    // General Ledger
    // ==================================================

    const [selectedAccountId, setSelectedAccountId] =
        useState("");

    const [generalLedger, setGeneralLedger] = useState(null);


    // ==================================================
    // Balance Sheet
    // ==================================================

    const [balanceSheet, setBalanceSheet] = useState(null);

    // ==================================================
    // Income Statement
    // ==================================================

    const [incomeStatement, setIncomeStatement] = useState(null);

    const [incomeStatementLoading, setIncomeStatementLoading] =
        useState(false);

    const [incomeStatementError, setIncomeStatementError] =
        useState("");


    // ==================================================
    // Cash Flow Statement
    // ==================================================

    const [cashFlowStatement, setCashFlowStatement] = useState(null);

    const [cashFlowLoading, setCashFlowLoading] =
        useState(false);

    const [cashFlowError, setCashFlowError] =
        useState("");
    // ==================================================
    // Loading / Error
    // ==================================================

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");


    // ==================================================
    // Logout
    // ==================================================

    const handleLogout = useCallback(() => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);

        setProperties([]);
        setFiscalPeriods([]);

        setSelectedFiscalPeriodId("");

        setTrialBalance(null);

        setSelectedAccountId("");

        setGeneralLedger(null);

        setBalanceSheet(null);

        setIncomeStatement(null);
        setCashFlowStatement(null);

        setIncomeStatementError("");
        setCashFlowError("");

        setError("");

    }, []);


    // ==================================================
    // Login
    // ==================================================

    const handleLogin = () => {

        const newToken =
            localStorage.getItem("token");

        setToken(newToken);
    };

    // ==================================================
    // Load Initial Finance Data
    // ==================================================

    const loadFinanceData = useCallback(async (isCurrent) => {

        try {

            setLoading(true);
            setError("");

            // Properties
            const propertiesResponse =
                await getFinanceProperties(token);

            if (!isCurrent()) return;

            setProperties(
                propertiesResponse?.data || []
            );

            // Fiscal Periods
            const periodsResponse =
                await getFiscalPeriods(token);

            if (!isCurrent()) return;

            const periods =
                periodsResponse?.data || [];

            setFiscalPeriods(periods);

            // Select Active Period
            const activePeriod =
                periods.find(
                    period => period.status === "ACTIVE"
                );

            const initialPeriod =
                activePeriod || periods[0];

            if (initialPeriod) {
                setSelectedFiscalPeriodId(
                    initialPeriod.id
                );
            }

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("Finance Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setError(
                err.message ||
                "دریافت اطلاعات مالی با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setLoading(false);
            }

        }

    }, [token, handleLogout]);


    // ==================================================
    // Load Trial Balance
    // ==================================================

    const loadTrialBalance = useCallback(async (isCurrent) => {

        try {

            await Promise.resolve();

            if (!isCurrent()) return;

            setLoading(true);
            setError("");

            const response =
                await getTrialBalance(
                    token,
                    selectedFiscalPeriodId
                );

            if (!isCurrent()) return;

            console.log("Trial Balance:", response);

            const data =
                response?.data || null;

            setTrialBalance(data);

            // Select First Account
            const accounts =
                data?.accounts || [];

            if (accounts.length > 0) {

                setSelectedAccountId(
                    accounts[0].accountId
                );

            }
            else {

                setSelectedAccountId("");
                setGeneralLedger(null);

            }

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("Trial Balance Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setError(
                err.message ||
                "دریافت تراز آزمایشی با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setLoading(false);
            }

        }

    }, [token, selectedFiscalPeriodId, handleLogout]);


    // ==================================================
    // Load General Ledger
    // ==================================================

    const loadGeneralLedger = useCallback(async (isCurrent) => {

        try {

            setLoading(true);
            setError("");

            const response =
                await getGeneralLedger(
                    token,
                    selectedFiscalPeriodId,
                    selectedAccountId
                );

            if (!isCurrent()) return;

            console.log("General Ledger:", response);

            setGeneralLedger(
                response?.data || null
            );

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("General Ledger Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setError(
                err.message ||
                "دریافت دفتر کل با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setLoading(false);
            }

        }

    }, [
        token,
        selectedFiscalPeriodId,
        selectedAccountId,
        handleLogout
    ]);


    // ==================================================
    // Load Balance Sheet
    // ==================================================

    const loadBalanceSheet = useCallback(async (isCurrent) => {

        try {

            await Promise.resolve();

            if (!isCurrent()) return;

            setLoading(true);
            setError("");

            const response =
                await getBalanceSheet(
                    token,
                    selectedFiscalPeriodId
                );

            if (!isCurrent()) return;

            console.log("Balance Sheet:", response);

            setBalanceSheet(
                response?.data || null
            );

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("Balance Sheet Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setError(
                err.message ||
                "دریافت ترازنامه با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setLoading(false);
            }

        }

    }, [token, selectedFiscalPeriodId, handleLogout]);


    // ==================================================
    // Load Income Statement
    // ==================================================

    const loadIncomeStatement = useCallback(async (isCurrent) => {

        try {

            setIncomeStatementLoading(true);
            setIncomeStatementError("");

            const response =
                await getIncomeStatement(
                    token,
                    selectedFiscalPeriodId
                );

            if (!isCurrent()) return;

            setIncomeStatement(
                response?.data || null
            );

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("Income Statement Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setIncomeStatement(null);

            setIncomeStatementError(
                err.message ||
                "دریافت صورت سود و زیان با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setIncomeStatementLoading(false);
            }

        }

    }, [token, selectedFiscalPeriodId, handleLogout]);


    // ==================================================
    // Load Cash Flow Statement
    // ==================================================

    const loadCashFlowStatement = useCallback(async (isCurrent) => {

        try {

            setCashFlowLoading(true);
            setCashFlowError("");

            const response =
                await getCashFlowStatement(
                    token,
                    selectedFiscalPeriodId
                );

            if (!isCurrent()) return;

            setCashFlowStatement(
                response?.data || null
            );

        }
        catch (err) {

            if (!isCurrent()) return;

            console.error("Cash Flow Statement Error:", err);

            if (err.status === 401) {
                handleLogout();
                return;
            }

            setCashFlowStatement(null);

            setCashFlowError(
                err.message ||
                "دریافت صورت جریان وجوه نقد با خطا مواجه شد."
            );

        }
        finally {

            if (isCurrent()) {
                setCashFlowLoading(false);
            }

        }

    }, [token, selectedFiscalPeriodId, handleLogout]);

    // ==================================================
    // Effects
    // ==================================================

    // Initial Finance Data
    useEffect(() => {

        if (!token) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadFinanceData(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [token, loadFinanceData]);


    // Trial Balance
    useEffect(() => {

        if (!token || !selectedFiscalPeriodId) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadTrialBalance(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [
        token,
        selectedFiscalPeriodId,
        loadTrialBalance
    ]);


    // General Ledger
    useEffect(() => {

        if (
            !token ||
            !selectedFiscalPeriodId ||
            !selectedAccountId
        ) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadGeneralLedger(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [
        token,
        selectedFiscalPeriodId,
        selectedAccountId,
        loadGeneralLedger
    ]);


    // Balance Sheet
    useEffect(() => {

        if (!token || !selectedFiscalPeriodId) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadBalanceSheet(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [
        token,
        selectedFiscalPeriodId,
        loadBalanceSheet
    ]);


    // Income Statement
    useEffect(() => {

        if (!token || !selectedFiscalPeriodId) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadIncomeStatement(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [
        token,
        selectedFiscalPeriodId,
        loadIncomeStatement
    ]);


    // Cash Flow Statement
    useEffect(() => {

        if (!token || !selectedFiscalPeriodId) return;

        let active = true;

        void Promise.resolve().then(() => {
            if (active) {
                loadCashFlowStatement(() => active);
            }
        });

        return () => {
            active = false;
        };

    }, [
        token,
        selectedFiscalPeriodId,
        loadCashFlowStatement
    ]);

    // ==================================================
    // Login Screen
    // ==================================================

    if (!token) {

        return (
            <Login
                onLogin={handleLogin}
            />
        );

    }


    // ==================================================
    // Initial Loading Screen
    // ==================================================

    if (
        loading &&
        !trialBalance &&
        !balanceSheet
    ) {

        return (
            <div
                dir="rtl"
                style={{
                    padding: "40px",
                    fontFamily: "Tahoma",
                }}
            >

                <h1>
                    امور مالی شهرک
                </h1>

                <p>
                    در حال دریافت اطلاعات مالی...
                </p>

            </div>
        );

    }


    // ==================================================
    // Main Error Screen
    // ==================================================

    if (
        error &&
        !trialBalance &&
        !balanceSheet
    ) {

        return (
            <div
                dir="rtl"
                style={{
                    padding: "40px",
                    fontFamily: "Tahoma",
                }}
            >

                <h1>
                    امور مالی شهرک
                </h1>

                <p>
                    {error}
                </p>

                <button
                    onClick={handleLogout}
                >
                    خروج
                </button>

            </div>
        );

    }


    // ==================================================
    // Accounts
    // ==================================================

    const accounts =
        trialBalance?.accounts || [];


    // ==================================================
    // Number Formatter
    // ==================================================

    const formatNumber = (value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "fa-IR"
        );

    };


    // ==================================================
    // Render
    // ==================================================

    return (

        <div
            dir="rtl"
            style={{
                padding: "30px",
                fontFamily: "Tahoma",
                maxWidth: "1400px",
                margin: "0 auto",
            }}
        >

            {/* ========================================
                Header
            ========================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >

                <h1>
                    امور مالی شهرک
                </h1>


                <button
                    onClick={handleLogout}
                >
                    خروج
                </button>

            </div>


            {/* ========================================
                Properties Summary
            ========================================= */}

            <div
                style={{
                    marginBottom: "25px",
                }}
            >

                <strong>
                    تعداد املاک:
                </strong>

                {" "}

                {properties.length}

            </div>


            {/* ========================================
                Fiscal Period
            ========================================= */}

            <div
                style={{
                    marginBottom: "30px",
                }}
            >

                <label
                    htmlFor="fiscal-period"
                    style={{
                        display: "block",
                        marginBottom: "10px",
                        fontWeight: "bold",
                    }}
                >
                    دوره مالی
                </label>


                <select
                    id="fiscal-period"
                    value={
                        selectedFiscalPeriodId
                    }

                    onChange={(event) => {

                        setSelectedFiscalPeriodId(event.target.value);

                        setTrialBalance(null);
                        setSelectedAccountId("");
                        setGeneralLedger(null);
                        setBalanceSheet(null);

                        setIncomeStatement(null);
                        setCashFlowStatement(null);

                        setIncomeStatementError("");
                        setCashFlowError("");

                        setError("");

                    }}
                    style={{
                        minWidth: "350px",
                        padding: "10px",
                        borderRadius: "8px",
                        border:
                            "1px solid #ccc",
                    }}
                >

                    <option value="">
                        انتخاب دوره مالی
                    </option>


                    {fiscalPeriods.map(
                        period => (

                            <option
                                key={period.id}
                                value={period.id}
                            >

                                {period.code}

                                {" — "}

                                {period.name}

                            </option>

                        )
                    )}

                </select>

            </div>


            {/* ========================================
                Global Loading
            ========================================= */}

            {loading && (

                <div
                    style={{
                        marginBottom: "20px",
                        fontWeight: "bold",
                    }}
                >
                    در حال به‌روزرسانی گزارش‌ها...
                </div>

            )}


            {/* ========================================
                Trial Balance
            ========================================= */}

            {trialBalance && (

                <>

                    <h2>
                        تراز آزمایشی
                    </h2>


                    <p>
                        {trialBalance.fiscalPeriod?.name}
                    </p>


                    {/* --------------------------------
                        Summary
                    --------------------------------- */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(3, 1fr)",
                            gap: "15px",
                            marginBottom: "30px",
                        }}
                    >

                        <div
                            style={{
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "12px",
                                padding:
                                    "20px",
                            }}
                        >

                            <div>
                                کل بدهکار
                            </div>

                            <strong>
                                {formatNumber(
                                    trialBalance.totalDebit
                                )}
                            </strong>

                            {" ریال"}

                        </div>


                        <div
                            style={{
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "12px",
                                padding:
                                    "20px",
                            }}
                        >

                            <div>
                                کل بستانکار
                            </div>

                            <strong>
                                {formatNumber(
                                    trialBalance.totalCredit
                                )}
                            </strong>

                            {" ریال"}

                        </div>


                        <div
                            style={{
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "12px",
                                padding:
                                    "20px",
                            }}
                        >

                            <div>
                                وضعیت تراز
                            </div>

                            <strong>
                                {trialBalance.isBalanced
                                    ? "✓ متوازن"
                                    : "✗ نامتوازن"}
                            </strong>

                            <div>
                                اختلاف:
                                {" "}
                                {formatNumber(
                                    trialBalance.difference
                                )}
                                {" ریال"}
                            </div>

                        </div>

                    </div>


                    {/* --------------------------------
                        Trial Balance Table
                    --------------------------------- */}

                    <div
                        style={{
                            overflowX: "auto",
                            marginBottom: "45px",
                        }}
                    >

                        <table
                            style={{
                                width: "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr>

                                    <th style={thStyle}>
                                        کد حساب
                                    </th>

                                    <th style={thStyle}>
                                        نام حساب
                                    </th>

                                    <th style={thStyle}>
                                        نوع
                                    </th>

                                    <th style={thStyle}>
                                        بدهکار
                                    </th>

                                    <th style={thStyle}>
                                        بستانکار
                                    </th>

                                    <th style={thStyle}>
                                        مانده
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {accounts.map(
                                    account => (

                                        <tr
                                            key={
                                                account.accountId
                                            }
                                        >

                                            <td style={tdStyle}>
                                                {account.code}
                                            </td>

                                            <td style={tdStyle}>
                                                {account.name}
                                            </td>

                                            <td style={tdStyle}>
                                                {account.type}
                                            </td>

                                            <td style={tdStyle}>
                                                {formatNumber(
                                                    account.debit
                                                )}
                                            </td>

                                            <td style={tdStyle}>
                                                {formatNumber(
                                                    account.credit
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...tdStyle,
                                                    fontWeight:
                                                        "bold",
                                                }}
                                            >
                                                {formatNumber(
                                                    account.balance
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* ==================================
                        General Ledger
                    =================================== */}

                    <h2>
                        دفتر کل
                    </h2>


                    <div
                        style={{
                            marginBottom: "20px",
                        }}
                    >

                        <label
                            htmlFor="account"
                            style={{
                                display: "block",
                                marginBottom:
                                    "10px",
                                fontWeight:
                                    "bold",
                            }}
                        >
                            انتخاب حساب
                        </label>


                        <select
                            id="account"
                            value={
                                selectedAccountId
                            }
                            onChange={(event) => {

                                setSelectedAccountId(event.target.value);

                                setGeneralLedger(null);

                            }}
                            style={{
                                minWidth: "400px",
                                padding: "10px",
                                borderRadius:
                                    "8px",
                                border:
                                    "1px solid #ccc",
                            }}
                        >

                            <option value="">
                                انتخاب حساب
                            </option>


                            {accounts.map(
                                account => (

                                    <option
                                        key={
                                            account.accountId
                                        }
                                        value={
                                            account.accountId
                                        }
                                    >

                                        {account.code}

                                        {" — "}

                                        {account.name}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* --------------------------------
                        General Ledger
                    --------------------------------- */}

                    {generalLedger && (

                        <>

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(3, 1fr)",
                                    gap: "15px",
                                    marginBottom:
                                        "25px",
                                }}
                            >

                                <div
                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        borderRadius:
                                            "12px",
                                        padding:
                                            "20px",
                                    }}
                                >

                                    <div>
                                        مجموع بدهکار
                                    </div>

                                    <strong>
                                        {formatNumber(
                                            generalLedger.totalDebit
                                        )}
                                    </strong>

                                    {" ریال"}

                                </div>


                                <div
                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        borderRadius:
                                            "12px",
                                        padding:
                                            "20px",
                                    }}
                                >

                                    <div>
                                        مجموع بستانکار
                                    </div>

                                    <strong>
                                        {formatNumber(
                                            generalLedger.totalCredit
                                        )}
                                    </strong>

                                    {" ریال"}

                                </div>


                                <div
                                    style={{
                                        border:
                                            "1px solid #ddd",
                                        borderRadius:
                                            "12px",
                                        padding:
                                            "20px",
                                    }}
                                >

                                    <div>
                                        مانده پایان دوره
                                    </div>

                                    <strong>
                                        {formatNumber(
                                            generalLedger.closingBalance
                                        )}
                                    </strong>

                                    {" ریال"}

                                </div>

                            </div>


                            <p>

                                حساب:

                                {" "}

                                <strong>

                                    {
                                        generalLedger.account?.code
                                    }

                                    {" — "}

                                    {
                                        generalLedger.account?.name
                                    }

                                </strong>

                            </p>


                            <div
                                style={{
                                    overflowX:
                                        "auto",
                                    marginBottom:
                                        "50px",
                                }}
                            >

                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse:
                                            "collapse",
                                    }}
                                >

                                    <thead>

                                        <tr>

                                            <th style={thStyle}>
                                                شماره سند
                                            </th>

                                            <th style={thStyle}>
                                                تاریخ
                                            </th>

                                            <th style={thStyle}>
                                                شرح
                                            </th>

                                            <th style={thStyle}>
                                                بدهکار
                                            </th>

                                            <th style={thStyle}>
                                                بستانکار
                                            </th>

                                            <th style={thStyle}>
                                                مانده
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {(
                                            generalLedger.lines ||
                                            []
                                        ).map(
                                            line => (

                                                <tr
                                                    key={
                                                        line.id
                                                    }
                                                >

                                                    <td style={tdStyle}>
                                                        {
                                                            line.entryNumber
                                                        }
                                                    </td>

                                                    <td style={tdStyle}>
                                                        {
                                                            line.entryDate
                                                                ? new Date(
                                                                    line.entryDate
                                                                ).toLocaleDateString(
                                                                    "fa-IR"
                                                                )
                                                                : "-"
                                                        }
                                                    </td>

                                                    <td style={tdStyle}>
                                                        {
                                                            line.description
                                                        }
                                                    </td>

                                                    <td style={tdStyle}>
                                                        {formatNumber(
                                                            line.debit
                                                        )}
                                                    </td>

                                                    <td style={tdStyle}>
                                                        {formatNumber(
                                                            line.credit
                                                        )}
                                                    </td>

                                                    <td
                                                        style={{
                                                            ...tdStyle,
                                                            fontWeight:
                                                                "bold",
                                                        }}
                                                    >
                                                        {formatNumber(
                                                            line.balance
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </>

                    )}


                    {/* ==================================
                        Balance Sheet
                    =================================== */}

                    {balanceSheet && (

                        <div
                            style={{
                                marginTop: "50px",
                            }}
                        >

                            <h2>
                                ترازنامه
                            </h2>


                            <p>
                                {
                                    balanceSheet
                                        .fiscalPeriod
                                        ?.name
                                }
                            </p>


                            {/* --------------------------------
                                Main Summary
                            --------------------------------- */}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(3, 1fr)",
                                    gap: "15px",
                                    marginBottom:
                                        "30px",
                                }}
                            >

                                <SummaryCard
                                    title="جمع دارایی‌ها"
                                    value={
                                        balanceSheet
                                            .assets
                                            ?.total
                                    }
                                />


                                <SummaryCard
                                    title="جمع بدهی‌ها"
                                    value={
                                        balanceSheet
                                            .liabilities
                                            ?.total
                                    }
                                />


                                <SummaryCard
                                    title="حقوق مالکانه"
                                    value={
                                        balanceSheet
                                            .equity
                                            ?.total
                                    }
                                />

                            </div>


                            {/* --------------------------------
                                Assets
                            --------------------------------- */}

                            <ReportSection
                                title="دارایی‌ها"
                                accounts={
                                    balanceSheet
                                        .assets
                                        ?.accounts
                                }
                            />


                            {/* --------------------------------
                                Liabilities
                            --------------------------------- */}

                            <ReportSection
                                title="بدهی‌ها"
                                accounts={
                                    balanceSheet
                                        .liabilities
                                        ?.accounts
                                }
                            />


                            {/* --------------------------------
                                Equity
                            --------------------------------- */}

                            <ReportSection
                                title="حقوق مالکانه"
                                accounts={
                                    balanceSheet
                                        .equity
                                        ?.accounts
                                }
                            />


                            {/* --------------------------------
                                Current Period
                            --------------------------------- */}

                            <h3>
                                عملکرد دوره جاری
                            </h3>


                            <div
                                style={{
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "12px",
                                    padding:
                                        "20px",
                                    marginBottom:
                                        "30px",
                                }}
                            >

                                <p>

                                    درآمد دوره:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .currentPeriod
                                                ?.revenue
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>


                                <p>

                                    هزینه دوره:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .currentPeriod
                                                ?.expenses
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>


                                <p>

                                    سود خالص دوره:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .currentPeriod
                                                ?.netIncome
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>

                            </div>


                            {/* --------------------------------
                                Balance Check
                            --------------------------------- */}

                            <div
                                style={{
                                    border:
                                        "1px solid #ddd",
                                    borderRadius:
                                        "12px",
                                    padding:
                                        "20px",
                                    marginBottom:
                                        "40px",
                                }}
                            >

                                <h3>
                                    کنترل تراز
                                </h3>


                                <p>

                                    جمع دارایی‌ها:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .totalAssets
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>


                                <p>

                                    جمع بدهی و حقوق مالکانه:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .totalLiabilitiesAndEquity
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>


                                <p>

                                    اختلاف:

                                    {" "}

                                    <strong>
                                        {formatNumber(
                                            balanceSheet
                                                .difference
                                        )}
                                    </strong>

                                    {" ریال"}

                                </p>


                                <p>

                                    وضعیت تراز:

                                    {" "}

                                    <strong>

                                        {
                                            balanceSheet
                                                .isBalanced
                                                ? "✓ متوازن"
                                                : "✗ نامتوازن"
                                        }

                                    </strong>

                                </p>

                            </div>

                        </div>

                    )}

                </>

            )}

            {/* ========================================
                Income Statement
            ========================================= */}

            {incomeStatementLoading && (
                <p>در حال دریافت صورت سود و زیان...</p>
            )}

            {incomeStatementError && (
                <p style={{ color: "red" }}>
                    خطای صورت سود و زیان: {incomeStatementError}
                </p>
            )}

            {incomeStatement && (
                <IncomeStatement
                    data={incomeStatement}
                />
            )}


            {/* ========================================
                Cash Flow Statement
            ========================================= */}

            {cashFlowLoading && (
                <p>در حال دریافت صورت جریان وجوه نقد...</p>
            )}

            {cashFlowError && (
                <p style={{ color: "red" }}>
                    خطای جریان وجوه نقد: {cashFlowError}
                </p>
            )}

            {cashFlowStatement && (
                <CashFlowStatement
                    data={cashFlowStatement}
                />
            )}

            {/* ========================================
                Journal Entries
            ========================================= */}

            {token && selectedFiscalPeriodId && (
                <JournalEntries
                    token={token}
                    fiscalPeriodId={selectedFiscalPeriodId}
                    onUnauthorized={handleLogout}
                />
            )}

        </div>

    );

}


// ======================================================
// Reusable Styles
// ======================================================

const thStyle = {

    padding: "12px",

    border:
        "1px solid #ddd",

    textAlign:
        "right",

};


const tdStyle = {

    padding: "10px",

    border:
        "1px solid #ddd",

};


// ======================================================
// Summary Card
// ======================================================

function SummaryCard({
    title,
    value,
}) {

    return (

        <div
            style={{
                border:
                    "1px solid #ddd",
                borderRadius:
                    "12px",
                padding:
                    "20px",
            }}
        >

            <div>
                {title}
            </div>

            <strong>
                {Number(
                    value || 0
                ).toLocaleString(
                    "fa-IR"
                )}
            </strong>

            {" ریال"}

        </div>

    );

}


// ======================================================
// Report Section
// ======================================================

function ReportSection({
    title,
    accounts = [],
}) {

    return (

        <>

            <h3>
                {title}
            </h3>


            <div
                style={{
                    overflowX:
                        "auto",
                    marginBottom:
                        "30px",
                }}
            >

                <table
                    style={{
                        width: "100%",
                        borderCollapse:
                            "collapse",
                    }}
                >

                    <thead>

                        <tr>

                            <th style={thStyle}>
                                کد حساب
                            </th>

                            <th style={thStyle}>
                                نام حساب
                            </th>

                            <th style={thStyle}>
                                مانده
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {accounts.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="3"
                                    style={{
                                        ...tdStyle,
                                        textAlign:
                                            "center",
                                    }}
                                >
                                    حسابی ثبت نشده است.
                                </td>

                            </tr>

                        ) : (

                            accounts.map(
                                account => (

                                    <tr
                                        key={
                                            account.accountId
                                        }
                                    >

                                        <td style={tdStyle}>
                                            {
                                                account.code
                                            }
                                        </td>

                                        <td style={tdStyle}>
                                            {
                                                account.name
                                            }
                                        </td>

                                        <td
                                            style={{
                                                ...tdStyle,
                                                fontWeight:
                                                    "bold",
                                            }}
                                        >
                                            {Number(
                                                Math.abs(
                                                    account.balance ||
                                                    0
                                                )
                                            ).toLocaleString(
                                                "fa-IR"
                                            )}
                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

        </>

    );

}


export default App;
