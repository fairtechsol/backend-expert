const Joi = require("joi");
const { sessionBettingType, teamStatus } = require("../config/contants");

exports.addsessionBettingValidator = Joi.object({
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "string.base": "Match ID must be a string",
        "any.required": "Match ID is required",
    }),
    type: Joi.string().required().valid(...Object.values(sessionBettingType)).messages({
        "string.base": "Session betting type must be a string",
        "any.required": "Session betting type is required",
    }),
    name: Joi.string().required().messages({
        "string.base": "Session betting name must be a string",
        "any.required": "Session betting name is required",
    }),
    minBet: Joi.number().messages({
        "number.base": "Minimum bet amount must be a number",
        "any.required": "Minimum bet amount is required",
    }),
    maxBet: Joi.number().greater(Joi.ref("minBet")).messages({
        "number.base": "Maximum bet amount must be a number",
        "number.greater":
            "Maximum bet amount must be greater than minimum bet amount",
        "any.required": "Maximum bet amount is required",
    }),
    yesRate: Joi.number().messages({
        "number.base": "Yes rate must be a number",
        "any.required": "Yes rate is required",
    }),
    noRate: Joi.number().messages({
        "number.base": "No rate must be a number",
        "any.required": "No rate is required",
    }),
    yesPercent: Joi.number().messages({
        "number.base": "Yes percent must be a number",
        "any.required": "Yes percent is required",
    }),
    noPercent: Joi.number().messages({
        "number.base": "No percent must be a number",
        "any.required": "No percent is required",
    }),
    status: Joi.string().valid(...Object.values(teamStatus)).messages({
        "string.base": "Status must be a string",
        "any.required": "Status is required",
    }),
    selectionId: Joi.string().messages({
        "string.base": "Selection ID must be a string",
    })
});

exports.updateSessionBettingValidator = Joi.object({
    minBet: Joi.number().messages({
        "number.base": "Minimum bet amount must be a number",
        "any.required": "Minimum bet amount is required",
    }),
    maxBet: Joi.number().greater(Joi.ref("minBet")).messages({
        "number.base": "Maximum bet amount must be a number",
        "number.greater":
            "Maximum bet amount must be greater than minimum bet amount",
        "any.required": "Maximum bet amount is required",
    }),
    name: Joi.string().messages({
        "string.base": "Session betting name must be a string",
        "any.required": "Session betting name is required",
    }),
    id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        "string.base": "Match ID must be a string",
        "any.required": "Match ID is required",
    }),
});


exports.UpdateSessionRateInSocket = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `id should be a type of 'text'`,
        'string.empty': `id cannot be an empty field`,
        'string.guid': `id must be a valid GUID`,
        'any.required': `id is a required field`
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `matchId should be a type of 'text'`,
        'string.empty': `matchId cannot be an empty field`,
        'string.guid': `matchId must be a valid GUID`,
        'any.required': `matchId is a required field`
    }),
    yesRate : Joi.number().messages({
        'number.base': `yesRate should be a type of 'number'`,
        'number.empty': `yesRate cannot be an empty field`,
    }),
    noRate : Joi.number().messages({
        'number.base': `noRate should be a type of 'number'`,
        'number.empty': `noRate cannot be an empty field`,
    }),
    yesPercent : Joi.number().messages({
        'number.base': `yesPercent should be a type of 'number'`,
        'number.empty': `yesPercent cannot be an empty field`,
    }),
    noPercent : Joi.number().messages({
        'number.base': `noPercent should be a type of 'number'`,
        'number.empty': `noPercent cannot be an empty field`,
    }),
    status : Joi.string().valid(...Object.values(teamStatus)).required().messages({
        'string.base': `status should be a type of 'text'`,
        'string.empty': `status cannot be an empty field`,
        'any.only': `status must be a valid type`,
    }),
})