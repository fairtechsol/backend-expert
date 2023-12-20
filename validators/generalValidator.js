const Joi = require('joi');

module.exports.notification = Joi.object({
    value : Joi.string().trim().required()
})