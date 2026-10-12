const candidateService =
    require("../services/candidate.service");


// Create Candidate
const createCandidate = async (req, res, next) => {
    try {
        const candidate =
            await candidateService.createCandidate(
                req.body,
                req.user
            );

        return res.status(201).json({
            success: true,
            candidate
        });
    } catch (err) {
        next(err);
    }
};


// Get Candidates Of Election
const getCandidates = async (req, res, next) => {
    try {
        const candidates =
            await candidateService.getCandidates(
                req.params.electionId,
                req.user
            );

        return res.json({
            success: true,
            candidates
        });
    } catch (err) {
        next(err);
    }
};


// Get Candidate By ID
const getCandidate = async (req, res, next) => {
    try {
        const candidate =
            await candidateService.getCandidate(
                req.params.id,
                req.user
            );

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
        const candidate =
            await candidateService.updateCandidate(
                req.params.id,
                req.body,
                req.user
            );

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
        await candidateService.deleteCandidate(
            req.params.id,
            req.user
        );

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