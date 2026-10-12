const voteService = require("../services/vote.service");


// ==================================================
// Create Vote
// ==================================================

const createVote = async (req, res, next) => {

    try {

        const vote = await voteService.createVote(
            req.user.id,
            req.body
        );


        return res.status(201).json({

            success: true,

            message: "Vote registered successfully.",

            vote

        });

    } catch (err) {

        next(err);

    }

};


// ==================================================
// Get Election Result
// ==================================================

const getElectionResult = async (req, res, next) => {

    try {

        const result =
            await voteService.getElectionResult(
                req.params.electionId,
                req.user
            );


        return res.status(200).json({

            success: true,

            message: "Election result fetched successfully.",

            result

        });

    } catch (err) {

        next(err);

    }

};


module.exports = {

    createVote,

    getElectionResult

};