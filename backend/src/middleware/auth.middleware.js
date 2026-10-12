const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token is required."
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            message: "Access token is required."
        });
    }

    let decoded;

    // 1. Verify token signature and expiration
    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }

    if (!decoded || !decoded.id) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }

    // 2. Load current account state from the database
    try {
        const currentUser = await userRepository.findById(decoded.id);

        // A validly signed token is not sufficient if the account
        // no longer exists.
        if (!currentUser) {
            return res.status(401).json({
                message: "Invalid token"
            });
        }

        // Block inactive and blocked accounts on every authenticated route.
        if (currentUser.status !== "ACTIVE") {
            return next(
                new AppError("User is inactive or blocked.", 403)
            );
        }

        // Database values are authoritative; do not trust stale role claims.
        req.user = {
            ...decoded,
            id: currentUser.id,
            role: currentUser.role,
            status: currentUser.status,
            personId: currentUser.personId
        };

        return next();
    } catch (err) {
        return next(err);
    }
};

module.exports = authMiddleware;
