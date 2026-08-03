const electionService = require("../services/election.service");

const createElection = async (req, res, next) => {
    try {
        const election = await electionService.createElection(req.body);

        return res.status(201).json({
            success: true,

            election
        });
    } catch (err) {
        next(err);
    }
};

const getElection = async (req, res, next) => {
    try {
        const election = await electionService.getElection(req.params.id);

        return res.json({
            success: true,

            election
        });
    } catch (err) {
        next(err);
    }
};

const getElections = async (req, res, next) => {
    try {
        const elections = await electionService.getElections();

        return res.json({
            success: true,

            elections
        });
    } catch (err) {
        next(err);
    }
};

const openElection = async (req, res, next) => {
    try {
        const election = await electionService.openElection(req.params.id);

        return res.json({
            success: true,

            message: "Election opened successfully.",

            election
        });
    } catch (err) {
        next(err);
    }
};

const closeElection = async (req, res, next) => {
    try {
        const election = await electionService.closeElection(req.params.id);

        return res.json({
            success: true,

            message: "Election closed successfully.",

            election
        });
    } catch (err) {
        next(err);
    }
};

const getResult = async (req, res, next) => {
    try {
        const result = await electionService.getResult(req.params.id);

        return res.json({
            success: true,

            result
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createElection,

    getElection,

    getElections,

    openElection,

    closeElection,

    getResult
};
