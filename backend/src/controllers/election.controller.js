const electionService = require("../services/election.service");

// ایجاد انتخابات
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

// نمایش همه انتخابات
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

// نتایج انتخابات
const getElectionResults = async (req, res, next) => {
    try {
        const electionId = parseInt(req.params.id);

        const result = await electionService.getElectionResults(electionId);

        return res.json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createElection,
    getElections,
    getElectionResults
};
