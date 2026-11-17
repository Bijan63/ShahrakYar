
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const repository = require("../src/repositories/journalEntry.repository");

function createMockClient(options = {}) {
    const calls = {
        updateMany: [],
        deleteMany: [],
        createMany: [],
        lineDeleteMany: []
    };

const entry = options.entry !== undefined
    ? options.entry
    : {
        id: "entry-1",
        status: "DRAFT",
        description: "Test entry"
    };

    const client = {
        journalEntry: {
            updateMany: async (args) => {
                calls.updateMany.push(args);

                return {
                    count: options.updateCount ?? 1
                };
            },

            deleteMany: async (args) => {
                calls.deleteMany.push(args);

                return {
                    count: options.deleteCount ?? 1
                };
            },

            findUnique: async () => entry
        },

        journalEntryLine: {
            deleteMany: async (args) => {
                calls.lineDeleteMany.push(args);
            },

            createMany: async (args) => {
                calls.createMany.push(args);
            }
        }
    };

    return { client, calls };
}

test("Update allows DRAFT journal entries", async () => {
    const { client, calls } = createMockClient();

    const result = await repository.update(
        "entry-1",
        { description: "Updated" },
        client
    );

    assert.equal(result.status, "DRAFT");
    assert.equal(calls.updateMany.length, 1);
    assert.equal(calls.updateMany[0].where.status, "DRAFT");
});

test("Update rejects non-DRAFT journal entries", async () => {
    const { client } = createMockClient({
        updateCount: 0
    });

    await assert.rejects(
        repository.update(
            "entry-1",
            { description: "Updated" },
            client
        ),
        /Only DRAFT journal entries can be modified/
    );
});

test("Update replaces journal entry lines", async () => {
    const { client, calls } = createMockClient();

    await repository.update(
        "entry-1",
        {
            lines: [
                {
                    accountId: "account-1",
                    debit: 100,
                    credit: 0
                },
                {
                    accountId: "account-2",
                    debit: 0,
                    credit: 100
                }
            ]
        },
        client
    );

    assert.equal(calls.lineDeleteMany.length, 1);
    assert.equal(calls.createMany.length, 1);
    assert.equal(calls.createMany[0].data.length, 2);
});

test("Delete allows DRAFT journal entries", async () => {
    const { client, calls } = createMockClient();

    const result = await repository.delete(
        "entry-1",
        client
    );

    assert.equal(result.status, "DRAFT");
    assert.equal(calls.deleteMany.length, 1);
    assert.equal(calls.deleteMany[0].where.status, "DRAFT");
});

test("Delete rejects POSTED and CANCELLED entries", async () => {
    for (const status of ["POSTED", "CANCELLED"]) {
        const { client } = createMockClient({
            entry: {
                id: "entry-1",
                status
            },
            deleteCount: 0
        });

        await assert.rejects(
            repository.delete("entry-1", client),
            /Only DRAFT journal entries can be deleted/
        );
    }
});

test("Delete rejects missing journal entries", async () => {
    const { client } = createMockClient({
        entry: null
    });

    await assert.rejects(
        repository.delete("missing-entry", client),
        /Journal entry not found/
    );
});
