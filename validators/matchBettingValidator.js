const Joi = require('joi');
const { matchBettingType, teamStatus } = require('../config/contants');

exports.UpdateMatchBettingRateInSocket = Joi.object({
    id:Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `id should be a type of 'text'`,
        'string.empty': `id cannot be an empty field`,
        'string.guid': `id must be a valid GUID`,
        'any.required': `id is a required field`
    }),
    matchId:Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `matchId should be a type of 'text'`,
        'string.empty': `matchId cannot be an empty field`,
        'string.guid': `matchId must be a valid GUID`,
        'any.required': `matchId is a required field`
    }),
    type: Joi.string().valid(...Object.values(matchBettingType)).required().messages({
        'string.base': `type should be a type of 'text'`,
        'string.empty': `type cannot be an empty field`,
        'any.only': `type must be a valid type`,
        'any.required': `type is a required field`
    }),
    backTeamA : Joi.number().messages({
        'number.base': `backTeamA should be a type of 'number'`,
        'number.empty': `backTeamA cannot be an empty field`,
    }),
    backTeamB : Joi.number().messages({
        'number.base': `backTeamB should be a type of 'number'`,
        'number.empty': `backTeamB cannot be an empty field`,
    }),
    backTeamC : Joi.number().messages({
        'number.base': `backTeamC should be a type of 'number'`,
        'number.empty': `backTeamC cannot be an empty field`,
    }),
    layTeamA : Joi.number().messages({
        'number.base': `layTeamA should be a type of 'number'`,
        'number.empty': `layTeamA cannot be an empty field`,
    }),
    layTeamB : Joi.number().messages({
        'number.base': `layTeamB should be a type of 'number'`,
        'number.empty': `layTeamB cannot be an empty field`,
    }),
    layTeamC : Joi.number().messages({
        'number.base': `layTeamC should be a type of 'number'`,
        'number.empty': `layTeamC cannot be an empty field`,
    }),
    statusTeamA : Joi.string().valid(...Object.values(teamStatus)).required().messages({
        'string.base': `statusTeamA should be a type of 'text'`,
        'string.empty': `statusTeamA cannot be an empty field`,
        'any.only': `statusTeamA must be a valid type`,
    }),
    statusTeamB : Joi.string().valid(...Object.values(teamStatus)).required().messages({
        'string.base': `statusTeamB should be a type of 'text'`,
        'string.empty': `statusTeamB cannot be an empty field`,
        'any.only': `statusTeamB must be a valid type`,
    }),
    statusTeamC : Joi.string().valid(...Object.values(teamStatus)).required().messages({
        'string.base': `statusTeamC should be a type of 'text'`,
        'string.empty': `statusTeamC cannot be an empty field`,
        'any.only': `statusTeamC must be a valid type`,
    }),
  });

  exports.matchBetStatusChangeValidator = Joi.object({
    betId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    }),
    isStop: Joi.boolean().required()
  });
  