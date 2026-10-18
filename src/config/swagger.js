const swaggerJSDoc = require("swagger-jsdoc");


const options = {

    definition: {

        openapi: "3.0.3",

        info: {

            title: "ShahrakYar Finance API",

            version: "1.0.0",

            description:
                "Finance Backend API for ShahrakYar"

        },

        servers: [

            {
                url: "http://localhost:5100",
                description: "Finance Backend"
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

    apis: [

        "./src/routes/*.js"

    ]

};


const swaggerSpec =
    swaggerJSDoc(options);


module.exports =
    swaggerSpec;