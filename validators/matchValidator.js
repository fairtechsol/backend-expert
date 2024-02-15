const Joi = require("joi");
const { bettingType } = require("../config/contants");

const bookmakerSchema = Joi.object({
  maxBet: Joi.number().required(),
  marketName: Joi.string().required(),
});

let addMatchSchema = Joi.object({
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
    "string.base": "Match name must be a string",
    "any.required": "Match name is required",
    'any.empty': 'Match name cannot be empty'
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
  teamC: Joi.string().trim().allow("").messages({
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
  betFairSessionMaxBet: Joi.number().greater(Joi.ref("minBet")).required().messages({
      "number.base": "Maximum bet amount for BetFair session must be a number",
      "number.greater":
        "Maximum bet amount for BetFair session must be greater than minimum bet amount",
      "any.required": "Maximum bet amount for BetFair session is required",
    }),
  betFairBookmakerMaxBet: Joi.number().greater(Joi.ref("minBet")).required().messages({
      "number.base":
        "Maximum bet amount for BetFair bookmaker must be a number",
      "number.greater":
        "Maximum bet amount for BetFair bookmaker must be greater than minimum bet amount",
      "any.required": "Maximum bet amount for BetFair bookmaker is required",
    }),
  bookmakers: Joi.array().items(bookmakerSchema).required().messages({
    "array.base": "Bookmakers must be an array",
    "any.required": "Bookmakers are required",
  }),
  marketTiedMatchMaxBet : Joi.number().greater(Joi.ref("minBet")).required().messages({
    "number.base": "Maximum bet amount for market tied match must be a number",
    "number.greater":
      "Maximum bet amount for market tied match must be greater than minimum bet amount",
    "any.required": "Maximum bet amount for market tied match is required",
  }),
  manualTiedMatchMaxBet : Joi.number().greater(Joi.ref("minBet")).required().messages({
    "number.base": "Maximum bet amount for manual tied match must be a number",
    "number.greater":
      "Maximum bet amount for market tied match must be greater than minimum bet amount",
    "any.required": "Maximum bet amount for manual tied match is required",
  }),
  completeMatchMaxBet : Joi.number().greater(Joi.ref("minBet")).required()
  .messages({
    "number.base": "Maximum bet amount for complete match must be a number",
    "number.greater":
      "Maximum bet amount for complete match must be greater than minimum bet amount",
    "any.required": "Maximum bet amount for complete tied match is required",
  }),
  matchOddMarketId : Joi.string().required().messages({
    "string.base": "Match odd market id must be a string",
    "any.required": "Match odd market id is required",
  }),
  marketBookmakerId : Joi.string().required().messages({
    "string.base": "Market bookmaker id must be a string",
    "any.required": "Market bookmaker id is required",
  }),
  tiedMatchMarketId : Joi.string().messages({
    "string.base": "Tied match market id must be a string",
  }),
  completeMatchMarketId : Joi.string().messages({
    "string.base": "Complete match market id must be a string",
  }),
  isManualMatch: Joi.boolean()
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});

// make some condition not required on some condition
module.exports.addMatchValidate = addMatchSchema.when(Joi.object({ isManualMatch: Joi.exist() }).unknown(), {
  then: Joi.object({
      // Define conditional validations when isManualMatch is true
      competitionId: Joi.string().optional().allow(null),
      marketId: Joi.string().optional().allow(null),
      eventId: Joi.string().optional().allow(null),
      matchOddMarketId: Joi.string().optional().allow(null),
      marketBookmakerId: Joi.string().optional().allow(null),
      tiedMatchMarketId: Joi.string().optional().allow(null),
      completeMatchMarketId: Joi.string().optional().allow(null),
      // Other conditional validations...
  }),
  otherwise: Joi.object().unknown(true) // Ensures that other validations are preserved
});

const updatebookmakerSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  maxBet: Joi.number().required()
});

module.exports.updateMatchValidate = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  minBet: Joi.number().messages({
    "number.base": "Minimum bet amount must be a number"
  }),
  matchOddMaxBet: Joi.number().greater(Joi.ref("minBet")).messages({
    "number.base": "Maximum bet odd must be a number",
    "number.greater":
      "Maximum bet amount must be greater than minimum bet amount"
  }),
  betFairSessionMaxBet: Joi.number()
    .greater(Joi.ref("minBet"))
    .messages({
      "number.base": "Maximum bet amount for BetFair session must be a number",
      "number.greater":
        "Maximum bet amount for BetFair session must be greater than minimum bet amount"
    }),
  betFairBookmakerMaxBet: Joi.number()
    .greater(Joi.ref("minBet"))
    .messages({
      "number.base":
        "Maximum bet amount for BetFair bookmaker must be a number",
      "number.greater":
        "Maximum bet amount for BetFair bookmaker must be greater than minimum bet amount"
    }),
  bookmakers: Joi.array().items(updatebookmakerSchema).messages({
    "array.base": "Bookmakers must be an array",
  }),
  marketTiedMatchMaxBet: Joi.number()
  .greater(Joi.ref("minBet"))
  .messages({
    "number.base":
      "Maximum bet amount for market tied match must be a number",
    "number.greater":
      "Maximum bet amount for market tied match must be greater than minimum bet amount"
  }),
  manualTiedMatchMaxBet: Joi.number()
  .greater(Joi.ref("minBet"))
  .messages({
    "number.base":
      "Maximum bet amount for manual tied match must be a number",
    "number.greater":
      "Maximum bet amount for manual tied match must be greater than minimum bet amount"
  }),
  completeMatchMaxBet: Joi.number()
  .greater(Joi.ref("minBet"))
  .messages({
    "number.base":
      "Maximum bet amount for complete match must be a number",
    "number.greater":
      "Maximum bet amount for complete match must be greater than minimum bet amount"
  })  
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});

module.exports.MatchActiveInactive = Joi.object({
  matchId: Joi.string().guid({ version: "uuidv4" }).required(),
  bettingId: Joi.string().guid({ version: "uuidv4" }),
  type: Joi.string()
    .valid(...Object.values(bettingType))
    .required()
    .messages({
      "string.base": "Match betting type must be a string",
      "any.required": "Match betting type is required",
    }),
  isManualBet: Joi.boolean(),
  isActive: Joi.boolean().required(),
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});


module.exports.getMatchSchema = Joi.object({
  id:Joi.string().guid({ version: 'uuidv4' }),
  matchType: Joi.string(),
  competitionId: Joi.string(),
  competitionName: Joi.string(),
  title: Joi.string().required(),
  marketId: Joi.string(),
  eventId: Joi.string(),
  teamA: Joi.string(),
  teamB: Joi.string(),
  teamC: Joi.string().trim().allow(""),
  startAt: Joi.date(),
  betFairSessionMaxBet: Joi.number(),
  betFairSessionMinBet: Joi.number(),
  apiSessionActive: Joi.boolean(),
  manualSessionActive: Joi.boolean(),
  matchOdd: Joi.string().allow(""),
  marketBookmaker: Joi.string().allow(""),
  marketTiedMatch: Joi.string().allow(""), 
  marketCompleteMatch : Joi.string().allow(""),
  stopAt: Joi.date(),   
})