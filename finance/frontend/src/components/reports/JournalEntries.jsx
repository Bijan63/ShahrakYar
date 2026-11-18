
import { useEffect, useMemo, useState } from "react";

import {
    getJournalEntriesByFiscalPeriod
} from "../../api/api";


// ======================================================
// Formatters
// ======================================================

const formatMoney = (value) =>
    Number(value || 0).toLocaleString("fa-IR");

const formatDate = (value) => {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("fa-IR", {
        timeZone: "Asia/Tehran"
    });
};


// ======================================================
// Status
// ======================================================

const statusLabels = {
    DRAFT: "پیش‌نویس",
    POSTED: "ثبت نهایی",
    CANCELLED: "لغوشده"
};

const statusColors = {
    DRAFT: "#b7791f",
    POSTED: "#238636",
    CANCELLED: "#b42318"
};


// ======================================================
// Journal Entry Totals
// ======================================================

function getEntryTotals(entry) {

    const lines = entry.lines || [];

    return lines.reduce(
        (totals, line) => {

            totals.debit += Number(line.debit || 0);

            totals.credit += Number(line.credit || 0);

            return totals;

        },
        {
            debit: 0,
            credit: 0
        }
    );

}


// ======================================================
// Journal Entry Lines
// ======================================================

function JournalEntryLines({ lines = [] }) {

    return (

        <div style={detailContainerStyle}>

            <h4>ردیف‌های سند</h4>

            {lines.length === 0 ? (

                <p style={mutedStyle}>
                    ردیفی برای این سند وجود ندارد.
                </p>

            ) : (

                <div style={{ overflowX: "auto" }}>

                    <table style={tableStyle}>

                        <thead>

                            <tr>
                                <th style={thStyle}>کد حساب</th>
                                <th style={thStyle}>نام حساب</th>
                                <th style={thStyle}>شرح</th>
                                <th style={thStyle}>بدهکار</th>
                                <th style={thStyle}>بستانکار</th>
                            </tr>

                        </thead>

                        <tbody>

                            {lines.map((line) => (

                                <tr key={line.id}>

                                    <td style={tdStyle}>
                                        {line.account?.code || "-"}
                                    </td>

                                    <td style={tdStyle}>
                                        {line.account?.name || "-"}
                                    </td>

                                    <td style={tdStyle}>
                                        {line.description || "-"}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatMoney(line.debit)}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatMoney(line.credit)}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}


// ======================================================
// Journal Entries
// ======================================================

function JournalEntries({
    token,
    fiscalPeriodId,
    onUnauthorized
}) {

    const [entries, setEntries] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [searchText, setSearchText] = useState("");

    const [selectedStatus, setSelectedStatus] =
        useState("ALL");

    const [reloadKey, setReloadKey] = useState(0);


    // ==================================================
    // Load Journal Entries
    // ==================================================

    useEffect(() => {

        let active = true;

        // ----------------------------------------------
        // Missing Token or Fiscal Period
        // ----------------------------------------------

        if (!token || !fiscalPeriodId) {

            void Promise.resolve().then(() => {

                if (!active) return;

                setEntries([]);
                setError("");
                setLoading(false);

            });

            return () => {
                active = false;
            };

        }


        // ----------------------------------------------
        // Load Entries
        // ----------------------------------------------

        const loadEntries = async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await getJournalEntriesByFiscalPeriod(
                        token,
                        fiscalPeriodId
                    );

                if (!active) return;

                setEntries(
                    Array.isArray(response?.data)
                        ? response.data
                        : []
                );

            }
            catch (err) {

                if (!active) return;

                console.error(
                    "Journal Entries Error:",
                    err
                );

                if (err.status === 401) {

                    onUnauthorized?.();

                    return;
                }

                setEntries([]);

                setError(
                    err.message ||
                    "دریافت اسناد حسابداری با خطا مواجه شد."
                );

            }
            finally {

                if (active) {
                    setLoading(false);
                }

            }

        };


        void loadEntries();


        // ----------------------------------------------
        // Cleanup
        // ----------------------------------------------

        return () => {
            active = false;
        };

    }, [
        token,
        fiscalPeriodId,
        reloadKey,
        onUnauthorized
    ]);


    // ==================================================
    // Search and Status Filter
    // ==================================================

    const filteredEntries = useMemo(() => {

        const search = searchText
            .trim()
            .toLowerCase();

        return entries.filter((entry) => {

            const matchesSearch =
                !search ||
                String(entry.entryNumber || "")
                    .toLowerCase()
                    .includes(search) ||
                String(entry.description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                selectedStatus === "ALL" ||
                entry.status === selectedStatus;

            return matchesSearch && matchesStatus;

        });

    }, [
        entries,
        searchText,
        selectedStatus
    ]);


    // ==================================================
    // Overall Summary
    // ==================================================

    const summary = useMemo(() => {

        return filteredEntries.reduce(
            (result, entry) => {

                const totals = getEntryTotals(entry);

                result.debit += totals.debit;
                result.credit += totals.credit;

                return result;

            },
            {
                debit: 0,
                credit: 0
            }
        );

    }, [filteredEntries]);


    // ==================================================
    // Render
    // ==================================================

    return (

        <section
            dir="rtl"
            style={sectionStyle}
        >

            <div style={headerStyle}>

                <div>
                    <h2>اسناد حسابداری</h2>

                    <p style={mutedStyle}>
                        اسناد دوره مالی انتخاب‌شده
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setReloadKey(value => value + 1)}
                    disabled={loading || !fiscalPeriodId}
                    style={buttonStyle}
                >
                    {loading ? "در حال دریافت..." : "به‌روزرسانی"}
                </button>

            </div>


            {!fiscalPeriodId ? (

                <p style={mutedStyle}>
                    ابتدا یک دوره مالی انتخاب کنید.
                </p>

            ) : (

                <>

                    {/* ----------------------------------
                        Search and Filter
                    ---------------------------------- */}

                    <div style={filterStyle}>

                        <input
                            type="search"
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(event.target.value)
                            }
                            placeholder="جست‌وجو با شماره سند یا شرح..."
                            style={inputStyle}
                        />


                        <select
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value)
                            }
                            style={selectStyle}
                        >

                            <option value="ALL">
                                همه وضعیت‌ها
                            </option>

                            <option value="DRAFT">
                                پیش‌نویس
                            </option>

                            <option value="POSTED">
                                ثبت نهایی
                            </option>

                            <option value="CANCELLED">
                                لغوشده
                            </option>

                        </select>

                    </div>


                    {/* ----------------------------------
                        Loading / Error
                    ---------------------------------- */}

                    {loading && (

                        <p style={mutedStyle}>
                            در حال دریافت اسناد حسابداری...
                        </p>

                    )}

                    {error && (

                        <p style={errorStyle}>
                            {error}
                        </p>

                    )}


                    {/* ----------------------------------
                        Summary
                    ---------------------------------- */}

                    {!loading && !error && (

                        <div style={summaryGridStyle}>

                            <SummaryCard
                                title="تعداد اسناد"
                                value={filteredEntries.length}
                                isMoney={false}
                            />

                            <SummaryCard
                                title="مجموع بدهکار"
                                value={summary.debit}
                            />

                            <SummaryCard
                                title="مجموع بستانکار"
                                value={summary.credit}
                            />

                        </div>

                    )}


                    {/* ----------------------------------
                        Empty State
                    ---------------------------------- */}

                    {!loading &&
                        !error &&
                        filteredEntries.length === 0 && (

                            <p style={emptyStyle}>
                                {entries.length === 0
                                    ? "هنوز سند حسابداری برای این دوره ثبت نشده است."
                                    : "سندی با معیار جست‌وجوی انتخاب‌شده پیدا نشد."}
                            </p>

                        )}


                    {/* ----------------------------------
                        Journal Entries Table
                    ---------------------------------- */}

                    {filteredEntries.length > 0 && (

                        <div style={{ overflowX: "auto" }}>

                            <table style={tableStyle}>

                                <thead>

                                    <tr>
                                        <th style={thStyle}>شماره سند</th>
                                        <th style={thStyle}>تاریخ</th>
                                        <th style={thStyle}>شرح</th>
                                        <th style={thStyle}>صندوق</th>
                                        <th style={thStyle}>بدهکار</th>
                                        <th style={thStyle}>بستانکار</th>
                                        <th style={thStyle}>وضعیت</th>
                                        <th style={thStyle}>جزئیات</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredEntries.map((entry) => {

                                        const totals =
                                            getEntryTotals(entry);

                                        return (

                                            <tr key={entry.id}>

                                                <td style={tdStyle}>
                                                    <strong>
                                                        {entry.entryNumber}
                                                    </strong>
                                                </td>

                                                <td style={tdStyle}>
                                                    {formatDate(entry.entryDate)}
                                                </td>

                                                <td style={tdStyle}>
                                                    {entry.description || "-"}
                                                </td>

                                                <td style={tdStyle}>
                                                    {entry.fund?.name || "-"}
                                                </td>

                                                <td style={tdStyle}>
                                                    {formatMoney(totals.debit)}
                                                </td>

                                                <td style={tdStyle}>
                                                    {formatMoney(totals.credit)}
                                                </td>

                                                <td style={tdStyle}>

                                                    <strong
                                                        style={{
                                                            color:
                                                                statusColors[entry.status]
                                                                || "#555"
                                                        }}
                                                    >
                                                        {statusLabels[entry.status]
                                                            || entry.status}
                                                    </strong>

                                                </td>

                                                <td style={tdStyle}>

                                                    <details>

                                                        <summary
                                                            style={{
                                                                cursor: "pointer",
                                                                color: "#1769aa"
                                                            }}
                                                        >
                                                            مشاهده
                                                        </summary>

                                                        <JournalEntryLines
                                                            lines={entry.lines || []}
                                                        />

                                                    </details>

                                                </td>

                                            </tr>

                                        );

                                    })}

                                </tbody>

                            </table>

                        </div>

                    )}

                </>

            )}

        </section>

    );

}


// ======================================================
// Summary Card
// ======================================================

function SummaryCard({
    title,
    value,
    isMoney = true
}) {

    return (

        <div style={cardStyle}>

            <div style={{ marginBottom: "10px" }}>
                {title}
            </div>

            <strong style={{ fontSize: "20px" }}>
                {isMoney
                    ? formatMoney(value)
                    : Number(value || 0).toLocaleString("fa-IR")}
            </strong>

            {isMoney && <span> ریال</span>}

        </div>

    );

}


// ======================================================
// Styles
// ======================================================

const sectionStyle = {
    marginTop: "55px",
    marginBottom: "50px",
    fontFamily: "Tahoma"
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap"
};

const filterStyle = {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    margin: "20px 0"
};

const inputStyle = {
    flex: "1",
    minWidth: "240px",
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "8px"
};

const selectStyle = {
    minWidth: "170px",
    padding: "11px",
    border: "1px solid #ccc",
    borderRadius: "8px"
};

const buttonStyle = {
    padding: "10px 18px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "pointer"
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    margin: "20px 0"
};

const cardStyle = {
    padding: "18px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    background: "#fff"
};

const tableStyle = {
    width: "100%",
    minWidth: "1000px",
    borderCollapse: "collapse"
};

const thStyle = {
    padding: "12px",
    border: "1px solid #ddd",
    textAlign: "right",
    background: "#f3f4f6",
    whiteSpace: "nowrap"
};

const tdStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "right"
};

const detailContainerStyle = {
    minWidth: "650px",
    marginTop: "12px",
    padding: "12px",
    background: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "8px"
};

const mutedStyle = {
    color: "#777"
};

const emptyStyle = {
    padding: "25px",
    textAlign: "center",
    color: "#777",
    border: "1px dashed #ccc",
    borderRadius: "8px"
};

const errorStyle = {
    color: "#b42318",
    padding: "12px",
    border: "1px solid #f2caca",
    borderRadius: "8px"
};


// ======================================================
// Export
// ======================================================

export default JournalEntries;
