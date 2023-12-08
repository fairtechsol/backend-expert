const Joi = require("joi");

const bookmakerSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  maxBet: Joi.number().required(),
  marketName: Joi.string().required(),
});

module.exports.addMatch = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  matchType: Joi.string().required().messages({
    "string.base": "Match type must be a string",
    "any.required": "Match type is required",
  }),
  competitionId: Joi.string().required().messages({
    "string.base": "Competition ID must be a string",
    "any.required": "Competition ID is required",
  }),
  competitionName: Joi.string().required().messages({
    "string.base": "Competition name must be a string",
    "any.required": "Competition name is required",
  }),
  title: Joi.string().required().messages({
    "string.base": "Title must be a string",
    "any.required": "Title is required",
  }),
  marketId: Joi.string().required().messages({
    "string.base": "Market ID must be a string",
    "any.required": "Market ID is required",
  }),
  eventId: Joi.string().required().messages({
    "string.base": "Event ID must be a string",
    "any.required": "Event ID is required",
  }),
  teamA: Joi.string().required().messages({
    "string.base": "Team A must be a string",
    "any.required": "Team A is required",
  }),
  teamB: Joi.string().required().messages({
    "string.base": "Team B must be a string",
    "any.required": "Team B is required",
  }),
  teamC: Joi.string().messages({
    "string.base": "Team C must be a string",
  }),
  startAt: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  minBet: Joi.number().required().messages({
    "number.base": "Minimum bet amount must be a number",
    "any.required": "Minimum bet amount is required",
  }),
  matchOddMaxBet: Joi.number().greater(Joi.ref("minBet")).required().messages({
    "number.base": "Maximum bet odd must be a number",
    "number.greater":
      "Maximum bet amount must be greater than minimum bet amount",
    "any.required": "Maximum bet odd is required",
  }),
  betFairSessionMaxBet: Joi.number()
    .greater(Joi.ref("minBet"))
    .required()
    .messages({
      "number.base": "Maximum bet amount for BetFair session must be a number",
      "number.greater":
        "Maximum bet amount for BetFair session must be greater than minimum bet amount",
      "any.required": "Maximum bet amount for BetFair session is required",
    }),
  betFairBookmakerMaxBet: Joi.number()
    .greater(Joi.ref("minBet"))
    .required()
    .messages({
      "number.base":
        "Maximum bet amount for BetFair bookmaker must be a number",
      "number.greater":
        "Maximum bet amount for BetFair bookmaker must be greater than minimum bet amount",
      "any.required": "Maximum bet amount for BetFair bookmaker is required",
    }),
  delaySecond: Joi.number().required().messages({
    "number.base": "Delay seconds must be a number",
    "any.required": "Delay seconds is required",
  }),
  bookmakers: Joi.array().items(bookmakerSchema).required().messages({
    "array.base": "Bookmakers must be an array",
    "any.required": "Bookmakers are required",
  }),
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});
