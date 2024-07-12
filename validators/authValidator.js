const Joi = require('joi')

module.exports.Login = Joi.object({
    userName : Joi.string().trim().required(),
    password : Joi.string().required()
})