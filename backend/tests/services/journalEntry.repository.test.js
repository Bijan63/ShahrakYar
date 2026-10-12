jest.mock("../../src/config/prisma", () => ({
    journalEntry: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
    },
    journalEntryLine: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
    },
    $transaction: jest.fn(),
}));

const prisma = require("../../src/config/prisma");
const repository = require("../../src/repositories/journalEntry.repository");

const PERIOD_ID = "period-repository-test";
const ENTRY_ID = "entry-repository-test";

const entry = {
    id: ENTRY_ID,
    entryNumber: "JV-REPOSITORY-001",
    status: "DRAFT",
    fiscalPeriodId: PERIOD_ID,
};

const tx = {
    journalEntry: {
        update: jest.fn(),
        findUnique: jest.fn(),
    },
    journalEntryLine: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
    },
};

beforeEach(() => {
    jest.resetAllMocks();

    prisma.$transaction.mockImplementation(
        async callback => callback(tx)
    );

    prisma.journalEntry.findMany.mockResolvedValue([entry]);
    prisma.journalEntry.findUnique.mockResolvedValue(entry);
    prisma.journalEntry.create.mockResolvedValue(entry);
    prisma.journalEntry.update.mockResolvedValue(entry);
    prisma.journalEntry.updateMany.mockResolvedValue({ count: 1 });
    prisma.journalEntry.delete.mockResolvedValue(entry);

    tx.journalEntry.update.mockResolvedValue(entry);
    tx.journalEntry.findUnique.mockResolvedValue(entry);
    tx.journalEntryLine.deleteMany.mockResolvedValue({ count: 2 });
    tx.journalEntryLine.createMany.mockResolvedValue({ count: 2 });
});

describe("JournalEntryRepository getInclude", () => {
    test("includes fiscal period, fund and ordered lines with accounts", () => {
        expect(repository.getInclude()).toEqual({
            fiscalPeriod: true,
            fund: true,
            lines: {
                orderBy: { createdAt: "asc" },
                include: { account: true },
            },
        });
    });
});

describe("JournalEntryRepository read methods", () => {
    test("findAll orders entries by entryDate descending", async () => {
        await expect(repository.findAll()).resolves.toEqual([entry]);

        expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
            orderBy: { entryDate: "desc" },
            include: repository.getInclude(),
        });
    });

    test("findAll accepts an explicit transaction client", async () => {
        const client = {
            journalEntry: {
                findMany: jest.fn().mockResolvedValue([entry]),
            },
        };

        await expect(repository.findAll(client)).resolves.toEqual([entry]);
        expect(client.journalEntry.findMany).toHaveBeenCalledWith({
            orderBy: { entryDate: "desc" },
            include: repository.getInclude(),
        });
        expect(prisma.journalEntry.findMany).not.toHaveBeenCalled();
    });

    test("findById queries by ID and includes relations", async () => {
        await expect(repository.findById(ENTRY_ID)).resolves.toEqual(entry);

        expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            include: repository.getInclude(),
        });
    });

    test("findByEntryNumber queries by entry number", async () => {
        await repository.findByEntryNumber("JV-001");

        expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
            where: { entryNumber: "JV-001" },
            include: repository.getInclude(),
        });
    });

    test("findByFiscalPeriodId filters by fiscal period and sorts descending", async () => {
        await repository.findByFiscalPeriodId(PERIOD_ID);

        expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
            where: { fiscalPeriodId: PERIOD_ID },
            orderBy: { entryDate: "desc" },
            include: repository.getInclude(),
        });
    });

    test("findByFundId filters by fund and sorts descending", async () => {
        await repository.findByFundId("fund-repository-test");

        expect(prisma.journalEntry.findMany).toHaveBeenCalledWith({
            where: { fundId: "fund-repository-test" },
            orderBy: { entryDate: "desc" },
            include: repository.getInclude(),
        });
    });
});

describe("JournalEntryRepository create", () => {
    test("stores lines as nested creates and includes relations", async () => {
        const data = {
            entryNumber: "JV-CREATE-001",
            status: "DRAFT",
            fiscalPeriodId: PERIOD_ID,
            lines: [
                { accountId: "account-debit", debit: 100, credit: 0 },
                { accountId: "account-credit", debit: 0, credit: 100 },
            ],
        };

        await repository.create(data);

        expect(prisma.journalEntry.create).toHaveBeenCalledWith({
            data: {
                entryNumber: "JV-CREATE-001",
                status: "DRAFT",
                fiscalPeriodId: PERIOD_ID,
                lines: { create: data.lines },
            },
            include: repository.getInclude(),
        });
    });

    test("uses the supplied transaction client", async () => {
        const client = {
            journalEntry: {
                create: jest.fn().mockResolvedValue(entry),
            },
        };

        await repository.create({
            entryNumber: "JV-CREATE-TX",
            lines: [],
        }, client);

        expect(client.journalEntry.create).toHaveBeenCalledWith({
            data: {
                entryNumber: "JV-CREATE-TX",
                lines: { create: [] },
            },
            include: repository.getInclude(),
        });

        expect(prisma.journalEntry.create).not.toHaveBeenCalled();
    });
});

describe("JournalEntryRepository update without lines", () => {
    test("updates entry fields directly without opening a transaction", async () => {
        await repository.update(ENTRY_ID, {
            description: "Changed description",
        });

        expect(prisma.journalEntry.update).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            data: { description: "Changed description" },
            include: repository.getInclude(),
        });

        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("accepts an explicit transaction client", async () => {
        const client = {
            journalEntry: {
                update: jest.fn().mockResolvedValue(entry),
            },
        };

        await repository.update(ENTRY_ID, {
            description: "Updated with caller client",
        }, client);

        expect(client.journalEntry.update).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            data: { description: "Updated with caller client" },
            include: repository.getInclude(),
        });
    });
});

describe("JournalEntryRepository update with lines", () => {
    const lines = [
        {
            accountId: "account-debit",
            description: "Debit",
            debit: 250,
            credit: 0,
        },
        {
            accountId: "account-credit",
            description: "Credit",
            debit: 0,
            credit: 250,
        },
    ];

    test("updates entry, replaces its lines and returns the result within a transaction", async () => {
        await repository.update(ENTRY_ID, {
            description: "Replace lines",
            lines,
        });

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);

        expect(tx.journalEntry.update).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            data: { description: "Replace lines" },
        });

        expect(tx.journalEntryLine.deleteMany).toHaveBeenCalledWith({
            where: { journalEntryId: ENTRY_ID },
        });

        expect(tx.journalEntryLine.createMany).toHaveBeenCalledWith({
            data: [
                {
                    journalEntryId: ENTRY_ID,
                    accountId: "account-debit",
                    description: "Debit",
                    debit: 250,
                    credit: 0,
                },
                {
                    journalEntryId: ENTRY_ID,
                    accountId: "account-credit",
                    description: "Credit",
                    debit: 0,
                    credit: 250,
                },
            ],
        });

        expect(tx.journalEntry.findUnique).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            include: repository.getInclude(),
        });
    });

    test("normalizes omitted line descriptions and amounts", async () => {
        await repository.update(ENTRY_ID, {
            lines: [
                { accountId: "account-a" },
                { accountId: "account-b", debit: 50 },
            ],
        });

        expect(tx.journalEntryLine.createMany).toHaveBeenCalledWith({
            data: [
                {
                    journalEntryId: ENTRY_ID,
                    accountId: "account-a",
                    description: null,
                    debit: 0,
                    credit: 0,
                },
                {
                    journalEntryId: ENTRY_ID,
                    accountId: "account-b",
                    description: null,
                    debit: 50,
                    credit: 0,
                },
            ],
        });
    });

    test("reuses an external transaction instead of starting a nested one", async () => {
        const client = {
            journalEntry: {
                update: jest.fn().mockResolvedValue(entry),
                findUnique: jest.fn().mockResolvedValue(entry),
            },
            journalEntryLine: {
                deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
                createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
        };

        await repository.update(ENTRY_ID, { lines }, client);

        expect(client.journalEntry.update).toHaveBeenCalled();
        expect(client.journalEntryLine.deleteMany).toHaveBeenCalled();
        expect(client.journalEntryLine.createMany).toHaveBeenCalled();
        expect(client.journalEntry.findUnique).toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    test("propagates a line-creation error", async () => {
        const failure = new Error("Could not create journal entry lines");
        tx.journalEntryLine.createMany.mockRejectedValueOnce(failure);

        await expect(
            repository.update(ENTRY_ID, { lines })
        ).rejects.toBe(failure);
    });
});

describe("JournalEntryRepository updateStatus", () => {
    test("requires an ID", async () => {
        await expect(repository.updateStatus(null, "POSTED"))
            .rejects.toThrow("Journal entry ID is required");

        expect(prisma.journalEntry.updateMany).not.toHaveBeenCalled();
    });

    test("requires a status", async () => {
        await expect(repository.updateStatus(ENTRY_ID, null))
            .rejects.toThrow("Journal entry status is required");

        expect(prisma.journalEntry.updateMany).not.toHaveBeenCalled();
    });

    test("updates only a DRAFT entry", async () => {
        await repository.updateStatus(ENTRY_ID, "POSTED");

        expect(prisma.journalEntry.updateMany).toHaveBeenCalledWith({
            where: {
                id: ENTRY_ID,
                status: "DRAFT",
            },
            data: { status: "POSTED" },
        });
    });

    test("rejects the transition when no DRAFT row was updated", async () => {
        prisma.journalEntry.updateMany.mockResolvedValueOnce({ count: 0 });

        await expect(repository.updateStatus(ENTRY_ID, "POSTED"))
            .rejects.toThrow("Only DRAFT journal entries can be updated");

        expect(prisma.journalEntry.findUnique).not.toHaveBeenCalled();
    });

    test("rejects unexpected update counts", async () => {
        prisma.journalEntry.updateMany.mockResolvedValueOnce({ count: 2 });

        await expect(repository.updateStatus(ENTRY_ID, "POSTED"))
            .rejects.toThrow("Only DRAFT journal entries can be updated");
    });

    test("returns the updated entry after a successful transition", async () => {
        await expect(repository.updateStatus(ENTRY_ID, "POSTED"))
            .resolves.toEqual(entry);

        expect(prisma.journalEntry.findUnique).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            include: repository.getInclude(),
        });
    });

    test("uses the supplied client for status transition and read-back", async () => {
        const client = {
            journalEntry: {
                updateMany: jest.fn().mockResolvedValue({ count: 1 }),
                findUnique: jest.fn().mockResolvedValue(entry),
            },
        };

        await repository.updateStatus(ENTRY_ID, "POSTED", client);

        expect(client.journalEntry.updateMany).toHaveBeenCalledWith({
            where: { id: ENTRY_ID, status: "DRAFT" },
            data: { status: "POSTED" },
        });

        expect(client.journalEntry.findUnique).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
            include: repository.getInclude(),
        });

        expect(prisma.journalEntry.updateMany).not.toHaveBeenCalled();
    });
});

describe("JournalEntryRepository delete", () => {
    test("deletes by ID", async () => {
        await expect(repository.delete(ENTRY_ID)).resolves.toEqual(entry);

        expect(prisma.journalEntry.delete).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
        });
    });

    test("uses the supplied client", async () => {
        const client = {
            journalEntry: {
                delete: jest.fn().mockResolvedValue(entry),
            },
        };

        await repository.delete(ENTRY_ID, client);

        expect(client.journalEntry.delete).toHaveBeenCalledWith({
            where: { id: ENTRY_ID },
        });

        expect(prisma.journalEntry.delete).not.toHaveBeenCalled();
    });
});
