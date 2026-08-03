const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,

    {
        files: ["**/*.js"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                ...globals.node
            }
        },

        rules: {
            semi: ["error", "always"],

            quotes: ["error", "double"],

            indent: ["error", 4],

            "no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_"
                }
            ],

            "no-console": "off",

            eqeqeq: "error",

            curly: "error"
        }
    },

    {
        files: ["tests/**/*.js"],

        languageOptions: {
            globals: {
                ...globals.jest
            }
        }
    }
];
