"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const repository =
    require("../src/repositories/journalEntry.repository");


function createMockClient(queryRows = [{ id: "entry-1" }]) {

    const calls = {
        queryRaw: []
    };

    const client = {

        $queryRaw: async (queryParts, ...values) => {

            calls.queryRaw.push({
                queryParts: [...queryParts],
                values
            });

            return queryRows;

        }

    };

    return {
        client,
        calls
    };

}


// ======================================================
// Lock Tests
// ======================================================

test("Lock returns true when journal entry exists", async () => {

    const { client, calls } =
        createMockClient();


    const result =
        await repository.lockById(
            "entry-1",
            client
        );


    assert.equal(result, true);

    assert.equal(calls.queryRaw.length, 1);


    const query =
        calls.queryRaw[0].queryParts.join("?");


    assert.match(query, /SELECT\s+"id"/);

    assert.match(query, /FROM\s+"JournalEntry"/);

    assert.match(query, /WHERE\s+"id"\s*=/);

    assert.match(query, /FOR UPDATE/);


    assert.deepEqual(
        calls.queryRaw[0].values,
        ["entry-1"]
    );

});


test("Lock returns false when journal entry does not exist", async () => {

    const { client, calls } =
        createMockClient([]);


    const result =
        await repository.lockById(
            "missing-entry",
            client
        );


    assert.equal(result, false);

    assert.equal(calls.queryRaw.length, 1);

});


test("Lock rejects missing journal entry ID", async () => {

    const { client, calls } =
        createMockClient();


    await assert.rejects(

        repository.lockById(
            "",
            client
        ),

        /Journal entry ID is required/

    );


    assert.equal(calls.queryRaw.length, 0);

});
