class ResponseHelper {

    static success(res, message, data = null, meta = null) {

        return res.json({

            success: true,

            message,

            data,

            meta

        });

    }

    static created(res, message, data = null) {

        return res.status(201).json({

            success: true,

            message,

            data

        });

    }

    static error(res, status, message) {

        return res.status(status).json({

            success: false,

            message

        });

    }

}

module.exports = ResponseHelper;