const Joi = require('joi')

module.exports.Login = Joi.object({
    userName : Joi.string().required(),
    password : Joi.string().required()
})