const Joi = require('joi');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$@!%&*?])[A-Za-z\d#$@!%&*?]{6,30}$/;

module.exports.CreateUser = Joi.object({
  userName: Joi.string().trim().required(),
  fullName: Joi.string().min(3).max(255),
  password: Joi.string().pattern(passwordRegex).required().label('password').messages({
    'string.pattern.base': 'user.passwordMatch',
    'any.required': 'Password is required',
  }),
  phoneNumber: Joi.string().allow(""),
  city: Joi.string().max(255).allow(""),
  allPrivilege:Joi.boolean(),
  addMatchPrivilege:Joi.boolean(),
  betFairMatchPrivilege:Joi.boolean(),
  bookmakerMatchPrivilege:Joi.boolean(),
  sessionMatchPrivilege:Joi.boolean(),
  createBy:Joi.string().required(),
  id:Joi.string().guid({ version: 'uuidv4' }),
  confirmPassword: Joi.string().required().valid(Joi.ref('password')).label('Confirm Password').messages({
    'string.base': 'Confirm Password must be a string',
    'any.required': 'Confirm Password is required',
    'any.only': 'Confirm Password must match Password',
  }),
})

module.exports.UpdateUser = Joi.object({
  fullName: Joi.string().min(3).max(255),
  phoneNumber: Joi.string().allow(""),
  city: Joi.string().max(255).allow(""),
  allPrivilege:Joi.boolean(),
  addMatchPrivilege:Joi.boolean(),
  betFairMatchPrivilege:Joi.boolean(),
  bookmakerMatchPrivilege:Joi.boolean(),
  sessionMatchPrivilege:Joi.boolean(),
  createBy:Joi.string().required(),
  id:Joi.string().guid({ version: 'uuidv4' })
})

module.exports.ChangeSelfPassword=Joi.object({
  oldPassword:Joi.string(),
  newPassword:Joi.string().pattern(passwordRegex).required().label('password').messages({
      'string.pattern.base': 'user.passwordMatch',
        'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("newPassword"))
    .label("Confirm Password")
    .messages({
      "string.base": "Confirm Password must be a string",
      "any.required": "Confirm Password is required",
      "any.only": "Confirm Password must match new password",
    }),
});

module.exports.ChangePassword=Joi.object({
  id:Joi.string().guid({ version: 'uuidv4' }),
  password:Joi.string().pattern(passwordRegex).required().label('password').messages({
      'string.pattern.base': 'user.passwordMatch',
        'any.required': 'Password is required',
    }),
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref("password"))
    .label("Confirm Password")
    .messages({
      "string.base": "Confirm Password must be a string",
      "any.required": "Confirm Password is required",
      "any.only": "Confirm Password must match password",
    }),
    createBy:Joi.string().required(),
});

