const swaggerJSDoc =
    require("swagger-jsdoc");

const path =
    require("path");


const options = {

    definition: {

        openapi: "3.0.3",


        info: {

            title:
                "ShahrakYar API",

            version:
                "1.0.0",

            description:
                "REST API for ShahrakYar Management System"

        },


        servers: [

            {

                url:
                    "http://localhost:5000"

            }

        ],


        components: {

            // ==================================================
            // Security Schemes
            // ==================================================

            securitySchemes: {

                bearerAuth: {

                    type:
                        "http",

                    scheme:
                        "bearer",

                    bearerFormat:
                        "JWT"

                }

            },


            // ==================================================
            // Schemas
            // ==================================================

            schemas: {


                // ==================================================
                // Account Summary
                // ==================================================

                AccountSummary: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        code: {

                            type:
                                "string",

                            example:
                                "1101"

                        },

                        name: {

                            type:
                                "string",

                            example:
                                "بانک ملت"

                        },

                        type: {

                            type:
                                "string",

                            enum: [

                                "ASSET",
                                "LIABILITY",
                                "EQUITY",
                                "REVENUE",
                                "EXPENSE"

                            ],

                            example:
                                "ASSET"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        isActive: {

                            type:
                                "boolean",

                            example:
                                true

                        },

                        parentId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Fiscal Period Summary
                // ==================================================

                FiscalPeriodSummary: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        code: {

                            type:
                                "string",

                            example:
                                "1405"

                        },

                        name: {

                            type:
                                "string",

                            example:
                                "دوره مالی سال 1405 - اصلاح شده"

                        },

                        startDate: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        endDate: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        status: {

                            type:
                                "string",

                            enum: [

                                "ACTIVE",
                                "INACTIVE",
                                "CLOSED"

                            ],

                            example:
                                "ACTIVE"

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Fund Summary
                // ==================================================

                FundSummary: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        code: {

                            type:
                                "string",

                            example:
                                "OPERATING-1405"

                        },

                        name: {

                            type:
                                "string",

                            example:
                                "صندوق هزینه‌های جاری"

                        },

                        type: {

                            type:
                                "string",

                            example:
                                "OPERATING"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        status: {

                            type:
                                "string",

                            example:
                                "ACTIVE"

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Financial Account
                // ==================================================

                FinancialAccountSummary: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        code: {

                            type:
                                "string",

                            example:
                                "BANK-MELLAT-1405"

                        },

                        name: {

                            type:
                                "string",

                            example:
                                "حساب بانک ملت"

                        },

                        type: {

                            type:
                                "string",

                            enum: [

                                "BANK",
                                "CASH",
                                "POS"

                            ],

                            example:
                                "BANK"

                        },

                        bankName: {

                            type:
                                "string",

                            nullable:
                                true,

                            example:
                                "بانک ملت"

                        },

                        accountNumber: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        cardNumber: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        iban: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        openingBalance: {

                            type:
                                "number",

                            format:
                                "double",

                            example:
                                0

                        },

                        status: {

                            type:
                                "string",

                            example:
                                "ACTIVE"

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        fundId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        accountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        account: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/AccountSummary"

                                }

                            ],

                            nullable:
                                true

                        },

                        fiscalPeriod: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/FiscalPeriodSummary"

                                }

                            ],

                            nullable:
                                true

                        },

                        fund: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/FundSummary"

                                }

                            ],

                            nullable:
                                true

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Create Charge Request
                // ==================================================

                CreateChargeRequest: {

                    type:
                        "object",

                    required: [

                        "unitAccountId",
                        "fiscalPeriodId",
                        "type",
                        "periodYear",
                        "amount",
                        "description"

                    ],

                    properties: {

                        unitAccountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            description:
                                "UUID of the unit financial account.",

                            example:
                                "617c1b21-dc09-4894-a437-3b66ab9501fa"

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            description:
                                "Active fiscal period in which the charge is issued.",

                            example:
                                "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2"

                        },

                        type: {

                            type:
                                "string",

                            enum: [

                                "MONTHLY",
                                "ANNUAL",
                                "SPECIAL",
                                "UTILITY",
                                "OTHER"

                            ],

                            description:
                                "Type of charge.",

                            example:
                                "MONTHLY"

                        },

                        periodYear: {

                            type:
                                "integer",

                            minimum:
                                1300,

                            maximum:
                                1500,

                            description:
                                "Persian fiscal charge year.",

                            example:
                                1405

                        },

                        periodMonth: {

                            type:
                                "integer",

                            minimum:
                                1,

                            maximum:
                                12,

                            nullable:
                                true,

                            description:
                                "Persian charge month. Optional for non-monthly charges.",

                            example:
                                8

                        },

                        amount: {

                            type:
                                "number",

                            format:
                                "double",

                            minimum:
                                0.01,

                            description:
                                "Charge amount.",

                            example:
                                1100000

                        },

                        description: {

                            type:
                                "string",

                            minLength:
                                1,

                            description:
                                "Description of the charge.",

                            example:
                                "شارژ ماهانه مرداد ۱۴۰۵"

                        },

                        issueDate: {

                            type:
                                "string",

                            format:
                                "date-time",

                            nullable:
                                true,

                            description:
                                "Charge issue date. Defaults to current date/time.",

                            example:
                                "2026-09-11T10:03:31.079Z"

                        },

                        dueDate: {

                            type:
                                "string",

                            format:
                                "date-time",

                            nullable:
                                true,

                            description:
                                "Optional due date for payment.",

                            example:
                                "2026-09-20T20:30:00.000Z"

                        }

                    }

                },


                // ==================================================
                // Charge
                // ==================================================

                Charge: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid",

                            example:
                                "9c2fef69-2040-4118-a17f-f7a0f463dd92"

                        },

                        unitAccountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            example:
                                "617c1b21-dc09-4894-a437-3b66ab9501fa"

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            example:
                                "24afbeea-defd-47bf-a56a-9fb0f9b2f0f2"

                        },

                        type: {

                            type:
                                "string",

                            enum: [

                                "MONTHLY",
                                "ANNUAL",
                                "SPECIAL",
                                "UTILITY",
                                "OTHER"

                            ],

                            example:
                                "MONTHLY"

                        },

                        periodYear: {

                            type:
                                "integer",

                            example:
                                1405

                        },

                        periodMonth: {

                            type:
                                "integer",

                            nullable:
                                true,

                            example:
                                8

                        },

                        amount: {

                            type:
                                "number",

                            format:
                                "double",

                            example:
                                1100000

                        },

                        description: {

                            type:
                                "string",

                            example:
                                "تست نهایی پاسخ API صدور شارژ"

                        },

                        issueDate: {

                            type:
                                "string",

                            format:
                                "date-time",

                            example:
                                "2026-09-11T10:03:31.079Z"

                        },

                        dueDate: {

                            type:
                                "string",

                            format:
                                "date-time",

                            nullable:
                                true

                        },

                        status: {

                            type:
                                "string",

                            enum: [

                                "ISSUED",
                                "PARTIALLY_PAID",
                                "PAID",
                                "CANCELLED"

                            ],

                            example:
                                "ISSUED"

                        },

                        unitAccount: {

                            type:
                                "object",

                            nullable:
                                true,

                            description:
                                "Related unit account with unit, building and property information."

                        },

                        payments: {

                            type:
                                "array",

                            items: {

                                type:
                                    "object"

                            }

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Create Charge Response
                // ==================================================

                CreateChargeResponse: {

                    type:
                        "object",

                    required: [

                        "success",
                        "message",
                        "charge",
                        "journalEntry"

                    ],

                    properties: {

                        success: {

                            type:
                                "boolean",

                            example:
                                true

                        },

                        message: {

                            type:
                                "string",

                            example:
                                "Charge created successfully"

                        },

                        charge: {

                            $ref:
                                "#/components/schemas/Charge"

                        },

                        journalEntry: {

                            $ref:
                                "#/components/schemas/JournalEntry"

                        }

                    }

                },


                // ==================================================
                // Create Charge Payment Request
                // ==================================================

                CreateChargePaymentRequest: {

                    type:
                        "object",

                    required: [

                        "unitAccountId",
                        "chargeId",
                        "financialAccountId",
                        "amount"

                    ],

                    properties: {

                        unitAccountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            description:
                                "Unit account UUID",

                            example:
                                "617c1b21-dc09-4894-a437-3b66ab9501fa"

                        },

                        chargeId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            description:
                                "Charge UUID",

                            example:
                                "9971da5a-416c-443f-bd60-8c087d6f1a80"

                        },

                        residentId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true,

                            description:
                                "Optional resident UUID associated with the payment",

                            example:
                                null

                        },

                        financialAccountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            description:
                                "Financial account receiving the payment. Its linked posting account is debited.",

                            example:
                                "a35598b5-4625-4762-a8e5-d5008b577cb9"

                        },

                        amount: {

                            type:
                                "number",

                            format:
                                "double",

                            minimum:
                                0.01,

                            description:
                                "Payment amount",

                            example:
                                3000000

                        },

                        paymentDate: {

                            type:
                                "string",

                            format:
                                "date-time",

                            nullable:
                                true,

                            description:
                                "Payment date. Defaults to the current date/time.",

                            example:
                                "2026-09-11T08:30:45.167Z"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true,

                            description:
                                "Optional payment description",

                            example:
                                "پرداخت شارژ"

                        }

                    }

                },


                // ==================================================
                // Charge Payment Charge
                // ==================================================

                ChargePaymentCharge: {

                    allOf: [

                        {

                            $ref:
                                "#/components/schemas/Charge"

                        }

                    ]

                },


                // ==================================================
                // Journal Entry Line
                // ==================================================

                JournalEntryLine: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        journalEntryId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        accountId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        debit: {

                            type:
                                "number",

                            format:
                                "double",

                            example:
                                3000000

                        },

                        credit: {

                            type:
                                "number",

                            format:
                                "double",

                            example:
                                0

                        },

                        account: {

                            $ref:
                                "#/components/schemas/AccountSummary"

                        }

                    }

                },


                // ==================================================
                // Journal Entry
                // ==================================================

                JournalEntry: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        entryNumber: {

                            type:
                                "string",

                            example:
                                "JV-CHARGE-9c2fef69-2040-4118-a17f-f7a0f463dd92"

                        },

                        entryDate: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        status: {

                            type:
                                "string",

                            enum: [

                                "DRAFT",
                                "POSTED"

                            ],

                            example:
                                "POSTED"

                        },

                        fiscalPeriodId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        fundId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        fiscalPeriod: {

                            $ref:
                                "#/components/schemas/FiscalPeriodSummary"

                        },

                        fund: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/FundSummary"

                                }

                            ],

                            nullable:
                                true

                        },

                        lines: {

                            type:
                                "array",

                            description:
                                "Double-entry accounting lines.",

                            items: {

                                $ref:
                                    "#/components/schemas/JournalEntryLine"

                            }

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        }

                    }

                },


                // ==================================================
                // Charge Payment
                // ==================================================

                ChargePayment: {

                    type:
                        "object",

                    properties: {

                        id: {

                            type:
                                "string",

                            format:
                                "uuid",

                            example:
                                "987dcc29-7352-4f40-be55-00ce1337c144"

                        },

                        unitAccountId: {

                            type:
                                "string",

                            format:
                                "uuid"

                        },

                        chargeId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        residentId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        financialAccountId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        journalEntryId: {

                            type:
                                "string",

                            format:
                                "uuid",

                            nullable:
                                true

                        },

                        amount: {

                            type:
                                "number",

                            format:
                                "double",

                            example:
                                3000000

                        },

                        paymentDate: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        description: {

                            type:
                                "string",

                            nullable:
                                true

                        },

                        createdAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        updatedAt: {

                            type:
                                "string",

                            format:
                                "date-time"

                        },

                        unitAccount: {

                            type:
                                "object",

                            nullable:
                                true,

                            description:
                                "Unit account with related unit, building and property."

                        },

                        charge: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/Charge"

                                }

                            ],

                            nullable:
                                true

                        },

                        resident: {

                            type:
                                "object",

                            nullable:
                                true,

                            description:
                                "Resident associated with the payment, including person information."

                        },

                        financialAccount: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/FinancialAccountSummary"

                                }

                            ],

                            nullable:
                                true

                        },

                        journalEntry: {

                            allOf: [

                                {

                                    $ref:
                                        "#/components/schemas/JournalEntry"

                                }

                            ],

                            nullable:
                                true

                        }

                    }

                },


                // ==================================================
                // Create Charge Payment Response
                // ==================================================

                CreateChargePaymentResponse: {

                    type:
                        "object",

                    properties: {

                        success: {

                            type:
                                "boolean",

                            example:
                                true

                        },

                        message: {

                            type:
                                "string",

                            example:
                                "Charge payment created successfully"

                        },

                        payment: {

                            $ref:
                                "#/components/schemas/ChargePayment"

                        },

                        journalEntry: {

                            $ref:
                                "#/components/schemas/JournalEntry"

                        },

                        charge: {

                            $ref:
                                "#/components/schemas/Charge"

                        }

                    }

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

        path.join(
            __dirname,
            "../routes/*.js"
        )

    ]

};


module.exports =
    swaggerJSDoc(options);