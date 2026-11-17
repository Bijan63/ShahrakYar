const journalEntryRepository =
    require("../repositories/journalEntry.repository");

const prisma =
    require("../config/prisma");

const {
    normalizeDigits,
    parseJalaliDate,
    jalaliToGregorianParts,
    zonedDateTimeToUtc,
    DEFAULT_TIME_ZONE
} = require("../utils/jalaliDate");


// ======================================================
// Journal Entry Service
// ======================================================

class JournalEntryService {


    // ======================================================
    // Normalize Journal Entry Date
    // ======================================================
    //
    // API date input contract:
    //
    // 1. Jalali date:       1405/01/01
    // 2. Jalali date/time:  1405/01/01 12:30:00
    //    Persian and Arabic-Indic digits are accepted.
    // 3. Gregorian date:   2026-03-21
    //    Date-only values are interpreted at midnight in
    //    Asia/Tehran, not UTC midnight.
    // 4. ISO timestamp with Z/offset is treated as an
    //    absolute instant and preserved.
    // 5. Date objects and numeric epoch milliseconds are
    //    accepted for backward compatibility.
    //
    // IMPORTANT:
    // A slash-separated date is explicitly Jalali.
    // A hyphen-separated date-only value is Gregorian ISO.
    // This avoids ambiguous interpretation of YYYY-MM-DD.
    //
    // ======================================================

    normalizeEntryDate(value) {

        if (value instanceof Date) {

            if (Number.isNaN(value.getTime())) {
                throw new Error("Invalid entryDate");
            }

            return new Date(value.getTime());

        }


        if (typeof value === "number") {

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                throw new Error("Invalid entryDate");
            }

            return date;

        }


        if (typeof value !== "string" || !value.trim()) {
            throw new Error("Invalid entryDate");
        }


        const normalized = normalizeDigits(value.trim());


        // --------------------------------------------------
        // Jalali date or Jalali local date/time
        // --------------------------------------------------

        const jalaliMatch =
            /^(\d{3,4})\/(\d{1,2})\/(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(normalized);


        if (jalaliMatch) {

            try {

                const jalaliDate = parseJalaliDate(
                    `${jalaliMatch[1]}/${jalaliMatch[2]}/${jalaliMatch[3]}`
                );

                const hour = jalaliMatch[4] === undefined
                    ? 0
                    : Number(jalaliMatch[4]);

                const minute = jalaliMatch[5] === undefined
                    ? 0
                    : Number(jalaliMatch[5]);

                const second = jalaliMatch[6] === undefined
                    ? 0
                    : Number(jalaliMatch[6]);

                const millisecond = jalaliMatch[7] === undefined
                    ? 0
                    : Number(jalaliMatch[7].padEnd(3, "0"));


                if (
                    hour < 0 || hour > 23 ||
                    minute < 0 || minute > 59 ||
                    second < 0 || second > 59
                ) {
                    throw new Error("Invalid time in entryDate");
                }


                const gregorian = jalaliToGregorianParts(jalaliDate);

                return zonedDateTimeToUtc(
                    gregorian.gy,
                    gregorian.gm,
                    gregorian.gd,
                    hour,
                    minute,
                    second,
                    millisecond,
                    DEFAULT_TIME_ZONE
                );

            } catch (error) {

                throw new Error(`Invalid entryDate: ${error.message}`);

            }

        }


        // --------------------------------------------------
        // Gregorian date or local date/time without offset
        // --------------------------------------------------
        //
        // Date-only ISO values are interpreted as Tehran
        // calendar dates. Local datetimes without Z/offset
        // are also interpreted in Asia/Tehran.
        //
        // --------------------------------------------------

        const gregorianLocalMatch =
            /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(normalized);


        if (gregorianLocalMatch) {

            try {

                const year = Number(gregorianLocalMatch[1]);
                const month = Number(gregorianLocalMatch[2]);
                const day = Number(gregorianLocalMatch[3]);

                const hour = gregorianLocalMatch[4] === undefined
                    ? 0
                    : Number(gregorianLocalMatch[4]);

                const minute = gregorianLocalMatch[5] === undefined
                    ? 0
                    : Number(gregorianLocalMatch[5]);

                const second = gregorianLocalMatch[6] === undefined
                    ? 0
                    : Number(gregorianLocalMatch[6]);

                const millisecond = gregorianLocalMatch[7] === undefined
                    ? 0
                    : Number(gregorianLocalMatch[7].padEnd(3, "0"));


                // Validate Gregorian date without allowing rollover.
                const validationDate = new Date(
                    `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00.000Z`
                );

                if (
                    Number.isNaN(validationDate.getTime()) ||
                    validationDate.getUTCFullYear() !== year ||
                    validationDate.getUTCMonth() + 1 !== month ||
                    validationDate.getUTCDate() !== day
                ) {
                    throw new Error("Invalid Gregorian calendar date");
                }


                if (
                    hour < 0 || hour > 23 ||
                    minute < 0 || minute > 59 ||
                    second < 0 || second > 59
                ) {
                    throw new Error("Invalid time in entryDate");
                }


                return zonedDateTimeToUtc(
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    second,
                    millisecond,
                    DEFAULT_TIME_ZONE
                );

            } catch (error) {

                throw new Error(`Invalid entryDate: ${error.message}`);

            }

        }


        // --------------------------------------------------
        // ISO timestamp with explicit timezone / legacy input
        // --------------------------------------------------

        const date = new Date(normalized);

        if (Number.isNaN(date.getTime())) {
            throw new Error("Invalid entryDate");
        }

        return date;

    }


    // ======================================================
    // Validate Posting Account
    // ======================================================

    async validatePostingAccount(
        accountId,
        fiscalPeriodId,
        client = prisma
    ) {

        const account =
            await client.account.findUnique({

                where: {
                    id: accountId
                },

                include: {

                    children: {

                        select: {
                            id: true
                        }

                    }

                }

            });


        if (!account) {

            throw new Error(
                `Account not found: ${accountId}`
            );

        }


        // --------------------------------------------------
        // Account must be Active
        // --------------------------------------------------

        if (!account.isActive) {

            throw new Error(
                `Account is inactive: ${account.code}`
            );

        }


        // --------------------------------------------------
        // Account must belong to Fiscal Period
        // --------------------------------------------------

        if (
            account.fiscalPeriodId !==
            fiscalPeriodId
        ) {

            throw new Error(
                `Account ${account.code} does not belong to the journal entry fiscal period`
            );

        }


        // --------------------------------------------------
        // Account must be Leaf
        // --------------------------------------------------

        if (
            account.children &&
            account.children.length > 0
        ) {

            throw new Error(
                `Journal entry can only be posted to a leaf account: ${account.code}`
            );

        }


        return account;

    }


    // ======================================================
    // Validate Active Fund
    // ======================================================

    async validateActiveFund(
        fundId,
        fiscalPeriodId,
        client = prisma
    ) {

        // --------------------------------------------------
        // Fund is Optional
        // --------------------------------------------------

        if (
            fundId === undefined ||
            fundId === null ||
            fundId === ""
        ) {

            return null;

        }


        // --------------------------------------------------
        // Validate Fund ID
        // --------------------------------------------------

        if (
            typeof fundId !== "string" ||
            !fundId.trim()
        ) {

            throw new Error(
                "Invalid fundId"
            );

        }


        // --------------------------------------------------
        // Find Fund
        // --------------------------------------------------

        const fund =
            await client.fund.findUnique({

                where: {
                    id: fundId.trim()
                },

                select: {
                    id: true,
                    status: true,
                    fiscalPeriodId: true
                }

            });


        if (!fund) {

            throw new Error(
                "Fund not found"
            );

        }


        // --------------------------------------------------
        // Fund Must Be Active
        // --------------------------------------------------

        if (fund.status !== "ACTIVE") {

            throw new Error(
                "Journal entry can only use an active fund"
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        if (
            fund.fiscalPeriodId &&
            fund.fiscalPeriodId !== fiscalPeriodId
        ) {

            throw new Error(
                "Fund does not belong to the selected fiscal period"
            );

        }


        return fund;

    }

    // ======================================================
    // Get All Journal Entries
    // ======================================================

    async getAll() {

        return await journalEntryRepository.findAll();

    }


    // ======================================================
    // Get Journal Entry by ID
    // ======================================================

    async getById(id) {

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const journalEntry =
            await journalEntryRepository.findById(
                id
            );


        if (!journalEntry) {

            throw new Error(
                "Journal entry not found"
            );

        }


        return journalEntry;

    }


    // ======================================================
    // Get Journal Entry by Entry Number
    // ======================================================

    async getByEntryNumber(entryNumber) {

        if (!entryNumber) {

            throw new Error(
                "entryNumber is required"
            );

        }


        const journalEntry =
            await journalEntryRepository.findByEntryNumber(
                entryNumber
            );


        if (!journalEntry) {

            throw new Error(
                "Journal entry not found"
            );

        }


        return journalEntry;

    }


    // ======================================================
    // Get Journal Entries by Fiscal Period
    // ======================================================

    async getByFiscalPeriod(
        fiscalPeriodId
    ) {

        if (!fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        return await journalEntryRepository.findByFiscalPeriodId(
            fiscalPeriodId
        );

    }


    // ======================================================
    // Get Journal Entries by Fund
    // ======================================================

    async getByFund(fundId) {

        if (!fundId) {

            throw new Error(
                "fundId is required"
            );

        }


        return await journalEntryRepository.findByFundId(
            fundId
        );

    }


    // ======================================================
    // Create Journal Entry
    // ======================================================
    //
    // Normal operation.
    //
    // Delegates to createWithClient() so that both normal
    // and transactional creation use exactly the same
    // validation rules.
    //

    async create(data) {

        return await this.createWithClient(
            data,
            prisma
        );

    }


    // ======================================================
    // Create Journal Entry with Transaction Client
    // ======================================================
    //
    // This method is used when JournalEntry creation is part
    // of a larger transaction, such as ChargePayment.
    //
    // IMPORTANT:
    //
    // Every database read and write in this method uses
    // the supplied client.
    //
    // Therefore when client === tx, all operations belong
    // to the caller's transaction.
    //

    async createWithClient(
        data,
        client = prisma
    ) {


        // --------------------------------------------------
        // Validate Request Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Entry Number
        // --------------------------------------------------

        if (!data.entryNumber) {

            throw new Error(
                "entryNumber is required"
            );

        }


        // --------------------------------------------------
        // Entry Date
        // --------------------------------------------------

        if (!data.entryDate) {

            throw new Error(
                "entryDate is required"
            );

        }


        const entryDate =
            this.normalizeEntryDate(data.entryDate);


        if (
            Number.isNaN(
                entryDate.getTime()
            )
        ) {

            throw new Error(
                "Invalid entryDate"
            );

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        if (!data.fiscalPeriodId) {

            throw new Error(
                "fiscalPeriodId is required"
            );

        }


        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: data.fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be created in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Entry Date vs Fiscal Period
        // --------------------------------------------------

        if (
            entryDate < fiscalPeriod.startDate ||
            entryDate > fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }


        // --------------------------------------------------
        // Fund Validation
        // --------------------------------------------------

        await this.validateActiveFund(
            data.fundId,
            data.fiscalPeriodId,
            client
        );

        // --------------------------------------------------
        // Duplicate Entry Number
        // --------------------------------------------------

        const existing =
            await journalEntryRepository.findByEntryNumber(
                data.entryNumber,
                client
            );


        if (existing) {

            throw new Error(
                "Entry number already exists"
            );

        }


        // --------------------------------------------------
        // Lines
        // --------------------------------------------------

        if (
            !Array.isArray(data.lines) ||
            data.lines.length < 2
        ) {

            throw new Error(
                "Journal entry must have at least two lines"
            );

        }


        let totalDebit = 0;
        let totalCredit = 0;


        // --------------------------------------------------
        // Validate Lines
        // --------------------------------------------------

        for (
            const line of data.lines
        ) {

            if (!line) {

                throw new Error(
                    "Invalid journal entry line"
                );

            }


            // ----------------------------------------------
            // Account
            // ----------------------------------------------

            if (!line.accountId) {

                throw new Error(
                    "accountId is required for every journal entry line"
                );

            }


            await this.validatePostingAccount(

                line.accountId,

                data.fiscalPeriodId,

                client

            );


            // ----------------------------------------------
            // Debit
            // ----------------------------------------------

            const debit =
                line.debit !== undefined &&
                line.debit !== null
                    ? Number(line.debit)
                    : 0;


            // ----------------------------------------------
            // Credit
            // ----------------------------------------------

            const credit =
                line.credit !== undefined &&
                line.credit !== null
                    ? Number(line.credit)
                    : 0;


            // ----------------------------------------------
            // Number Validation
            // ----------------------------------------------

            if (
                !Number.isFinite(debit) ||
                !Number.isFinite(credit)
            ) {

                throw new Error(
                    "Debit and credit must be valid numbers"
                );

            }


            // ----------------------------------------------
            // Negative Validation
            // ----------------------------------------------

            if (
                debit < 0 ||
                credit < 0
            ) {

                throw new Error(
                    "Debit and credit cannot be negative"
                );

            }


            // ----------------------------------------------
            // Debit + Credit
            // ----------------------------------------------

            if (
                debit > 0 &&
                credit > 0
            ) {

                throw new Error(
                    "A journal entry line cannot have both debit and credit"
                );

            }


            // ----------------------------------------------
            // Empty Line
            // ----------------------------------------------

            if (
                debit === 0 &&
                credit === 0
            ) {

                throw new Error(
                    "A journal entry line must have debit or credit amount"
                );

            }


            totalDebit += debit;
            totalCredit += credit;

        }


        // --------------------------------------------------
        // Validate Balance
        // --------------------------------------------------

        const difference =
            Math.abs(
                totalDebit -
                totalCredit
            );


        if (
            difference > 0.000001
        ) {

            throw new Error(
                `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );

        }


        // --------------------------------------------------
        // Prepare Lines
        // --------------------------------------------------

        const lines =
            data.lines.map(
                (line) => ({

                    accountId:
                        line.accountId,

                    description:
                        line.description || null,

                    debit:
                        line.debit !== undefined &&
                        line.debit !== null
                            ? line.debit
                            : 0,

                    credit:
                        line.credit !== undefined &&
                        line.credit !== null
                            ? line.credit
                            : 0

                })
            );


        // --------------------------------------------------
        // Prepare Journal Entry
        // --------------------------------------------------

        const createData = {

            entryNumber:
                data.entryNumber,

            entryDate,

            description:
                data.description || null,

            status:
                "DRAFT",

            fiscalPeriodId:
                data.fiscalPeriodId,

            fundId:
                data.fundId || null,

            lines

        };


        // --------------------------------------------------
        // Create
        // --------------------------------------------------

        return await journalEntryRepository.create(
            createData,
            client
        );

    }


    // ======================================================
    // Update Journal Entry
    // ======================================================

    async update(
        id,
        data
    ) {


        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Validate Body
        // --------------------------------------------------

        if (!data) {

            throw new Error(
                "Request body is required"
            );

        }


        // --------------------------------------------------
        // Existing Journal Entry
        // --------------------------------------------------

        const existing =
            await this.getById(id);


        // --------------------------------------------------
        // Journal Entry Status Protection
        // --------------------------------------------------

        if (
            existing.status !== "DRAFT"
        ) {

            throw new Error(
                "Only DRAFT journal entries can be modified"
            );

        }


        const updateData = {};


        // --------------------------------------------------
        // Entry Number
        // --------------------------------------------------

        if (
            data.entryNumber !== undefined
        ) {

            if (!data.entryNumber) {

                throw new Error(
                    "entryNumber is required"
                );

            }


            const duplicate =
                await journalEntryRepository.findByEntryNumber(
                    data.entryNumber
                );


            if (
                duplicate &&
                duplicate.id !== id
            ) {

                throw new Error(
                    "Entry number already exists"
                );

            }


            updateData.entryNumber =
                data.entryNumber;

        }


        // --------------------------------------------------
        // Entry Date
        // --------------------------------------------------

        let newEntryDate =
            existing.entryDate;


        if (
            data.entryDate !== undefined
        ) {

            newEntryDate =
                this.normalizeEntryDate(data.entryDate);


            if (
                Number.isNaN(
                    newEntryDate.getTime()
                )
            ) {

                throw new Error(
                    "Invalid entryDate"
                );

            }


            updateData.entryDate =
                newEntryDate;

        }


        // --------------------------------------------------
        // Description
        // --------------------------------------------------

        if (
            data.description !== undefined
        ) {

            updateData.description =
                data.description;

        }


        // --------------------------------------------------
        // Status
        // --------------------------------------------------

        if (
            data.status !== undefined
        ) {

            if (
                data.status === "POSTED"
            ) {

                throw new Error(
                    "Journal entry must be posted using the post operation"
                );

            }


            const allowedStatuses = [

                "DRAFT",

                "CANCELLED"

            ];


            if (
                !allowedStatuses.includes(
                    data.status
                )
            ) {

                throw new Error(
                    "Invalid journal entry status"
                );

            }


            updateData.status =
                data.status;

        }


        // --------------------------------------------------
        // Fiscal Period
        // --------------------------------------------------

        const fiscalPeriodId =
            existing.fiscalPeriodId;


        // --------------------------------------------------
        // Prevent Fiscal Period Change
        // --------------------------------------------------

        if (
            data.fiscalPeriodId !== undefined &&
            data.fiscalPeriodId !==
            existing.fiscalPeriodId
        ) {

            throw new Error(
                "Journal entry fiscal period cannot be changed"
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        const fiscalPeriod =
            await prisma.fiscalPeriod.findUnique({

                where: {
                    id: fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be modified in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Entry Date vs Fiscal Period
        // --------------------------------------------------

        if (
            newEntryDate < fiscalPeriod.startDate ||
            newEntryDate > fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }



        // --------------------------------------------------
        // Fund
        // --------------------------------------------------

        let fundId =
            existing.fundId || null;


        if (
            data.fundId !== undefined
        ) {

            if (
                data.fundId === null ||
                data.fundId === ""
            ) {

                fundId = null;

                updateData.fundId = null;

            }

            else {

                if (
                    typeof data.fundId !== "string" ||
                    !data.fundId.trim()
                ) {

                    throw new Error(
                        "Invalid fundId"
                    );

                }

                fundId =
                    data.fundId.trim();

                updateData.fundId =
                    fundId;

            }

        }


        // --------------------------------------------------
        // Validate Selected Fund
        // --------------------------------------------------

        await this.validateActiveFund(
            fundId,
            fiscalPeriodId
        );



        // --------------------------------------------------
        // Lines
        // --------------------------------------------------

        if (
            data.lines !== undefined
        ) {

            if (
                !Array.isArray(data.lines) ||
                data.lines.length < 2
            ) {

                throw new Error(
                    "Journal entry must have at least two lines"
                );

            }


            let totalDebit = 0;
            let totalCredit = 0;


            // ------------------------------------------------
            // Validate Lines
            // ------------------------------------------------

            for (
                const line of data.lines
            ) {

                if (!line) {

                    throw new Error(
                        "Invalid journal entry line"
                    );

                }


                if (!line.accountId) {

                    throw new Error(
                        "accountId is required for every journal entry line"
                    );

                }


                await this.validatePostingAccount(

                    line.accountId,

                    fiscalPeriodId

                );


                const debit =
                    line.debit !== undefined &&
                    line.debit !== null
                        ? Number(line.debit)
                        : 0;


                const credit =
                    line.credit !== undefined &&
                    line.credit !== null
                        ? Number(line.credit)
                        : 0;


                if (
                    !Number.isFinite(debit) ||
                    !Number.isFinite(credit)
                ) {

                    throw new Error(
                        "Debit and credit must be valid numbers"
                    );

                }


                if (
                    debit < 0 ||
                    credit < 0
                ) {

                    throw new Error(
                        "Debit and credit cannot be negative"
                    );

                }


                if (
                    debit > 0 &&
                    credit > 0
                ) {

                    throw new Error(
                        "A journal entry line cannot have both debit and credit"
                    );

                }


                if (
                    debit === 0 &&
                    credit === 0
                ) {

                    throw new Error(
                        "A journal entry line must have debit or credit amount"
                    );

                }


                totalDebit += debit;
                totalCredit += credit;

            }


            // ------------------------------------------------
            // Validate Balance
            // ------------------------------------------------

            const difference =
                Math.abs(
                    totalDebit -
                    totalCredit
                );


            if (
                difference > 0.000001
            ) {

                throw new Error(
                    `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
                );

            }


            // ------------------------------------------------
            // Prepare Lines
            // ------------------------------------------------

            updateData.lines =
                data.lines.map(
                    (line) => ({

                        accountId:
                            line.accountId,

                        description:
                            line.description || null,

                        debit:
                            line.debit !== undefined &&
                            line.debit !== null
                                ? line.debit
                                : 0,

                        credit:
                            line.credit !== undefined &&
                            line.credit !== null
                                ? line.credit
                                : 0

                    })
                );

        }


        // --------------------------------------------------
        // Update
        // --------------------------------------------------

        return await journalEntryRepository.update(
            id,
            updateData
        );

    }


    // ======================================================
    // Post Journal Entry
    // ======================================================

    async post(id) {

        return await this.postWithClient(
            id,
            prisma
        );

    }


    // ======================================================
    // Post Journal Entry with Transaction Client
    // ======================================================

    async postWithClient(
        id,
        client = prisma
    ) {

        // --------------------------------------------------
        // Validate ID
        // --------------------------------------------------

        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        // --------------------------------------------------
        // Start Internal Transaction
        // --------------------------------------------------
        //
        // When called with the main Prisma client,
        // create an interactive transaction.
        //
        // When called with an external transaction client,
        // reuse that transaction.
        //

        if (client === prisma) {

            return await prisma.$transaction(

                async (tx) => {

                    return await this.postWithClient(
                        id,
                        tx
                    );

                }

            );

        }


        // --------------------------------------------------
        // Lock Journal Entry
        // --------------------------------------------------

        const locked =
            await journalEntryRepository.lockById(
                id,
                client
            );


        if (!locked) {

            throw new Error(
                "Journal entry not found"
            );

        }


        // --------------------------------------------------
        // Find Journal Entry After Lock
        // --------------------------------------------------

        const existing =
            await journalEntryRepository.findById(
                id,
                client
            );


        if (!existing) {

            throw new Error(
                "Journal entry not found"
            );

        }


        // --------------------------------------------------
        // Journal Entry must be DRAFT
        // --------------------------------------------------

        if (
            existing.status !== "DRAFT"
        ) {

            throw new Error(
                "Only DRAFT journal entries can be posted"
            );

        }


        // --------------------------------------------------
        // Validate Fiscal Period
        // --------------------------------------------------

        const fiscalPeriod =
            await client.fiscalPeriod.findUnique({

                where: {
                    id: existing.fiscalPeriodId
                }

            });


        if (!fiscalPeriod) {

            throw new Error(
                "Fiscal period not found"
            );

        }


        // --------------------------------------------------
        // Fiscal Period must be ACTIVE
        // --------------------------------------------------

        if (
            fiscalPeriod.status !== "ACTIVE"
        ) {

            throw new Error(
                "Journal entry can only be posted in an active fiscal period"
            );

        }


        // --------------------------------------------------
        // Validate Entry Date
        // --------------------------------------------------

        if (
            existing.entryDate <
            fiscalPeriod.startDate ||
            existing.entryDate >
            fiscalPeriod.endDate
        ) {

            throw new Error(
                "Entry date is outside the fiscal period"
            );

        }


        // --------------------------------------------------
        // Validate Fund Before Posting
        // --------------------------------------------------

        await this.validateActiveFund(
            existing.fundId,
            existing.fiscalPeriodId,
            client
        );


        // --------------------------------------------------
        // Validate Lines
        // --------------------------------------------------

        if (
            !Array.isArray(existing.lines) ||
            existing.lines.length < 2
        ) {

            throw new Error(
                "Journal entry must have at least two lines"
            );

        }


        let totalDebit = 0;
        let totalCredit = 0;


        // --------------------------------------------------
        // Validate Each Line
        // --------------------------------------------------

        for (
            const line of existing.lines
        ) {

            if (!line.accountId) {

                throw new Error(
                    "accountId is required for every journal entry line"
                );

            }


            await this.validatePostingAccount(

                line.accountId,

                existing.fiscalPeriodId,

                client

            );


            const debit =
                Number(line.debit || 0);


            const credit =
                Number(line.credit || 0);


            if (
                !Number.isFinite(debit) ||
                !Number.isFinite(credit)
            ) {

                throw new Error(
                    "Debit and credit must be valid numbers"
                );

            }


            if (
                debit < 0 ||
                credit < 0
            ) {

                throw new Error(
                    "Debit and credit cannot be negative"
                );

            }


            if (
                debit > 0 &&
                credit > 0
            ) {

                throw new Error(
                    "A journal entry line cannot have both debit and credit"
                );

            }


            if (
                debit === 0 &&
                credit === 0
            ) {

                throw new Error(
                    "A journal entry line must have debit or credit amount"
                );

            }


            totalDebit += debit;
            totalCredit += credit;

        }


        // --------------------------------------------------
        // Validate Balance
        // --------------------------------------------------

        const difference =
            Math.abs(
                totalDebit -
                totalCredit
            );


        if (
            difference > 0.000001
        ) {

            throw new Error(
                `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`
            );

        }


        // --------------------------------------------------
        // Post Journal Entry
        // --------------------------------------------------

        return await journalEntryRepository.updateStatus(

            id,

            "POSTED",

            client

        );

    }

    // ======================================================
    // Delete Journal Entry
    // ======================================================

    async delete(id) {


        if (!id) {

            throw new Error(
                "id is required"
            );

        }


        const existing =
            await this.getById(id);


        // --------------------------------------------------
        // DRAFT-Only Deletion Protection
        // --------------------------------------------------

        if (existing.status !== "DRAFT") {

            throw new Error(
                "Only DRAFT journal entries can be deleted"
            );

        }



        return await journalEntryRepository.delete(
            id
        );

    }

}


// ======================================================
// Export
// ======================================================

module.exports =
    new JournalEntryService();