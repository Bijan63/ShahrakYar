// =====================================================
// ShahrakYar - Date Utilities
// Gregorian <-> Jalali
// =====================================================


// =====================================================
// Gregorian Date -> Jalali Object
// =====================================================

function toJalali(dateInput) {

    const date = new Date(dateInput);

    if (Number.isNaN(date.getTime())) {

        throw new Error("Invalid date.");

    }

    const formatter =
        new Intl.DateTimeFormat(
            "en-US-u-ca-persian",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                timeZone: "UTC"
            }
        );

    const parts =
        formatter.formatToParts(date);

    const year =
        Number(
            parts.find(
                part => part.type === "year"
            ).value
        );

    const month =
        Number(
            parts.find(
                part => part.type === "month"
            ).value
        );

    const day =
        Number(
            parts.find(
                part => part.type === "day"
            ).value
        );

    return {

        year,
        month,
        day

    };

}


// =====================================================
// Gregorian Date -> Jalali String
//
// Example:
// 2026-08-12
// ->
// 1405/05/21
// =====================================================

function formatJalaliDate(dateInput) {

    const {
        year,
        month,
        day
    } = toJalali(dateInput);

    return [

        String(year).padStart(4, "0"),

        String(month).padStart(2, "0"),

        String(day).padStart(2, "0")

    ].join("/");

}


// =====================================================
// Gregorian Date -> Jalali DateTime
// =====================================================

function formatJalaliDateTime(dateInput) {

    const date =
        new Date(dateInput);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        throw new Error(
            "Invalid date."
        );

    }

    const datePart =
        formatJalaliDate(date);

    const timePart =
        date.toLocaleTimeString(
            "en-GB",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        );

    return `${datePart} ${timePart}`;

}


// =====================================================
// Jalali -> Gregorian
//
// Reliable reverse conversion using
// JavaScript Persian calendar.
//
// Example:
//
// 1405/03/01
// ->
// 2026-05-22
// =====================================================

function jalaliToGregorian(
    jy,
    jm,
    jd
) {

    jy = Number(jy);
    jm = Number(jm);
    jd = Number(jd);

    if (
        !Number.isInteger(jy) ||
        !Number.isInteger(jm) ||
        !Number.isInteger(jd)
    ) {

        throw new Error(
            "Invalid Jalali date."
        );

    }

    if (
        jm < 1 ||
        jm > 12
    ) {

        throw new Error(
            "Invalid Jalali month."
        );

    }

    if (
        jd < 1 ||
        jd > 31
    ) {

        throw new Error(
            "Invalid Jalali day."
        );

    }


    // -------------------------------------------------
    // Approximate Gregorian year
    // -------------------------------------------------

    const approximateGregorianYear =
        jy + 621;


    // -------------------------------------------------
    // Search around the approximate year
    // -------------------------------------------------

    const start =
        Date.UTC(
            approximateGregorianYear - 1,
            0,
            1
        );

    const end =
        Date.UTC(
            approximateGregorianYear + 1,
            11,
            31
        );


    const oneDay =
        24 * 60 * 60 * 1000;


    for (
        let timestamp = start;
        timestamp <= end;
        timestamp += oneDay
    ) {

        const currentDate =
            new Date(timestamp);

        const currentJalali =
            toJalali(currentDate);


        if (
            currentJalali.year === jy &&
            currentJalali.month === jm &&
            currentJalali.day === jd
        ) {

            return {

                year:
                    currentDate.getUTCFullYear(),

                month:
                    currentDate.getUTCMonth() + 1,

                day:
                    currentDate.getUTCDate()

            };

        }

    }


    throw new Error(
        `Invalid Jalali date: ${jy}/${jm}/${jd}`
    );

}


// =====================================================
// Jalali String -> Gregorian Date
//
// Supported:
//
// 1405/03/01
// 1405-03-01
// =====================================================

function jalaliToDate(
    jalaliDate
) {

    if (
        typeof jalaliDate !== "string"
    ) {

        throw new Error(
            "Jalali date must be a string."
        );

    }

    const normalized =
        jalaliDate
            .trim()
            .replace(/-/g, "/");


    const parts =
        normalized.split("/");


    if (
        parts.length !== 3
    ) {

        throw new Error(
            "Invalid Jalali date format. Use YYYY/MM/DD."
        );

    }


    const jy =
        Number(parts[0]);

    const jm =
        Number(parts[1]);

    const jd =
        Number(parts[2]);


    const {
        year,
        month,
        day
    } =
        jalaliToGregorian(
            jy,
            jm,
            jd
        );


    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );

}


// =====================================================
// Jalali Date Range -> Gregorian
//
// Example:
//
// 1405/03/01
// 1405/03/31
//
// ->
//
// fromDate:
// 2026-05-22T00:00:00.000Z
//
// toDate:
// 2026-06-21T23:59:59.999Z
// =====================================================

function jalaliRangeToGregorian(
    from,
    to
) {

    const fromDate =
        jalaliToDate(from);

    const toDate =
        jalaliToDate(to);


    // End of selected day

    toDate.setUTCHours(
        23,
        59,
        59,
        999
    );


    if (
        fromDate > toDate
    ) {

        throw new Error(
            "The from date cannot be greater than the to date."
        );

    }


    return {

        fromDate,
        toDate

    };

}


// =====================================================
// Exports
// =====================================================

module.exports = {

    toJalali,

    formatJalaliDate,

    formatJalaliDateTime,

    jalaliToGregorian,

    jalaliToDate,

    jalaliRangeToGregorian

};