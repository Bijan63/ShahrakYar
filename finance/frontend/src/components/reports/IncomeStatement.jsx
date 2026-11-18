

// ======================================================
// Number Formatter
// ======================================================

const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("fa-IR");
};


// ======================================================
// Account Table
// ======================================================

function AccountTable({ accounts = [] }) {

    return (
        <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>کد حساب</th>
                        <th style={thStyle}>نام حساب</th>
                        <th style={thStyle}>مبلغ (ریال)</th>
                    </tr>
                </thead>

                <tbody>
                    {accounts.length === 0 ? (
                        <tr>
                            <td colSpan="3" style={emptyStyle}>
                                حسابی ثبت نشده است.
                            </td>
                        </tr>
                    ) : (
                        accounts.map((account) => (
                            <tr key={account.accountId}>
                                <td style={tdStyle}>
                                    {account.code}
                                </td>

                                <td style={tdStyle}>
                                    {account.name}
                                </td>

                                <td style={tdStyle}>
                                    {formatMoney(
                                        Math.abs(Number(account.balance || 0))
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}


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
// Income Statement
// ======================================================

function IncomeStatement({ data }) {

    if (!data) {
        return null;
    }

    const revenueAccounts =
        data.revenue?.accounts || [];

    const expenseAccounts =
        data.expenses?.accounts || [];

    const totalRevenue =
        Number(data.revenue?.total || 0);

    const totalExpenses =
        Number(data.expenses?.total || 0);

    const netIncome =
        Number(data.netIncome || 0);


    return (
        <section
            dir="rtl"
            style={{
                marginTop: "50px",
                marginBottom: "50px",
                fontFamily: "Tahoma",
            }}
        >

            <h2>صورت سود و زیان</h2>

            <p>
                دوره مالی:{" "}
                <strong>
                    {data.fiscalPeriod?.name || "-"}
                </strong>
            </p>


            {/* Summary */}

            <div style={summaryGridStyle}>

                <SummaryCard
                    title="مجموع درآمدها"
                    value={totalRevenue}
                />

                <SummaryCard
                    title="مجموع هزینه‌ها"
                    value={totalExpenses}
                />

                <SummaryCard
                    title={
                        netIncome >= 0
                            ? "سود خالص دوره"
                            : "زیان خالص دوره"
                    }
                    value={Math.abs(netIncome)}
                />

            </div>


            {/* Revenue */}

            <h3>درآمدها</h3>

            <AccountTable
                accounts={revenueAccounts}
            />

            <div style={totalStyle}>
                مجموع درآمدها:{" "}
                <strong>
                    {formatMoney(totalRevenue)} ریال
                </strong>
            </div>


            {/* Expenses */}

            <h3 style={{ marginTop: "35px" }}>
                هزینه‌ها
            </h3>

            <AccountTable
                accounts={expenseAccounts}
            />

            <div style={totalStyle}>
                مجموع هزینه‌ها:{" "}
                <strong>
                    {formatMoney(totalExpenses)} ریال
                </strong>
            </div>


            {/* Net Income */}

            <div style={resultStyle}>

                <h3>نتیجه عملکرد مالی دوره</h3>

                <strong style={{ fontSize: "24px" }}>
                    {netIncome >= 0 ? "سود خالص: " : "زیان خالص: "}
                    {formatMoney(Math.abs(netIncome))}
                    {" ریال"}
                </strong>

            </div>

        </section>
    );
}


// ======================================================
// Styles
// ======================================================

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
};

const thStyle = {
    padding: "12px",
    border: "1px solid #ddd",
    textAlign: "right",
    background: "#f3f4f6",
};

const tdStyle = {
    padding: "10px",
    border: "1px solid #ddd",
    textAlign: "right",
};

const emptyStyle = {
    ...tdStyle,
    textAlign: "center",
    color: "#777",
};

const cardStyle = {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    background: "#fff",
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    margin: "25px 0 35px",
};

const totalStyle = {
    textAlign: "left",
    padding: "15px",
    fontWeight: "bold",
    borderBottom: "1px solid #ddd",
};

const resultStyle = {
    marginTop: "35px",
    padding: "25px",
    border: "1px solid #ddd",
    borderRadius: "12px",
};


// ======================================================
// Export
// ======================================================

export default IncomeStatement;
