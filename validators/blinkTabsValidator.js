const Joi = require("joi");

exports.addBlinkTabsValidator = Joi.object({
    id: Joi.string().guid({ version: "uuidv4" }).messages({
        "string.base": `ID should be a type of 'text'`,
        "string.guid": `ID must be a valid GUID`,
    }),
    
    // Using alternatives().conditional() to check if id is present or not
    matchId: Joi.alternatives().conditional('id', {
        is: Joi.exist(), // if id exists
        then: Joi.forbidden(), // disallow matchId
        otherwise: Joi.string().guid({ version: "uuidv4" }).required().messages({
            "string.base": `Match ID should be a type of 'text'`,
            "string.empty": `Match ID cannot be an empty field`,
            "string.guid": `Match ID must be a valid GUID`,
            "any.required": `Match ID is a required field`,
        })
    }),
    
    matchName: Joi.alternatives().conditional('id', {
        is: Joi.exist(), // if id exists
        then: Joi.forbidden(), // disallow matchName
        otherwise: Joi.string().required().messages({
            "string.base": `Match name should be a type of 'text'`,
            "string.empty": `Match name cannot be an empty field`,
            "any.required": `Match name is a required field`,
        })
    }),
    
    matchType: Joi.alternatives().conditional('id', {
        is: Joi.exist(), // if id exists
        then: Joi.forbidden(), // disallow matchType
        otherwise: Joi.string().required().messages({
            "string.base": `Match type should be a type of 'text'`,
            "string.empty": `Match type cannot be an empty field`,
            "any.required": `Match type is a required field`,
        })
    }),
    
    order: Joi.number().required().messages({
        "any.required": `Order is a required field`,
    })
});
