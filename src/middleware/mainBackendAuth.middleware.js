const MAIN_BACKEND_URL = (
    process.env.MAIN_BACKEND_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const VALID_ROLES = new Set([
    "ADMIN",
    "MANAGER",
    "USER",
]);

module.exports = async function mainBackendAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Access token is required.",
        });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token is required.",
        });
    }

    let response;

    try {
        response = await fetch(
            `${MAIN_BACKEND_URL}/api/users/profile`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(5000),
            }
        );
    } catch {
        return res.status(503).json({
            success: false,
            message: "Authentication service unavailable.",
        });
    }

    let payload;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (response.status === 401) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token.",
        });
    }

    if (response.status === 403) {
        return res.status(403).json({
            success: false,
            message: "User account is inactive or access is denied.",
        });
    }

    if (!response.ok) {
        return res.status(503).json({
            success: false,
            message: "Unable to validate access token.",
        });
    }

    const user = payload && payload.user;

    if (
        !payload ||
        payload.success !== true ||
        !user ||
        !user.id ||
        !VALID_ROLES.has(user.role)
    ) {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication response.",
        });
    }

    req.user = {
        id: user.id,
        role: user.role,
        personId: user.personId ?? null,
        fullName: user.fullName,
        email: user.email,
    };

    return next();
};
