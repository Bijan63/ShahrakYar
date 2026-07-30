const voteService = require("../services/vote.service");

const createVote = async (req, res, next) => {
    try {
        const vote = await voteService.createVote(req.user, req.body);

        return res.status(201).json({
            success: true,
            message: "Vote registered successfully.",
            vote
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createVote
};
