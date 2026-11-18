

// ======================================================
// Formatters
// ======================================================

const formatMoney = (value) =>
    Number(value || 0).toLocaleString("fa-IR");

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("fa-IR");
};

const balanceSideLabel = (side) => ({
    DEBIT: "بدهکار",
    CREDIT: "بستانکار",
    ZERO: "صفر"
}[side] || "-");

const allocationLabel = (value) => ({
    PROPORTIONAL: "تخصیص متناسب",
    FALLBACK: "بدون تخصیص مشخص"
}[value] || value || "-");


// ======================================================
// Summary Card
// ======================================================

function SummaryCard({ title, value }) {

    return (
        <div style={cardStyle}>
            <div style={{ marginBottom: "12px" }}>
                {title}
            </div>

            <strong style={{ fontSize: "20px" }}>
                {formatMoney(value)}
            </strong>

            <span> ریال</span>
        </div>
    );
}


// ======================================================
// Movement Table
// ======================================================

function MovementTable({ items = [] }) {

    if (!items.length) {

        return (
            <p style={emptyStyle}>
                گردش مالی برای نمایش وجود ندارد.
            </p>
        );
    }

    return (
        <div style={{ overflowX: "auto" }}>

            <table style={tableStyle}>

                <thead>
                    <tr>
                        <th style={thStyle}>تاریخ</th>
                        <th style={thStyle}>شماره سند</th>
                        <th style={thStyle}>شرح</th>
                        <th style={thStyle}>حساب نقد و بانک</th>
                        <th style={thStyle}>حساب طرف مقابل</th>
                        <th style={thStyle}>مبلغ (ریال)</th>
                        <th style={thStyle}>روش تخصیص</th>
                    </tr>
                </thead>

                <tbody>

                    {items.map((item, index) => {

                        const counterpart =
                            item.counterpartAccountCode
                                ? `${item.counterpartAccountCode} — ${item.counterpartAccountName || ""}`
                                : "نامشخص";

                        const key = [
                            item.journalEntryId,
                            item.cashAccountId,
                            item.counterpartAccountId || "none",
                            item.direction,
                            index
                        ].join("-");

                        return (
                            <tr key={key}>

                                <td style={tdStyle}>
                                    {formatDate(item.entryDate)}
                                </td>

                                <td style={tdStyle}>
                                    {item.entryNumber || "-"}
                                </td>

                                <td style={tdStyle}>
                                    {item.description || "-"}
                                </td>

                                <td style={tdStyle}>
                                    {item.cashAccountCode}
                                    {" — "}
                                    {item.cashAccountName}
                                </td>

                                <td style={tdStyle}>
                                    {counterpart}
                                </td>

                                <td style={tdStyle}>
                                    <strong>
                                        {formatMoney(item.amount)}
                                    </strong>
                                </td>

                                <td style={tdStyle}>
                                    {allocationLabel(item.allocation)}
                                </td>

                            </tr>
                        );
                    })}

                </tbody>

            </table>

        </div>
    );
}


// ======================================================
// Activity Section
// ======================================================

function ActivitySection({ title, activity }) {

    if (!activity) return null;

    return (
        <section style={sectionStyle}>

            <h3>{title}</h3>

            {/* Inflows */}

            <h4>دریافت‌ها</h4>

            <SummaryCard
                title="مجموع دریافت‌ها"
                value={activity.inflows?.total}
            />

            <div style={{ marginTop: "15px" }}>
                <MovementTable
                    items={activity.inflows?.items || []}
                />
            </div>


            {/* Outflows */}

            <h4 style={{ marginTop: "30px" }}>
                پرداخت‌ها
            </h4>

            <SummaryCard
                title="مجموع پرداخت‌ها"
                value={activity.outflows?.total}
            />

            <div style={{ marginTop: "15px" }}>
                <MovementTable
                    items={activity.outflows?.items || []}
                />
            </div>


            {/* Net Cash Flow */}

            <div style={netFlowStyle}>

                خالص جریان نقدی این فعالیت:

                {" "}

                <strong>
                    {formatMoney(activity.netCashFlow)}
                    {" ریال"}
                </strong>

            </div>

        </section>
    );
}


// ======================================================
// Opening Cash Accounts
// ======================================================

function OpeningAccountsTable({ accounts = [] }) {

    return (
        <AccountBalanceTable
            accounts={accounts}
            mode="OPENING"
        />
    );
}


// ======================================================
// Closing Cash Accounts
// ======================================================

function ClosingAccountsTable({ accounts = [] }) {

    return (
        <AccountBalanceTable
            accounts={accounts}
            mode="CLOSING"
        />
    );
}


// ======================================================
// Account Balance Table
// ======================================================

function AccountBalanceTable({ accounts = [], mode }) {

    if (!accounts.length) {

        return (
            <p style={emptyStyle}>
                حسابی برای نمایش وجود ندارد.
            </p>
        );
    }

    return (
        <div style={{ overflowX: "auto" }}>

            <table style={tableStyle}>

                <thead>
                    <tr>
                        <th style={thStyle}>کد حساب</th>
                        <th style={thStyle}>نام حساب</th>

                        {mode === "OPENING" ? (
                            <>
                                <th style={thStyle}>بدهکار</th>
                                <th style={thStyle}>بستانکار</th>
                            </>
                        ) : (
                            <>
                                <th style={thStyle}>بدهکار افتتاحیه</th>
                                <th style={thStyle}>بستانکار افتتاحیه</th>
                                <th style={thStyle}>بدهکار دوره</th>
                                <th style={thStyle}>بستانکار دوره</th>
                            </>
                        )}

                        <th style={thStyle}>مانده (ریال)</th>
                        <th style={thStyle}>ماهیت مانده</th>
                    </tr>
                </thead>

                <tbody>

                    {accounts.map((account) => {

                        const balance =
                            mode === "OPENING"
                                ? account.balance
                                : account.closingBalance;

                        return (
                            <tr key={account.accountId}>

                                <td style={tdStyle}>
                                    {account.code}
                                </td>

                                <td style={tdStyle}>
                                    {account.name}
                                </td>

                                <td style={tdStyle}>
                                    {formatMoney(
                                        mode === "OPENING"
                                            ? account.debit
                                            : account.openingDebit
                                    )}
                                </td>

                                <td style={tdStyle}>
                                    {formatMoney(
                                        mode === "OPENING"
                                            ? account.credit
                                            : account.openingCredit
                                    )}
                                </td>

                                {mode === "CLOSING" && (
                                    <>
                                        <td style={tdStyle}>
                                            {formatMoney(account.periodDebit)}
                                        </td>

                                        <td style={tdStyle}>
                                            {formatMoney(account.periodCredit)}
                                        </td>
                                    </>
                                )}

                                <td style={tdStyle}>
                                    <strong>
                                        {formatMoney(Math.abs(Number(balance || 0)))}
                                    </strong>
                                </td>

                                <td style={tdStyle}>
                                    {balanceSideLabel(account.balanceSide)}
                                </td>

                            </tr>
                        );
                    })}

                </tbody>

            </table>

        </div>
    );
}


// ======================================================
// Internal Transfers
// ======================================================

function InternalTransfers({ data }) {

    const items = data?.items || [];

    return (
        <section style={sectionStyle}>

            <h3>انتقالات داخلی بین حساب‌های نقد و بانک</h3>

            <SummaryCard
                title="مجموع ثبت‌شده انتقالات داخلی"
                value={data?.total}
            />

            {!items.length ? (

                <p style={emptyStyle}>
                    انتقال داخلی ثبت نشده است.
                </p>

            ) : (

                <div style={{ overflowX: "auto", marginTop: "20px" }}>

                    <table style={tableStyle}>

                        <thead>
                            <tr>
                                <th style={thStyle}>تاریخ</th>
                                <th style={thStyle}>شماره سند</th>
                                <th style={thStyle}>شرح</th>
                                <th style={thStyle}>حساب</th>
                                <th style={thStyle}>نوع انتقال</th>
                                <th style={thStyle}>بدهکار</th>
                                <th style={thStyle}>بستانکار</th>
                            </tr>
                        </thead>

                        <tbody>

                            {items.map((item, index) => (

                                <tr
                                    key={`${item.journalEntryId}-${item.cashAccountId}-${item.transferType}-${index}`}
                                >

                                    <td style={tdStyle}>
                                        {formatDate(item.entryDate)}
                                    </td>

                                    <td style={tdStyle}>
                                        {item.entryNumber || "-"}
                                    </td>

                                    <td style={tdStyle}>
                                        {item.description || "-"}
                                    </td>

                                    <td style={tdStyle}>
                                        {item.cashAccountCode}
                                        {" — "}
                                        {item.cashAccountName}
                                    </td>

                                    <td style={tdStyle}>
                                        {item.transferType === "IN"
                                            ? "ورودی"
                                            : item.transferType === "OUT"
                                                ? "خروجی"
                                                : item.transferType}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatMoney(item.debit)}
                                    </td>

                                    <td style={tdStyle}>
                                        {formatMoney(item.credit)}
                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </section>
    );
}


// ======================================================
// Reconciliation
// ======================================================

function Reconciliation({ data }) {

    if (!data) return null;

    return (
        <section style={sectionStyle}>

            <h3>کنترل و تطبیق جریان وجوه نقد</h3>

            <div style={summaryGridStyle}>

                <SummaryCard
                    title="مانده دفتر نقد و بانک"
                    value={data.ledgerClosingCash}
                />

                <SummaryCard
                    title="اختلاف قبل از گردش‌های طبقه‌بندی‌نشده"
                    value={data.difference}
                />

                <SummaryCard
                    title="اختلاف پس از گردش‌های طبقه‌بندی‌نشده"
                    value={data.differenceAfterUnmapped}
                />

                <SummaryCard
                    title="تغییر خالص گردش‌های طبقه‌بندی‌نشده"
                    value={data.unmappedCashNetChange}
                />

            </div>

            <p>
                تعداد گردش‌های طبقه‌بندی‌نشده:{" "}
                <strong>
                    {Number(data.unmappedCashMovementCount || 0).toLocaleString("fa-IR")}
                </strong>
            </p>

            <p>
                کامل بودن طبقه‌بندی:{" "}
                <strong>
                    {data.isClassificationComplete
                        ? "بله"
                        : "خیر"}
                </strong>
            </p>

            <p>
                وضعیت تطبیق با دفتر کل:{" "}
                <strong>
                    {data.isReconciled
                        ? "✓ تطبیق‌شده"
                        : "✗ تطبیق نشده"}
                </strong>
            </p>

        </section>
    );
}


// ======================================================
// Cash Flow Statement
// ======================================================

function CashFlowStatement({ data }) {

    if (!data) return null;

    return (
        <section
            dir="rtl"
            style={{
                marginTop: "55px",
                marginBottom: "60px",
                fontFamily: "Tahoma",
            }}
        >

            <h2>صورت جریان وجوه نقد</h2>

            <p>
                دوره مالی:{" "}
                <strong>
                    {data.fiscalPeriod?.name || "-"}
                </strong>
            </p>

            <p style={{ color: "#666", fontSize: "13px" }}>
                این گزارش بر اساس اسناد حسابداری ثبت‌شده (POSTED) تهیه شده است.
            </p>


            {/* Main Summary */}

            <div style={summaryGridStyle}>

                <SummaryCard
                    title="موجودی ابتدای دوره"
                    value={data.openingCash}
                />

                <SummaryCard
                    title="تغییر خالص وجه نقد"
                    value={data.netChangeInCash}
                />

                <SummaryCard
                    title="موجودی پایان دوره"
                    value={data.closingCash}
                />

                <SummaryCard
                    title="تغییر خالص با گردش‌های طبقه‌بندی‌نشده"
                    value={data.netChangeInCashIncludingUnmapped}
                />

                <SummaryCard
                    title="موجودی پایان دوره با گردش‌های طبقه‌بندی‌نشده"
                    value={data.closingCashIncludingUnmapped}
                />

            </div>


            {/* Operating Activities */}

            <ActivitySection
                title="فعالیت‌های عملیاتی"
                activity={data.operatingActivities}
            />


            {/* Investing Activities */}

            <ActivitySection
                title="فعالیت‌های سرمایه‌گذاری"
                activity={data.investingActivities}
            />


            {/* Financing Activities */}

            <ActivitySection
                title="فعالیت‌های تأمین مالی"
                activity={data.financingActivities}
            />


            {/* Unmapped Movements */}

            <section style={sectionStyle}>

                <h3>گردش‌های نقدی طبقه‌بندی‌نشده</h3>

                <SummaryCard
                    title="مجموع گردش‌های طبقه‌بندی‌نشده"
                    value={data.unmappedCashMovements?.total}
                />

                <h4>دریافت‌های طبقه‌بندی‌نشده</h4>

                <SummaryCard
                    title="مجموع دریافت‌ها"
                    value={data.unmappedCashMovements?.inflows?.total}
                />

                <div style={{ marginTop: "15px" }}>
                    <MovementTable
                        items={
                            data.unmappedCashMovements?.inflows?.items || []
                        }
                    />
                </div>


                <h4 style={{ marginTop: "30px" }}>
                    پرداخت‌های طبقه‌بندی‌نشده
                </h4>

                <SummaryCard
                    title="مجموع پرداخت‌ها"
                    value={data.unmappedCashMovements?.outflows?.total}
                />

                <div style={{ marginTop: "15px" }}>
                    <MovementTable
                        items={
                            data.unmappedCashMovements?.outflows?.items || []
                        }
                    />
                </div>

                <p style={netFlowStyle}>
                    خالص گردش‌های طبقه‌بندی‌نشده:{" "}
                    <strong>
                        {formatMoney(
                            data.unmappedCashMovements?.netCashFlow
                        )}
                        {" ریال"}
                    </strong>
                </p>

            </section>


            {/* Internal Transfers */}

            <InternalTransfers
                data={data.internalTransfers}
            />


            {/* Opening Accounts */}

            <section style={sectionStyle}>

                <h3>موجودی ابتدای دوره به تفکیک حساب</h3>

                <OpeningAccountsTable
                    accounts={data.openingCashAccounts || []}
                />

            </section>


            {/* Closing Accounts */}

            <section style={sectionStyle}>

                <h3>موجودی پایان دوره به تفکیک حساب</h3>

                <ClosingAccountsTable
                    accounts={data.closingCashAccounts || []}
                />

            </section>


            {/* Reconciliation */}

            <Reconciliation
                data={data.reconciliation}
            />

        </section>
    );
}


// ======================================================
// Styles
// ======================================================

const sectionStyle = {
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid #ddd",
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "15px",
    margin: "25px 0",
};

const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "18px",
    background: "#fff",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
};

const thStyle = {
    padding: "12px",
    border: "1px solid #ddd",
    textAlign: "right",
    background: "#f3f4f6",
    whiteSpace: "nowrap",
};

const tdStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "right",
};

const emptyStyle = {
    color: "#777",
    padding: "15px",
    textAlign: "center",
};

const netFlowStyle = {
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
};


// ======================================================
// Export
// ======================================================

export default CashFlowStatement;
