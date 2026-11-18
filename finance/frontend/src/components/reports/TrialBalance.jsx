import { useEffect, useState } from "react";

import { getTrialBalance } from "../../api/api";


// ======================================================
// Trial Balance
// ======================================================

function TrialBalance({
    token,
    fiscalPeriodId,
}) {

    const [report, setReport] =
        useState(null);

    const [loading, setLoading] =
        useState(Boolean(token && fiscalPeriodId));

    const [error, setError] =
        useState(null);


    // ==================================================
    // Load Report
    // ==================================================

    useEffect(() => {

        if (!token || !fiscalPeriodId) {
            return;
        }


        const loadTrialBalance =
            async () => {

                try {

                    setLoading(true);

                    setError(null);


                    const result =
                        await getTrialBalance(
                            token,
                            fiscalPeriodId
                        );


                    setReport(
                        result.data
                    );

                }
                catch (error) {

                    console.error(
                        "Trial Balance Error:",
                        error
                    );

                    setError(
                        error.message
                    );

                }
                finally {

                    setLoading(false);

                }

            };


        loadTrialBalance();

    }, [
        token,
        fiscalPeriodId
    ]);


    // ==================================================
    // Loading
    // ==================================================

    if (loading) {

        return (
            <div>
                در حال دریافت تراز آزمایشی...
            </div>
        );

    }


    // ==================================================
    // Error
    // ==================================================

    if (error) {

        return (
            <div>
                خطا در دریافت تراز آزمایشی:
                {" "}
                {error}
            </div>
        );

    }


    // ==================================================
    // No Report
    // ==================================================

    if (!report) {

        return (
            <div>
                اطلاعاتی برای نمایش وجود ندارد.
            </div>
        );

    }


    // ==================================================
    // Render
    // ==================================================

    return (

        <div
            dir="rtl"
            className="trial-balance"
        >

            <h2>
                تراز آزمایشی
            </h2>


            <div>

                <strong>
                    دوره مالی:
                </strong>

                {" "}

                {report.fiscalPeriod.name}

            </div>


            <div>

                <strong>
                    کد دوره:
                </strong>

                {" "}

                {report.fiscalPeriod.code}

            </div>


            <div>

                <strong>
                    وضعیت:
                </strong>

                {" "}

                {report.isBalanced
                    ? "تراز است"
                    : "نامتراز است"
                }

            </div>


            <div>

                <strong>
                    جمع بدهکار:
                </strong>

                {" "}

                {report.totalDebit.toLocaleString()}

            </div>


            <div>

                <strong>
                    جمع بستانکار:
                </strong>

                {" "}

                {report.totalCredit.toLocaleString()}

            </div>


            <div>

                <strong>
                    اختلاف:
                </strong>

                {" "}

                {report.difference.toLocaleString()}

            </div>


            <hr />


            <table>

                <thead>

                    <tr>

                        <th>
                            کد
                        </th>

                        <th>
                            نام حساب
                        </th>

                        <th>
                            نوع
                        </th>

                        <th>
                            بدهکار
                        </th>

                        <th>
                            بستانکار
                        </th>

                        <th>
                            مانده
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {report.accounts.map(
                        (account) => (

                            <tr
                                key={
                                    account.accountId
                                }
                            >

                                <td>
                                    {account.code}
                                </td>

                                <td>
                                    {account.name}
                                </td>

                                <td>
                                    {account.type}
                                </td>

                                <td>
                                    {account.debit
                                        .toLocaleString()
                                    }
                                </td>

                                <td>
                                    {account.credit
                                        .toLocaleString()
                                    }
                                </td>

                                <td>
                                    {account.balance
                                        .toLocaleString()
                                    }
                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>

    );

}


export default TrialBalance;