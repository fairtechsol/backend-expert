const Joi = require('joi');

const MAX_SIZE_IN_BYTES = 500 * 1024;
const MAX_BASE64_LENGTH = Math.ceil((MAX_SIZE_IN_BYTES * 4) / 3);

module.exports.notification = Joi.object({
    value : Joi.string().trim().required()
})

module.exports.banner = Joi.object({
    value : Joi.string()
    .base64({ paddingRequired: true })
    .max(MAX_BASE64_LENGTH)
    .required()
    .messages({
        'string.base64': 'The provided string must be in Base64 format.',
        'string.max': `Base64 string must not exceed ${MAX_SIZE_IN_BYTES / 1024} KB.`,
    })
})