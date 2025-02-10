const Joi = require('joi');
const { matchBettingType, teamStatus, gameTypeMatchBetting, manualMatchBettingType } = require('../config/contants');

exports.UpdateMatchBettingRateInSocket = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `id should be a type of 'text'`,
        'string.empty': `id cannot be an empty field`,
        'string.guid': `id must be a valid GUID`,
        'any.required': `id is a required field`
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `matchId should be a type of 'text'`,
        'string.empty': `matchId cannot be an empty field`,
        'string.guid': `matchId must be a valid GUID`,
        'any.required': `matchId is a required field`
    }),
    teams: Joi.array().items(Joi.object({
        back: Joi.number().messages({
            'number.base': `back should be a type of 'number'`,
            'number.empty': `back cannot be an empty field`,
        }),
        lay: Joi.number().messages({
            'number.base': `lay should be a type of 'number'`,
            'number.empty': `lay cannot be an empty field`,
        }),
        status: Joi.string().valid(...Object.values(teamStatus)).required().messages({
            'string.base': `status should be a type of 'text'`,
            'string.empty': `status cannot be an empty field`,
            'any.only': `status must be a valid type`,
        }),
        id: Joi.string().guid({ version: 'uuidv4' }).required().messages({
            'string.base': `Id should be a type of 'text'`,
            'string.empty': `Id cannot be an empty field`,
            'string.guid': `Id must be a valid GUID`,
            'any.required': `Id is a required field`
        })
    }))

});

exports.matchBetStatusChangeValidator = Joi.object({
    betId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    }),
    isStop: Joi.boolean().required(),
    isManual: Joi.boolean().required(),
    isTournament: Joi.boolean()
});

exports.raceBetStatusChangeValidator = Joi.object({
    betId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    }),
    isStop: Joi.boolean().required(),
});

exports.matchBetApiChangeValidator = Joi.object({
    betIds: Joi.array().min(1).items(Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    })).required().messages({
        'any.required': `Bet id is required`,
        'any.min': `Send atleast one bet id.`,
    }),
    apiType: Joi.number().required().messages({
        'any.required': `Api type is required`,
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    })
});

exports.racingBetApiChangeValidator = Joi.object({
    betIds: Joi.array().min(1).items(Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    })).required().messages({
        'any.required': `Bet id is required`,
        'any.min': `Send atleast one bet id.`,
    }),
    apiType: Joi.number().required().messages({
        'any.required': `Api type is required`,
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `Bet id should be a type of 'text'`,
        'string.empty': `Bet id cannot be an empty field`,
        'string.guid': `Bet id must be a valid GUID`,
        'any.required': `Bet id is a required field`
    })
});

exports.addMatchBettingDataValidator = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).allow(null).messages({
        'string.base': `id should be a type of 'text'`,
        'string.empty': `id cannot be an empty field`,
        'string.guid': `id must be a valid GUID`,
        'any.required': `id is a required field`
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
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
    name: Joi.string().required().messages({
        'number.base': `Market name should be a type of 'number'`,
        'number.empty': `Market name cannot be an empty field`,
        'any.required': `Market name is a required field`
    }),
    maxBet: Joi.number().messages({
        'number.base': `Max bet should be a type of 'number'`,
        'number.empty': `Max bet cannot be an empty field`,
        'any.required': `Max bet is a required field`
    }),
    minBet: Joi.number().messages({
        'number.base': `Min bet should be a type of 'number'`,
        'number.empty': `Min bet cannot be an empty field`,
        'any.required': `Min bet is a required field`
    }),
    exposureLimit: Joi.number().allow(null).messages({
        'number.base': `Exposure limit should be a type of 'number'`,
    }),
    marketId: Joi.string().when('type', {
        is: Joi.valid(...Object.values(manualMatchBettingType)),
        then: Joi.allow(null),
        otherwise: Joi.allow(null)
    }).messages({
        "string.base": "Market ID must be a string"
    }),
    gtype: Joi.string().required().valid(...Object.values(gameTypeMatchBetting)).messages({
        "any.required": "Game type is required",
    }),
    sNo: Joi.number(),
    runners: Joi.when(Joi.ref("type"), {
        is: matchBettingType.tournament,
        then: Joi.array().min(1).required().items(Joi.object().keys({
            matchId: Joi.string().required().messages({
                "any.required": "Runner match id required"
            }),
            metadata: Joi.object().allow(null),
            runnerName: Joi.string().required().messages({
                "any.required": "Runner name required"
            }),
            selectionId: Joi.string().required().messages({
                "any.required": "Runner selection id required"
            }),
            sortPriority: Joi.number().required().messages({
                "any.required": "Runner sort priority required"
            }),
            id: Joi.string().guid({ version: 'uuidv4' }).allow(null).messages({
                'string.base': `id should be a type of 'text'`,
                'string.empty': `id cannot be an empty field`,
                'string.guid': `id must be a valid GUID`,
                'any.required': `id is a required field`
            })
        })).messages({
            'array.base': `Runners should be an array`,
            'array.min': `Send at least one runner object`,
            'any.required': `Runners are required when id is null and type is tournament`,
        })
        ,
        otherwise: Joi.array().allow(null)

    }),
    betLimit: Joi.number().allow(null).messages({
        'number.base': `Bet limit should be a type of 'number'`,
    }),
    isCommissionActive: Joi.boolean().allow(null),
    isManual: Joi.boolean().allow(null),
});

exports.cloneMatchBettingDataValidator = Joi.object({
    betId: Joi.string().guid({ version: 'uuidv4' }).allow(null).messages({
        'string.base': `betId should be a type of 'text'`,
        'string.empty': `betId cannot be an empty field`,
        'string.guid': `betId must be a valid GUID`,
        'any.required': `betId is a required field`
    }),
    matchId: Joi.string().guid({ version: 'uuidv4' }).required().messages({
        'string.base': `matchId should be a type of 'text'`,
        'string.empty': `matchId cannot be an empty field`,
        'string.guid': `matchId must be a valid GUID`,
        'any.required': `matchId is a required field`
    }),
    
});