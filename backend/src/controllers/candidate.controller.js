
const candidateService = require("../services/candidate.service");

const createCandidate = async (req, res, next) => {

    try {

        const candidate = await candidateService.createCandidate(
            req.body
        );

        return res.status(201).json({
            success: true,
            candidate
        });

    } catch (err) {

        next(err);

    }

};

const getCandidates = async (req, res, next) => {

    try {

        const electionId = parseInt(req.params.electionId);

        const candidates = await candidateService.getCandidates(
            electionId
        );

        return res.json({
            success: true,
            candidates
        });

    } catch (err) {

        next(err);

    }

};

module.exports = {
    createCandidate,
    getCandidates
};
