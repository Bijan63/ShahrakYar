const candidateService = require("../services/candidate.service");

// Create Candidate
const createCandidate = async (req, res, next) => {
    try {
        const candidate = await candidateService.createCandidate(req.body);

        return res.status(201).json({
            success: true,
            candidate
        });
    } catch (err) {
        next(err);
    }
};

// Get All Candidates
const getCandidates = async (req, res, next) => {
    try {
        const electionId = parseInt(req.params.electionId);

        const candidates = await candidateService.getCandidates(electionId);

        return res.json({
            success: true,
            candidates
        });
    } catch (err) {
        next(err);
    }
};

// Get Candidate By Id
const getCandidate = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);

        const candidate = await candidateService.getCandidate(id);

        return res.json({
            success: true,
            candidate
        });
    } catch (err) {
        next(err);
    }
};

// Update Candidate
const updateCandidate = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);

        const candidate = await candidateService.updateCandidate(id, req.body);

        return res.json({
            success: true,
            candidate
        });
    } catch (err) {
        next(err);
    }
};

// Delete Candidate
const deleteCandidate = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);

        await candidateService.deleteCandidate(id);

        return res.json({
            success: true,
            message: "Candidate deleted successfully."
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createCandidate,
    getCandidates,
    getCandidate,
    updateCandidate,
    deleteCandidate
};
