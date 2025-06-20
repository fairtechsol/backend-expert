const Joi = require("joi");
const { bettingType, marketBettingTypeByBettingType } = require("../config/contants");

let addMatchSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  matchType: Joi.string().required().messages({
    "string.base": "Match type must be a string",
    "any.required": "Match type is required",
  }),
  competitionId: Joi.string().allow(null).messages({
    "string.base": "Competition ID must be a string",
  }),
  competitionName: Joi.string().allow(null).messages({
    "string.base": "Competition name must be a string",
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
  teamB: Joi.string().trim().allow("").messages({
    "string.base": "Team B must be a string",
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
  betFairSessionMaxBet: Joi.number().min(Joi.ref("minBet")).required().messages({
    "number.base": "Maximum bet amount for BetFair session must be a number",
    "number.min": "Maximum bet amount for BetFair session must be greater than minimum bet amount",
    "any.required": "Maximum bet amount for BetFair session is required",
  }),
  isTv: Joi.boolean().allow(null),
  isFancy: Joi.boolean().allow(null),
  isBookmaker: Joi.boolean().allow(null),
  rateThan100: Joi.boolean().allow(null),
  isManualMatch: Joi.boolean()
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});

// make some condition not required on some condition
module.exports.addMatchValidate = addMatchSchema.when(Joi.object({ isManualMatch: Joi.exist() }).unknown(), {
  then: Joi.object({
    // Define conditional validations when isManualMatch is true
    competitionId: Joi.string().optional().allow(""),
    marketId: Joi.string().optional().allow(""),
    eventId: Joi.string().optional().allow(""),
  }),
  otherwise: Joi.object().unknown(true) // Ensures that other validations are preserved
});

const updatebookmakerSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  maxBet: Joi.number().required(),
  betLimit: Joi.number().allow(null)
});

module.exports.updateMatchValidate = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required(),
  minBet: Joi.number().messages({
    "number.base": "Minimum bet amount must be a number"
  }),
  startAt: Joi.date().allow(null).messages({
    "date.base": "Start date must be a valid date",
  }),
  rateThan100: Joi.boolean().allow(null),
  betFairSessionMaxBet: Joi.number()
    .greater(Joi.ref("minBet"))
    .messages({
      "number.base": "Maximum bet amount for BetFair session must be a number",
      "number.greater":
        "Maximum bet amount for BetFair session must be greater than minimum bet amount"
    }),
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
  id: Joi.string().guid({ version: 'uuidv4' }),
  matchType: Joi.string(),
  competitionId: Joi.string().allow("").allow(null),
  competitionName: Joi.string().allow("").allow(null),
  title: Joi.string().required(),
  rateThan100: Joi.boolean(),
  marketId: Joi.string(),
  eventId: Joi.string(),
  teamA: Joi.string(),
  teamB: Joi.string(),
  teamC: Joi.string().trim().allow(""),
  startAt: Joi.date(),
  betFairSessionMaxBet: Joi.number(),
  betFairSessionMinBet: Joi.number(),
  sessionApiType: Joi.number().allow("").allow(null),
  apiSessionActive: Joi.boolean(),
  manualSessionActive: Joi.boolean(),
  isTv: Joi.boolean(),
  isFancy: Joi.boolean(),
  isBookmaker: Joi.boolean(),
  ...(Object.values(marketBettingTypeByBettingType)?.reduce((prev, curr) => {
    prev[curr] = Joi.string().allow("");
    return prev;
  }, {})),
  stopAt: Joi.date(),
  sessionMaxBets: Joi.object()
})

module.exports.racingAddMatchValidate = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  matchType: Joi.string().required().messages({
    "string.base": "Match type must be a string",
    "any.required": "Match type is required",
  }),
  venue: Joi.string().required().messages({
    "string.base": "Venue must be a string",
    "any.required": "Venue is required",
  }),
  countryCode: Joi.string().required().messages({
    "string.base": "Country Code must be a string",
    "any.required": "Country Code is required",
  }),
  raceType: Joi.string().required().messages({
    "string.base": "Race Type must be a string",
    "any.required": "Race Type is required",
  }),
  title: Joi.string().required().messages({
    "string.base": "Title must be a string",
    "any.required": "Title is required",
  }),
  type: Joi.string().required().messages({
    "string.base": "Type must be a string",
    "any.required": "Type is required",
  }),
  marketId: Joi.string().required().messages({
    "string.base": "Market ID must be a string",
    "any.required": "Market ID is required",
  }),
  eventId: Joi.string().required().messages({
    "string.base": "Event ID must be a string",
    "any.required": "Event ID is required",
  }),
  startAt: Joi.date().required().messages({
    "date.base": "Start date must be a valid date",
    "any.required": "Start date is required",
  }),
  minBet: Joi.number().required().messages({
    "number.base": "Minimum bet amount must be a number",
    "any.required": "Minimum bet amount is required",
  }),
  maxBet: Joi.number().min(Joi.ref('minBet')).required().messages({
    "number.base": "Maximun bet amount must be a number",
    "any.required": "Maximun bet amount is required",
    "number.min": "Maximum bet must be greater than minimum bet",
  }),
  runners: Joi.array().min(1).items(Joi.object({
    selectionId: Joi.number().required(),
    runnerName: Joi.string().required(),
    handicap: Joi.number().required(),
    sortPriority: Joi.number().required(),
    metadata: Joi.object({
      SIRE_NAME: Joi.string().allow(null).optional(),
      CLOTH_NUMBER_ALPHA: Joi.string().allow(null).optional(),
      OFFICIAL_RATING: Joi.string().allow(null).optional(),
      COLOURS_DESCRIPTION: Joi.string().allow(null).optional(),
      COLOURS_FILENAME: Joi.string().allow(null).optional(),
      FORECASTPRICE_DENOMINATOR: Joi.string().allow(null).optional(),
      DAMSIRE_NAME: Joi.string().allow(null).optional(),
      WEIGHT_VALUE: Joi.number().allow(null).optional(),
      SEX_TYPE: Joi.string().allow(null).optional(),
      DAYS_SINCE_LAST_RUN: Joi.number().allow(null).optional(),
      WEARING: Joi.string().allow(null).optional(),
      OWNER_NAME: Joi.string().allow(null).optional(),
      DAM_YEAR_BORN: Joi.string().allow(null).optional(),
      SIRE_BRED: Joi.string().allow(null).optional(),
      JOCKEY_NAME: Joi.string().allow(null).optional(),
      DAM_BRED: Joi.string().allow(null).optional(),
      ADJUSTED_RATING: Joi.string().allow(null).optional(),
      runnerId: Joi.number().allow(null).required(),
      CLOTH_NUMBER: Joi.string().allow(null).optional(),
      SIRE_YEAR_BORN: Joi.string().allow(null).optional(),
      TRAINER_NAME: Joi.string().allow(null).optional(),
      COLOUR_TYPE: Joi.string().allow(null).optional(),
      AGE: Joi.number().allow(null).optional(),
      DAMSIRE_BRED: Joi.string().allow(null).optional(),
      JOCKEY_CLAIM: Joi.string().allow(null).optional(),
      FORM: Joi.string().allow(null).optional(),
      FORECASTPRICE_NUMERATOR: Joi.string().allow(null).optional(),
      BRED: Joi.string().allow(null).optional(),
      DAM_NAME: Joi.string().allow(null).optional(),
      DAMSIRE_YEAR_BORN: Joi.string().allow(null).optional(),
      STALL_DRAW: Joi.string().allow(null).optional(),
      WEIGHT_UNITS: Joi.string().allow(null).optional()
    }).required()
  }))
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});

module.exports.racingUpdateMatchValidate = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }),
  minBet: Joi.number().required().messages({
    "number.base": "Minimum bet amount must be a number",
    "any.required": "Minimum bet amount is required",
  }),
  maxBet: Joi.number().min(Joi.ref('minBet')).required().messages({
    "number.base": "Maximun bet amount must be a number",
    "any.required": "Maximun bet amount is required",
    "number.min": "Maximum bet must be greater than minimum bet",
  })
}).messages({
  "object.base": "Invalid input. Please provide a valid object.",
});
