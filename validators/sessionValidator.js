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