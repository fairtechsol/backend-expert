const Joi = require("joi");

exports.addBlinkTabsValidator = Joi.object({
  matchId: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.base": `Match id id should be a type of 'text'`,
    "string.empty": `Match id cannot be an empty field`,
    "string.guid": `Match id must be a valid GUID`,
    "any.required": `Match id is a required field`,
  }),
  matchName: Joi.string().required().messages({
    "string.base": `Match name should be a type of 'text'`,
    "string.empty": `Match name cannot be an empty field`,
    "any.required": `Match name is a required field`,
  }),
  matchType: Joi.string().required().messages({
    "string.base": `Match type should be a type of 'text'`,
    "string.empty": `Match type cannot be an empty field`,
    "any.required": `Match type is a required field`,
  }),
});