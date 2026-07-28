require("dotenv").config();

module.exports = {

    app: {

        name: process.env.APP_NAME || "ShahrakYar",

        env: process.env.NODE_ENV || "development",

        port: parseInt(process.env.PORT, 10) || 5000

    },

    database: {

        url: process.env.DATABASE_URL

    },

    jwt: {

        secret: process.env.JWT_SECRET,

        expiresIn: process.env.JWT_EXPIRE || "7d"

    },

    bcrypt: {

        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10

    }

};