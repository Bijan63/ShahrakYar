const swaggerJSDoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "ShahrakYar API",

            version: "1.0.0",

            description: "REST API for ShahrakYar Management System"
        },

        servers: [
            {
                url: "http://localhost:5000"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",

                    scheme: "bearer",

                    bearerFormat: "JWT"
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ]
    },

    apis: ["./src/routes/*.js"]
};

module.exports = swaggerJSDoc(options);
