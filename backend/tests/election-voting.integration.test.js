const request = require("supertest");
const jwt = require("jsonwebtoken");

const config = require("../src/config");
const prisma = require("../src/config/prisma");
const app = require("../src/app");
const { setIO } = require("../src/socket/socket");
const mockSocketIO = { emit: jest.fn() };

const tag = `election-it-${process.pid}-${Date.now()}`;

let complexA;
let complexB;
let admin;
let manager;
let adminToken;
let managerToken;

let propertyA;
let propertyB;
let voterPerson;
let secondVoterPerson;
let candidatePersonA;
let candidatePersonB;

let voterUser;
let secondVoterUser;
let voterToken;
let secondVoterToken;

let caseNumber = 0;
let personCounter = 0;
let propertyCounter = 0;
let electionCounter = 0;

let casePropertyIds = [];
let casePersonIds = [];
let caseUserIds = [];
let caseElectionIds = [];

const allPropertyIds = new Set();
const allPersonIds = new Set();
const allUserIds = new Set();
const allElectionIds = new Set();

function tokenFor(user) {
    return jwt.sign(
        { id: user.id, role: user.role },
        config.jwt.secret,
        { expiresIn: "1h" }
    );
}

function api(token, method, path) {
    const req = request(app)[method](path);

    return token
        ? req.set("Authorization", `Bearer ${token}`)
        : req;
}

function electionDates(startOffset = -60_000, endOffset = 3_600_000) {
    const now = Date.now();

    return {
        startDate: new Date(now + startOffset).toISOString(),
        endDate: new Date(now + endOffset).toISOString(),
    };
}

async function createElection(overrides = {}, token = adminToken) {
    const dates = electionDates();

    const payload = {
        title:
            overrides.title ||
            `${tag}-case-${caseNumber}-election-${++electionCounter}`,
        description: "Integration test election",
        startDate: dates.startDate,
        endDate: dates.endDate,
        complexId: complexA.id,
        ...overrides,
    };

    const response = await api(
        token,
        "post",
        "/api/elections"
    ).send(payload);

    if (response.statusCode === 201 && response.body.election?.id) {
        caseElectionIds.push(response.body.election.id);
        allElectionIds.add(response.body.election.id);
    }

    return response;
}

async function createCandidate(electionId, personId, token = adminToken) {
    return api(token, "post", "/api/candidates").send({
        electionId,
        personId,
        biography: "Integration test candidate",
    });
}

async function openElection(electionId, token = adminToken) {
    return api(
        token,
        "patch",
        `/api/elections/${electionId}/open`
    ).send({});
}

async function closeElection(electionId, token = adminToken) {
    return api(
        token,
        "patch",
        `/api/elections/${electionId}/close`
    ).send({});
}

async function makeProperty(complexId, label) {
    const property = await prisma.property.create({
        data: {
            complexId,
            code: `${tag}-case-${caseNumber}-${label}-${++propertyCounter}`,
            propertyType: "VILLA",
            status: "BUILT",
        },
    });

    casePropertyIds.push(property.id);
    allPropertyIds.add(property.id);

    return property;
}

async function makePerson(label) {
    const number = ++personCounter;

    const person = await prisma.person.create({
        data: {
            firstName: "ElectionTest",
            lastName: `${label}-${number}`,
            mobile: `${tag}-${caseNumber}-${number}`,
            email:
                `${tag}-case-${caseNumber}-person-${number}@example.test`,
        },
    });

    casePersonIds.push(person.id);
    allPersonIds.add(person.id);

    return person;
}

async function makeUser(label, personId = null) {
    const suffix = `${caseNumber}-${caseUserIds.length + 1}-${Date.now()}`;

    const data = {
        fullName: `${tag} ${label}`,
        email: `${tag}-${label}-${suffix}@example.test`,
        password: "test-only-password",
        role: "USER",
        status: "ACTIVE",
    };

    if (personId) {
        data.personId = personId;
    }

    const user = await prisma.user.create({ data });

    caseUserIds.push(user.id);
    allUserIds.add(user.id);

    return user;
}

async function createActiveOwnership(propertyId, personId) {
    return prisma.ownership.create({
        data: {
            propertyId,
            personId,
            percentage: 100,
            startDate: new Date(Date.now() - 120_000),
            endDate: null,
        },
    });
}

async function castVote(token, electionId, candidateId) {
    return api(token, "post", "/api/votes").send({
        electionId,
        candidateId,
    });
}

async function readElection(id) {
    return prisma.election.findUnique({
        where: { id },
    });
}

beforeAll(async () => {
    if (!config.jwt.secret) {
        throw new Error(
            "TEST SETUP FAILED: JWT_SECRET is not configured."
        );
    }

    // Refuse to create any test fixture against the production database.
    const rows = await prisma.$queryRaw`
        SELECT current_database() AS name
    `;

    if (rows[0]?.name !== "shahrakyar_test") {
        throw new Error(
            `TEST SAFETY STOP: expected shahrakyar_test, got ${rows[0]?.name}`
        );
    }

    setIO(mockSocketIO);

    complexA = await prisma.complex.create({
        data: { name: `${tag}-complex-A` },
    });

    complexB = await prisma.complex.create({
        data: { name: `${tag}-complex-B` },
    });

    admin = await prisma.user.create({
        data: {
            fullName: `${tag} Admin`,
            email: `${tag}-admin@example.test`,
            password: "test-only-password",
            role: "ADMIN",
            status: "ACTIVE",
        },
    });
    allUserIds.add(admin.id);

    manager = await prisma.user.create({
        data: {
            fullName: `${tag} Manager`,
            email: `${tag}-manager@example.test`,
            password: "test-only-password",
            role: "MANAGER",
            status: "ACTIVE",
        },
    });
    allUserIds.add(manager.id);

    await prisma.complexManager.create({
        data: {
            userId: manager.id,
            complexId: complexA.id,
        },
    });

    adminToken = tokenFor(admin);
    managerToken = tokenFor(manager);
});

beforeEach(async () => {
    mockSocketIO.emit.mockClear();
    caseNumber += 1;
    casePropertyIds = [];
    casePersonIds = [];
    caseUserIds = [];
    caseElectionIds = [];

    propertyA = await makeProperty(complexA.id, "A");
    propertyB = await makeProperty(complexB.id, "B");

    voterPerson = await makePerson("VoterA");
    secondVoterPerson = await makePerson("VoterB");
    candidatePersonA = await makePerson("CandidateA");
    candidatePersonB = await makePerson("CandidateB");

    voterUser = await makeUser("voter-a", voterPerson.id);
    secondVoterUser = await makeUser("voter-b", secondVoterPerson.id);

    voterToken = tokenFor(voterUser);
    secondVoterToken = tokenFor(secondVoterUser);
});

afterEach(async () => {
    if (caseElectionIds.length > 0) {
        // Election deletion cascades to its candidates and votes.
        await prisma.election.deleteMany({
            where: { id: { in: caseElectionIds } },
        });
    }

    if (casePropertyIds.length > 0) {
        await prisma.ownership.deleteMany({
            where: { propertyId: { in: casePropertyIds } },
        });
    }

    if (caseUserIds.length > 0) {
        await prisma.user.deleteMany({
            where: { id: { in: caseUserIds } },
        });
    }

    if (casePropertyIds.length > 0) {
        await prisma.property.deleteMany({
            where: { id: { in: casePropertyIds } },
        });
    }

    if (casePersonIds.length > 0) {
        await prisma.person.deleteMany({
            where: { id: { in: casePersonIds } },
        });
    }
});

afterAll(async () => {
    try {
        const allElectionIdList = [...allElectionIds];
        const allPropertyIdList = [...allPropertyIds];
        const allUserIdList = [...allUserIds];
        const allPersonIdList = [...allPersonIds];

        if (allElectionIdList.length > 0) {
            await prisma.election.deleteMany({
                where: { id: { in: allElectionIdList } },
            });
        }

        if (allPropertyIdList.length > 0) {
            await prisma.ownership.deleteMany({
                where: { propertyId: { in: allPropertyIdList } },
            });
        }

        await prisma.complexManager.deleteMany({
            where: {
                complexId: {
                    in: [complexA?.id, complexB?.id].filter(Boolean),
                },
            },
        });

        if (allUserIdList.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: allUserIdList } },
            });
        }

        if (allPropertyIdList.length > 0) {
            await prisma.property.deleteMany({
                where: { id: { in: allPropertyIdList } },
            });
        }

        if (allPersonIdList.length > 0) {
            await prisma.person.deleteMany({
                where: { id: { in: allPersonIdList } },
            });
        }

        const complexIds = [complexA?.id, complexB?.id].filter(Boolean);

        if (complexIds.length > 0) {
            await prisma.complex.deleteMany({
                where: { id: { in: complexIds } },
            });
        }

        const globalUserIds = [admin?.id, manager?.id].filter(Boolean);

        if (globalUserIds.length > 0) {
            await prisma.user.deleteMany({
                where: { id: { in: globalUserIds } },
            });
        }
    } finally {
        await prisma.$disconnect();
    }
});

describe("Election, Candidate and Vote integration tests", () => {
    test("requires authentication to list elections", async () => {
        const response = await request(app).get("/api/elections");

        expect(response.statusCode).toBe(401);
    });

    test("rejects election creation without complexId", async () => {
        const dates = electionDates();

        const response = await api(
            adminToken,
            "post",
            "/api/elections"
        ).send({
            title: "Missing complex test",
            startDate: dates.startDate,
            endDate: dates.endDate,
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

    test("rejects an election whose end date is not after its start date", async () => {
        const now = Date.now();

        const response = await api(
            adminToken,
            "post",
            "/api/elections"
        ).send({
            title: "Invalid date test",
            complexId: complexA.id,
            startDate: new Date(now + 20_000).toISOString(),
            endDate: new Date(now + 10_000).toISOString(),
        });

        expect(response.statusCode).toBe(400);
    });

    test("creates a DRAFT election and persists it", async () => {
        const response = await createElection();

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.election.status).toBe("DRAFT");

        const saved = await readElection(response.body.election.id);

        expect(saved).not.toBeNull();
        expect(saved.complexId).toBe(complexA.id);
        expect(saved.status).toBe("DRAFT");
    });

    test("allows a MANAGER to create an election in an assigned complex", async () => {
        const response = await createElection(
            { complexId: complexA.id },
            managerToken
        );

        expect(response.statusCode).toBe(201);
        expect(response.body.election.complexId).toBe(complexA.id);
    });

    test("denies a MANAGER from creating an election in an unassigned complex", async () => {
        const response = await createElection(
            { complexId: complexB.id },
            managerToken
        );

        expect(response.statusCode).toBe(403);
    });

    test("prevents a MANAGER from opening an election through the API route", async () => {
        const created = await createElection();
        expect(created.statusCode).toBe(201);

        const response = await openElection(
            created.body.election.id,
            managerToken
        );

        expect(response.statusCode).toBe(403);

        const saved = await readElection(created.body.election.id);
        expect(saved.status).toBe("DRAFT");
    });

    test("allows ADMIN to open a DRAFT election and rejects opening it twice", async () => {
        const created = await createElection();
        expect(created.statusCode).toBe(201);

        const electionId = created.body.election.id;

        const opened = await openElection(electionId);
        expect(opened.statusCode).toBe(200);

        const saved = await readElection(electionId);
        expect(saved.status).toBe("OPEN");

        const repeated = await openElection(electionId);
        expect(repeated.statusCode).toBe(409);
    });

    test("does not allow closing an election while it is still DRAFT", async () => {
        const created = await createElection();
        expect(created.statusCode).toBe(201);

        const response = await closeElection(
            created.body.election.id
        );

        expect(response.statusCode).toBe(409);

        const saved = await readElection(created.body.election.id);
        expect(saved.status).toBe("DRAFT");
    });

    test("allows closing an OPEN election and prevents reopening a CLOSED election", async () => {
        const created = await createElection();
        expect(created.statusCode).toBe(201);

        const electionId = created.body.election.id;

        expect((await openElection(electionId)).statusCode).toBe(200);
        expect((await closeElection(electionId)).statusCode).toBe(200);

        const saved = await readElection(electionId);
        expect(saved.status).toBe("CLOSED");

        const reopened = await openElection(electionId);
        expect(reopened.statusCode).toBe(409);

        const unchanged = await readElection(electionId);
        expect(unchanged.status).toBe("CLOSED");
    });

    test("rejects duplicate candidates in one election", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const first = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(first.statusCode).toBe(201);

        const duplicate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(duplicate.statusCode).toBe(409);

        const count = await prisma.candidate.count({
            where: {
                electionId,
                personId: candidatePersonA.id,
            },
        });

        expect(count).toBe(1);
    });

    test("freezes candidate creation after an election opens", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        expect(
            (await createCandidate(electionId, candidatePersonA.id))
                .statusCode
        ).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        const response = await createCandidate(
            electionId,
            candidatePersonB.id
        );

        expect(response.statusCode).toBe(409);

        const count = await prisma.candidate.count({
            where: { electionId },
        });

        expect(count).toBe(1);
    });

    test("updates candidate biography and rejects an empty update", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const response = await createCandidate(
            election.body.election.id,
            candidatePersonA.id
        );

        expect(response.statusCode).toBe(201);

        const candidateId = response.body.candidate.id;

        const updated = await api(
            adminToken,
            "put",
            `/api/candidates/${candidateId}`
        ).send({ biography: "Updated integration biography" });

        expect(updated.statusCode).toBe(200);

        const saved = await prisma.candidate.findUnique({
            where: { id: candidateId },
        });

        expect(saved.biography).toBe("Updated integration biography");

        const empty = await api(
            adminToken,
            "put",
            `/api/candidates/${candidateId}`
        ).send({});

        expect(empty.statusCode).toBe(400);
    });

    test("denies a MANAGER from deleting a candidate because the route is ADMIN-only", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const response = await createCandidate(
            election.body.election.id,
            candidatePersonA.id
        );

        expect(response.statusCode).toBe(201);

        const candidateId = response.body.candidate.id;

        const deletion = await api(
            managerToken,
            "delete",
            `/api/candidates/${candidateId}`
        );

        expect(deletion.statusCode).toBe(403);

        expect(
            await prisma.candidate.findUnique({
                where: { id: candidateId },
            })
        ).not.toBeNull();
    });

    test("registers a vote for an active owner and persists it", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        const saved = await prisma.vote.findUnique({
            where: {
                electionId_voterId: {
                    electionId,
                    voterId: voterPerson.id,
                },
            },
        });

        expect(saved).not.toBeNull();
        expect(saved.candidateId).toBe(candidate.body.candidate.id);

        expect(mockSocketIO.emit).toHaveBeenCalledTimes(1);
        expect(mockSocketIO.emit).toHaveBeenCalledWith(
            "vote-created",
            expect.objectContaining({
                electionId,
                candidateId: candidate.body.candidate.id,
                voterId: voterPerson.id,
            })
        );
    });

    test("rejects a second vote by the same person in the same election", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const first = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(first.statusCode).toBe(201);

        const second = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(second.statusCode).toBe(409);

        const count = await prisma.vote.count({
            where: {
                electionId,
                voterId: voterPerson.id,
            },
        });

        expect(count).toBe(1);
    });

    test("denies voting when the person has no active ownership in the election complex", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        const response = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(403);

        expect(
            await prisma.vote.count({ where: { electionId } })
        ).toBe(0);
    });

    test("does not accept votes while an election remains DRAFT", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(400);

        expect(
            await prisma.vote.count({ where: { electionId } })
        ).toBe(0);
    });

    test("rejects a vote outside the election date window even if status is OPEN", async () => {
        const dates = electionDates(3_600_000, 7_200_000);

        const election = await createElection(dates);
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/not currently open by date/i);

        expect(
            await prisma.vote.count({ where: { electionId } })
        ).toBe(0);
    });

    test("rejects voting for a candidate from another election", async () => {
        const electionA = await createElection();
        const electionB = await createElection();

        expect(electionA.statusCode).toBe(201);
        expect(electionB.statusCode).toBe(201);

        const candidateB = await createCandidate(
            electionB.body.election.id,
            candidatePersonB.id
        );
        expect(candidateB.statusCode).toBe(201);

        const electionId = electionA.body.election.id;

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await castVote(
            voterToken,
            electionId,
            candidateB.body.candidate.id
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(
            /does not belong to this election/i
        );
    });

    test("denies voting when the linked Person is inactive", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        await prisma.person.update({
            where: { id: voterPerson.id },
            data: { status: "INACTIVE" },
        });

        const response = await castVote(
            voterToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(403);
        expect(
            await prisma.vote.count({ where: { electionId } })
        ).toBe(0);
    });

    test("rejects a USER account that is not linked to a Person", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        const unlinkedUser = await makeUser("unlinked-user");
        const unlinkedToken = tokenFor(unlinkedUser);

        const response = await castVote(
            unlinkedToken,
            electionId,
            candidate.body.candidate.id
        );

        expect(response.statusCode).toBe(400);
        expect(response.body.message).toMatch(/not linked to a Person/i);
    });

    test("does not allow deleting a candidate after votes have been cast", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );
        expect(candidate.statusCode).toBe(201);

        const candidateId = candidate.body.candidate.id;

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const vote = await castVote(
            voterToken,
            electionId,
            candidateId
        );

        expect(vote.statusCode).toBe(201);

        const deletion = await api(
            adminToken,
            "delete",
            `/api/candidates/${candidateId}`
        );

        expect(deletion.statusCode).toBe(409);

        expect(
            await prisma.candidate.findUnique({
                where: { id: candidateId },
            })
        ).not.toBeNull();
    });

    test("returns accurate vote counts for each candidate", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidateA = await createCandidate(
            electionId,
            candidatePersonA.id
        );

        const candidateB = await createCandidate(
            electionId,
            candidatePersonB.id
        );

        expect(candidateA.statusCode).toBe(201);
        expect(candidateB.statusCode).toBe(201);

        expect((await openElection(electionId)).statusCode).toBe(200);

        await createActiveOwnership(propertyA.id, voterPerson.id);
        await createActiveOwnership(propertyA.id, secondVoterPerson.id);

        const voteA = await castVote(
            voterToken,
            electionId,
            candidateA.body.candidate.id
        );

        const voteB = await castVote(
            secondVoterToken,
            electionId,
            candidateB.body.candidate.id
        );

        expect(voteA.statusCode).toBe(201);
        expect(voteB.statusCode).toBe(201);

        const response = await api(
            managerToken,
            "get",
            `/api/votes/election/${electionId}/result`
        );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.result)).toBe(true);

        const counts = Object.fromEntries(
            response.body.result.map((candidate) => [
                candidate.id,
                candidate._count.votes,
            ])
        );

        expect(counts[candidateA.body.candidate.id]).toBe(1);
        expect(counts[candidateB.body.candidate.id]).toBe(1);
    });
    test("denies USER access to election details in an unowned complex", async () => {
        const election = await createElection({
            complexId: complexB.id,
        });

        expect(election.statusCode).toBe(201);

        // The USER owns a property in complexA, not complexB.
        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await api(
            voterToken,
            "get",
            `/api/elections/${election.body.election.id}`
        );

        expect(response.statusCode).toBe(404);
    });

    test("denies USER access to candidates in an unowned complex", async () => {
        const election = await createElection({
            complexId: complexB.id,
        });

        expect(election.statusCode).toBe(201);

        const candidate = await createCandidate(
            election.body.election.id,
            candidatePersonA.id
        );

        expect(candidate.statusCode).toBe(201);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await api(
            voterToken,
            "get",
            `/api/candidates/election/${election.body.election.id}`
        );

        expect(response.statusCode).toBe(404);
    });

    test("denies USER access to an individual candidate in an unowned complex", async () => {
        const election = await createElection({
            complexId: complexB.id,
        });

        expect(election.statusCode).toBe(201);

        const candidate = await createCandidate(
            election.body.election.id,
            candidatePersonA.id
        );

        expect(candidate.statusCode).toBe(201);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await api(
            voterToken,
            "get",
            `/api/candidates/${candidate.body.candidate.id}`
        );

        expect(response.statusCode).toBe(404);
    });

    test("denies MANAGER access to results in an unassigned complex", async () => {
        const election = await createElection({
            complexId: complexB.id,
        });

        expect(election.statusCode).toBe(201);

        const electionId = election.body.election.id;

        const candidate = await createCandidate(
            electionId,
            candidatePersonA.id
        );

        expect(candidate.statusCode).toBe(201);

        const opened = await openElection(electionId);
        expect(opened.statusCode).toBe(200);

        // Verify both exposed result endpoints.
        const voteResultResponse = await api(
            managerToken,
            "get",
            `/api/votes/election/${electionId}/result`
        );

        expect(voteResultResponse.statusCode).toBe(404);

        const electionResultResponse = await api(
            managerToken,
            "get",
            `/api/elections/${electionId}/result`
        );

        expect(electionResultResponse.statusCode).toBe(404);
    });
    test("limits a USER election list to complexes where the person has active ownership", async () => {
        const electionA = await createElection({
            title: `${tag}-accessible-election`,
            complexId: complexA.id,
        });

        const electionB = await createElection({
            title: `${tag}-inaccessible-election`,
            complexId: complexB.id,
        });

        expect(electionA.statusCode).toBe(201);
        expect(electionB.statusCode).toBe(201);

        await createActiveOwnership(propertyA.id, voterPerson.id);

        const response = await api(
            voterToken,
            "get",
            "/api/elections"
        );

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.elections)).toBe(true);

        const returnedIds = response.body.elections.map(
            (election) => election.id
        );

        expect(returnedIds).toContain(electionA.body.election.id);
        expect(returnedIds).not.toContain(electionB.body.election.id);
    });

    test("denies USER access to the election result endpoint", async () => {
        const election = await createElection();
        expect(election.statusCode).toBe(201);

        const response = await api(
            voterToken,
            "get",
            `/api/votes/election/${election.body.election.id}/result`
        );

        expect(response.statusCode).toBe(403);
    });
});
