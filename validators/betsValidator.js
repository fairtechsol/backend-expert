const Joi = require("joi");

exports.sessionDeclareValidator = Joi.object({
  betId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Bet id should be a type of 'text'`,
    "string.empty": `Bet id cannot be an empty field`,
    "string.guid": `Bet id must be a valid GUID`,
    "any.required": `Bet id is a required field`,
  }),
  matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Match id should be a type of 'text'`,
    "string.empty": `Match id cannot be an empty field`,
    "string.guid": `Match id must be a valid GUID`,
    "any.required": `Match id is a required field`,
  }),
  score: Joi.string().required().messages({
    "string.base": `Score should be a type of 'text'`,
    "string.empty": `Score cannot be an empty field`,
  }),
});

exports.sessionDeclareNoResultValidator = Joi.object({
  betId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Bet id should be a type of 'text'`,
    "string.empty": `Bet id cannot be an empty field`,
    "string.guid": `Bet id must be a valid GUID`,
    "any.required": `Bet id is a required field`,
  }),
  matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Match id should be a type of 'text'`,
    "string.empty": `Match id cannot be an empty field`,
    "string.guid": `Match id must be a valid GUID`,
    "any.required": `Match id is a required field`,
  }),
});

exports.sessionUnDeclareValidator = Joi.object({
  betId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Bet id should be a type of 'text'`,
    "string.empty": `Bet id cannot be an empty field`,
    "string.guid": `Bet id must be a valid GUID`,
    "any.required": `Bet id is a required field`,
  }),
  matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Match id should be a type of 'text'`,
    "string.empty": `Match id cannot be an empty field`,
    "string.guid": `Match id must be a valid GUID`,
    "any.required": `Match id is a required field`,
  }),
});

exports.matchDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    }),
    result: Joi.string().required().messages({
      "string.base": `Score should be a type of 'text'`,
      "string.empty": `Score cannot be an empty field`,
    }),
  });

  exports.otherMatchDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    }),
    result: Joi.string().required().messages({
      "string.base": `Score should be a type of 'text'`,
      "string.empty": `Score cannot be an empty field`,
    }),
    betId: Joi.string().guid({ version: "uuidv4" }).messages({
      "string.base": `Bet id should be a type of 'text'`,
      "string.empty": `Bet id cannot be an empty field`,
      "string.guid": `Bet id must be a valid GUID`,
    }),
  });

  exports.raceMatchDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    }),
    result: Joi.string().required().messages({
      "string.base": `Score should be a type of 'text'`,
      "string.empty": `Score cannot be an empty field`,
    }),
    betId: Joi.string().guid({ version: "uuidv4" }).messages({
      "string.base": `Bet id should be a type of 'text'`,
      "string.empty": `Bet id cannot be an empty field`,
      "string.guid": `Bet id must be a valid GUID`,
    }),
  });


  exports.matchUnDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    })
  });

  exports.otherMatchUnDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    }), 
    betId: Joi.string().guid({ version: "uuidv4" }).messages({
      "string.base": `Bet id should be a type of 'text'`,
      "string.empty": `Bet id cannot be an empty field`,
      "string.guid": `Bet id must be a valid GUID`,
    }),
  });

  exports.raceMatchUnDeclareValidator = Joi.object({
    matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
      "string.base": `Match id should be a type of 'text'`,
      "string.empty": `Match id cannot be an empty field`,
      "string.guid": `Match id must be a valid GUID`,
      "any.required": `Match id is a required field`,
    }), 
    betId: Joi.string().guid({ version: "uuidv4" }).messages({
      "string.base": `Bet id should be a type of 'text'`,
      "string.empty": `Bet id cannot be an empty field`,
      "string.guid": `Bet id must be a valid GUID`,
    }),
  });

  
exports.updateDeleteReason = Joi.object({
  deleteReason: Joi.string().required().messages({
    'any.required': 'Delete reason is required',
  }),
  betIds: Joi.array().items(
    Joi.string().guid({ version: 'uuidv4' })
  ).min(1),
  matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
    'any.required': 'Match id is required',
  })
});