const errorHandler = (err, req, res) => {
    console.error(err);

    return res.status(err.statusCode || 500).json({
        success: false,

        message: err.message || "Internal Server Error"
    });
};

module.exports = errorHandler;
