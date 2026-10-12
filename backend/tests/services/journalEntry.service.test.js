jest.mock("../../src/config/prisma", () => ({
    fiscalPeriod: {
        findUnique: jest.fn(),
    },
    fund: {
        findUnique: jest.fn(),
    },
    account: {
        findUnique: jest.fn(),
    },
}));

jest.mock("../../src/repositories/journalEntry.repository", () => ({
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEntryNumber: jest.fn(),
    findByFiscalPeriodId: jest.fn(),
    findByFundId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
}));

const prisma = require("../../src/config/prisma");
const repository = require("../../src/repositories/journalEntry.repository");
const service = require("../../src/services/journalEntry.service");

const PERIOD_ID = "period-test-1405";
const DEBIT_ID = "account-debit";
const CREDIT_ID = "account-credit";

const periodStart = new Date("2026-01-01T00:00:00.000Z");
const periodEnd = new Date("2026-12-31T23:59:59.999Z");
const entryDate = new Date("2026-04-01T12:00:00.000Z");

let accountMap;

function makeData(overrides = {}) {
    return {
        entryNumber: "JV-TEST-001",
        entryDate,
        description: "Journal entry unit test",
        fiscalPeriodId: PERIOD_ID,
        fundId: null,
        lines: [
            {
                accountId: DEBIT_ID,
                debit: 100,
                credit: 0,
                description: "Debit line",
            },
            {
                accountId: CREDIT_ID,
                debit: 0,
                credit: 100,
                description: "Credit line",
            },
        ],
        ...overrides,
    };
}

function makeDraftEntry(overrides = {}) {
    return {
        id: "entry-test-001",
        entryNumber: "JV-TEST-001",
        entryDate,
        description: "Draft entry",
        status: "DRAFT",
        fiscalPeriodId: PERIOD_ID,
        fundId: null,
        lines: [
            {
                accountId: DEBIT_ID,
                debit: 100,
                credit: 0,
            },
            {
                accountId: CREDIT_ID,
                debit: 0,
                credit: 100,
            },
        ],
        ...overrides,
    };
}

beforeEach(() => {
    jest.resetAllMocks();

    accountMap = {
        [DEBIT_ID]: {
            id: DEBIT_ID,
            code: "1001",
            isActive: true,
            fiscalPeriodId: PERIOD_ID,
            children: [],
        },
        [CREDIT_ID]: {
            id: CREDIT_ID,
            code: "4001",
            isActive: true,
            fiscalPeriodId: PERIOD_ID,
            children: [],
        },
    };

    prisma.fiscalPeriod.findUnique.mockResolvedValue({
        id: PERIOD_ID,
        status: "ACTIVE",
        startDate: periodStart,
        endDate: periodEnd,
    });

    prisma.fund.findUnique.mockResolvedValue({
        id: "fund-test",
        fiscalPeriodId: PERIOD_ID,
    });

    prisma.account.findUnique.mockImplementation(async ({ where }) => (
        accountMap[where.id] || null
    ));

    repository.findAll.mockResolvedValue([]);
    repository.findById.mockResolvedValue(makeDraftEntry());
    repository.findByEntryNumber.mockResolvedValue(null);
    repository.findByFiscalPeriodId.mockResolvedValue([]);
    repository.findByFundId.mockResolvedValue([]);

    repository.create.mockImplementation(async data => ({
        id: "created-entry",
        ...data,
    }));

    repository.update.mockImplementation(async (id, data) => ({
        id,
        ...makeDraftEntry(),
        ...data,
    }));

    repository.updateStatus.mockImplementation(async (id, status) => ({
        ...makeDraftEntry({ id }),
        status,
    }));

    repository.delete.mockImplementation(async id => ({ id }));
});

describe("JournalEntryService read methods", () => {
    test("getAll delegates to repository", async () => {
        repository.findAll.mockResolvedValue([{ id: "entry-1" }]);

        await expect(service.getAll()).resolves.toEqual([
            { id: "entry-1" },
        ]);

        expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    test("getById rejects a missing ID", async () => {
        await expect(service.getById()).rejects.toThrow("id is required");
    });

    test("getById rejects a missing journal entry", async () => {
        repository.findById.mockResolvedValue(null);

        await expect(service.getById("missing"))
            .rejects.toThrow("Journal entry not found");
    });

    test("getById returns the found entry", async () => {
        const entry = makeDraftEntry();
        repository.findById.mockResolvedValue(entry);

        await expect(service.getById(entry.id)).resolves.toBe(entry);
    });

    test("getByEntryNumber validates the number", async () => {
        await expect(service.getByEntryNumber())
            .rejects.toThrow("entryNumber is required");
    });

    test("getByEntryNumber rejects a missing entry", async () => {
        repository.findByEntryNumber.mockResolvedValue(null);

        await expect(service.getByEntryNumber("missing"))
            .rejects.toThrow("Journal entry not found");
    });

    test("getByFiscalPeriod validates its argument", async () => {
        await expect(service.getByFiscalPeriod())
            .rejects.toThrow("fiscalPeriodId is required");
    });

    test("getByFund validates its argument", async () => {
        await expect(service.getByFund())
            .rejects.toThrow("fundId is required");
    });
});

describe("JournalEntryService validatePostingAccount", () => {
    test("rejects a nonexistent account", async () => {
        await expect(
            service.validatePostingAccount("missing", PERIOD_ID)
        ).rejects.toThrow("Account not found");
    });

    test("rejects an inactive account", async () => {
        accountMap[DEBIT_ID].isActive = false;

        await expect(
            service.validatePostingAccount(DEBIT_ID, PERIOD_ID)
        ).rejects.toThrow("Account is inactive");
    });

    test("rejects an account from another fiscal period", async () => {
        accountMap[DEBIT_ID].fiscalPeriodId = "another-period";

        await expect(
            service.validatePostingAccount(DEBIT_ID, PERIOD_ID)
        ).rejects.toThrow("does not belong to the journal entry fiscal period");
    });

    test("rejects a parent account", async () => {
        accountMap[DEBIT_ID].children = [{ id: "child-account" }];

        await expect(
            service.validatePostingAccount(DEBIT_ID, PERIOD_ID)
        ).rejects.toThrow("only be posted to a leaf account");
    });

    test("returns a valid active leaf account", async () => {
        await expect(
            service.validatePostingAccount(DEBIT_ID, PERIOD_ID)
        ).resolves.toEqual(accountMap[DEBIT_ID]);
    });
});

describe("JournalEntryService createWithClient", () => {
    test("rejects a missing request body", async () => {
        await expect(service.createWithClient())
            .rejects.toThrow("Request body is required");
    });

    test.each([
        [
            "missing entry number",
            data => { data.entryNumber = ""; },
            "entryNumber is required",
        ],
        [
            "missing entry date",
            data => { data.entryDate = null; },
            "entryDate is required",
        ],
        [
            "invalid entry date",
            data => { data.entryDate = "not-a-date"; },
            "Invalid entryDate",
        ],
        [
            "missing fiscal period",
            data => { data.fiscalPeriodId = null; },
            "fiscalPeriodId is required",
        ],
        [
            "fewer than two lines",
            data => { data.lines = [data.lines[0]]; },
            "at least two lines",
        ],
        [
            "missing line account",
            data => { data.lines[0].accountId = ""; },
            "accountId is required",
        ],
        [
            "non-numeric debit",
            data => { data.lines[0].debit = "not-a-number"; },
            "valid numbers",
        ],
        [
            "negative debit",
            data => { data.lines[0].debit = -1; },
            "cannot be negative",
        ],
        [
            "debit and credit on the same line",
            data => { data.lines[0].credit = 10; },
            "cannot have both debit and credit",
        ],
        [
            "empty line",
            data => {
                data.lines[0].debit = 0;
                data.lines[0].credit = 0;
            },
            "must have debit or credit amount",
        ],
        [
            "unbalanced journal entry",
            data => { data.lines[1].credit = 99; },
            "Journal entry is not balanced",
        ],
    ])("rejects %s", async (_label, mutate, expectedError) => {
        const data = makeData();
        mutate(data);

        await expect(service.createWithClient(data))
            .rejects.toThrow(expectedError);

        expect(repository.create).not.toHaveBeenCalled();
    });

    test("rejects a missing fiscal period record", async () => {
        prisma.fiscalPeriod.findUnique.mockResolvedValue(null);

        await expect(service.createWithClient(makeData()))
            .rejects.toThrow("Fiscal period not found");
    });

    test("rejects an inactive fiscal period", async () => {
        prisma.fiscalPeriod.findUnique.mockResolvedValue({
            id: PERIOD_ID,
            status: "INACTIVE",
            startDate: periodStart,
            endDate: periodEnd,
        });

        await expect(service.createWithClient(makeData()))
            .rejects.toThrow("active fiscal period");
    });

    test("rejects an entry date outside the fiscal period", async () => {
        await expect(
            service.createWithClient(
                makeData({ entryDate: new Date("2025-12-31T00:00:00.000Z") })
            )
        ).rejects.toThrow("outside the fiscal period");
    });

    test("rejects an unknown fund", async () => {
        prisma.fund.findUnique.mockResolvedValue(null);

        await expect(
            service.createWithClient(makeData({ fundId: "missing-fund" }))
        ).rejects.toThrow("Fund not found");
    });

    test("rejects a fund associated with another period", async () => {
        prisma.fund.findUnique.mockResolvedValue({
            id: "fund-test",
            fiscalPeriodId: "another-period",
        });

        await expect(
            service.createWithClient(makeData({ fundId: "fund-test" }))
        ).rejects.toThrow("Fund does not belong to the selected fiscal period");
    });

    test("rejects a duplicate entry number", async () => {
        repository.findByEntryNumber.mockResolvedValue({
            id: "existing-entry",
            entryNumber: "JV-TEST-001",
        });

        await expect(service.createWithClient(makeData()))
            .rejects.toThrow("Entry number already exists");

        expect(repository.create).not.toHaveBeenCalled();
    });

    test("rejects a nonexistent posting account", async () => {
        accountMap[DEBIT_ID] = undefined;

        await expect(service.createWithClient(makeData()))
            .rejects.toThrow("Account not found");

        expect(repository.create).not.toHaveBeenCalled();
    });

    test("creates a balanced DRAFT journal entry", async () => {
        const data = makeData();

        const result = await service.createWithClient(data);

        expect(repository.create).toHaveBeenCalledTimes(1);

        const [createdData] = repository.create.mock.calls[0];

        expect(createdData.entryNumber).toBe(data.entryNumber);
        expect(createdData.entryDate).toEqual(entryDate);
        expect(createdData.status).toBe("DRAFT");
        expect(createdData.fiscalPeriodId).toBe(PERIOD_ID);
        expect(createdData.fundId).toBeNull();
        expect(createdData.lines).toHaveLength(2);
        expect(result.id).toBe("created-entry");
    });

    test("passes the supplied transaction client to reads and writes", async () => {
        const tx = {
            fiscalPeriod: {
                findUnique: jest.fn().mockResolvedValue({
                    id: PERIOD_ID,
                    status: "ACTIVE",
                    startDate: periodStart,
                    endDate: periodEnd,
                }),
            },
            fund: {
                findUnique: jest.fn(),
            },
            account: {
                findUnique: jest.fn().mockImplementation(async ({ where }) => (
                    accountMap[where.id] || null
                )),
            },
        };

        repository.findByEntryNumber.mockResolvedValue(null);

        await service.createWithClient(makeData(), tx);

        expect(tx.fiscalPeriod.findUnique).toHaveBeenCalled();
        expect(tx.account.findUnique).toHaveBeenCalledTimes(2);
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({ status: "DRAFT" }),
            tx
        );
    });
});

describe("JournalEntryService postWithClient", () => {
    test("rejects a missing ID", async () => {
        await expect(service.postWithClient())
            .rejects.toThrow("id is required");
    });

    test("rejects a missing entry", async () => {
        repository.findById.mockResolvedValue(null);

        await expect(service.postWithClient("missing"))
            .rejects.toThrow("Journal entry not found");
    });

    test("rejects an entry that is not DRAFT", async () => {
        repository.findById.mockResolvedValue(
            makeDraftEntry({ status: "POSTED" })
        );

        await expect(service.postWithClient("entry-test-001"))
            .rejects.toThrow("Only DRAFT journal entries can be posted");
    });

    test("rejects posting in an inactive fiscal period", async () => {
        prisma.fiscalPeriod.findUnique.mockResolvedValue({
            id: PERIOD_ID,
            status: "INACTIVE",
            startDate: periodStart,
            endDate: periodEnd,
        });

        await expect(service.postWithClient("entry-test-001"))
            .rejects.toThrow("active fiscal period");
    });

    test("rejects an entry with fewer than two lines", async () => {
        repository.findById.mockResolvedValue(
            makeDraftEntry({ lines: [] })
        );

        await expect(service.postWithClient("entry-test-001"))
            .rejects.toThrow("at least two lines");
    });

    test("rejects an unbalanced entry", async () => {
        repository.findById.mockResolvedValue(
            makeDraftEntry({
                lines: [
                    { accountId: DEBIT_ID, debit: 100, credit: 0 },
                    { accountId: CREDIT_ID, debit: 0, credit: 90 },
                ],
            })
        );

        await expect(service.postWithClient("entry-test-001"))
            .rejects.toThrow("Journal entry is not balanced");

        expect(repository.updateStatus).not.toHaveBeenCalled();
    });

    test("posts a balanced draft entry", async () => {
        repository.findById.mockResolvedValue(makeDraftEntry());

        repository.updateStatus.mockResolvedValue({
            id: "entry-test-001",
            status: "POSTED",
        });

        await expect(service.postWithClient("entry-test-001"))
            .resolves.toMatchObject({ status: "POSTED" });

        expect(repository.updateStatus).toHaveBeenCalledWith(
            "entry-test-001",
            "POSTED",
            prisma
        );
    });

    test("does not update the status when a posting account is inactive", async () => {
        accountMap[DEBIT_ID].isActive = false;
        repository.findById.mockResolvedValue(makeDraftEntry());

        await expect(service.postWithClient("entry-test-001"))
            .rejects.toThrow("Account is inactive");

        expect(repository.updateStatus).not.toHaveBeenCalled();
    });
});

describe("JournalEntryService update and delete", () => {
    test("update rejects a missing ID", async () => {
        await expect(service.update(null, {}))
            .rejects.toThrow("id is required");
    });

    test("update rejects a missing body", async () => {
        await expect(service.update("entry-test-001", null))
            .rejects.toThrow("Request body is required");
    });

    test("update rejects modification of a POSTED entry", async () => {
        repository.findById.mockResolvedValue(
            makeDraftEntry({ status: "POSTED" })
        );

        await expect(service.update("entry-test-001", {
            description: "Attempted change",
        })).rejects.toThrow("Only DRAFT journal entries can be modified");
    });

    test("update prevents setting status to POSTED directly", async () => {
        await expect(service.update("entry-test-001", {
            status: "POSTED",
        })).rejects.toThrow("must be posted using the post operation");
    });

    test("update rejects an invalid status", async () => {
        await expect(service.update("entry-test-001", {
            status: "UNKNOWN",
        })).rejects.toThrow("Invalid journal entry status");
    });

    test("update prevents changing the fiscal period", async () => {
        await expect(service.update("entry-test-001", {
            fiscalPeriodId: "another-period",
        })).rejects.toThrow("fiscal period cannot be changed");
    });

    test("update rejects an unbalanced replacement of lines", async () => {
        await expect(service.update("entry-test-001", {
            lines: [
                { accountId: DEBIT_ID, debit: 100, credit: 0 },
                { accountId: CREDIT_ID, debit: 0, credit: 90 },
            ],
        })).rejects.toThrow("Journal entry is not balanced");

        expect(repository.update).not.toHaveBeenCalled();
    });

    test("update accepts a valid description change", async () => {
        const result = await service.update("entry-test-001", {
            description: "Updated description",
        });

        expect(repository.update).toHaveBeenCalledWith(
            "entry-test-001",
            { description: "Updated description" }
        );
        expect(result.description).toBe("Updated description");
    });

    test("delete rejects a missing ID", async () => {
        await expect(service.delete())
            .rejects.toThrow("id is required");
    });

    test("delete protects a POSTED entry", async () => {
        repository.findById.mockResolvedValue(
            makeDraftEntry({ status: "POSTED" })
        );

        await expect(service.delete("entry-test-001"))
            .rejects.toThrow("Posted journal entry cannot be deleted");

        expect(repository.delete).not.toHaveBeenCalled();
    });

    test("delete permits a DRAFT entry", async () => {
        await expect(service.delete("entry-test-001"))
            .resolves.toEqual({ id: "entry-test-001" });

        expect(repository.delete).toHaveBeenCalledWith("entry-test-001");
    });
});
