
const { redisKeys, betStatusType, marketBettingTypeByBettingType, mainMatchRacingMarketType, raceTypeByBettingType, sessionBettingType, oddsSessionBetType } = require("../../config/contants");
const internalRedis = require("../../config/internalRedisConnection");
const externalRedis = require("../../config/externalRedisConnection");
const { logger } = require("../../config/logger");
const joiValidator = require("../../middleware/joi.validator");
const { getMatchSchema } = require("../../validators/matchValidator");
const { getSessionBettings } = require("../sessionBettingService");
const lodash = require('lodash')
let expiry = 60 * 60 * 4;
exports.addMatchInCache = async (matchId, data) => {
  // Log the update information
  logger.info({
    message: `adding match data in redis with match id  ${matchId}`,
    data: data
  });
  let matchKey = `${matchId}_match`;
  let payload = {
    id: data.id,
    matchType: data.matchType,
    competitionId: data.competitionId,
    competitionName: data.competitionName,
    title: data.title,
    marketId: data.marketId,
    eventId: data.eventId,
    teamA: data.teamA,
    teamB: data.teamB,
    betFairSessionMaxBet: data.betFairSessionMaxBet,
    betFairSessionMinBet: data.betFairSessionMinBet,
    startAt: data.startAt,
    apiSessionActive: data.apiSessionActive,
    manualSessionActive: data.manualSessionActive,
    rateThan100: data.rateThan100,
    isTv: data?.isTv,
    isFancy: data?.isFancy,
    isBookmaker: data?.isBookmaker,
    sessionMaxBets: JSON.stringify(data?.sessionMaxBets)
  }

  Object.values(marketBettingTypeByBettingType)?.forEach((item) => {
    if (data[item]) {
      payload[item] = JSON.stringify(data[item]);
    }
  });


  if (data.teamC) {
    payload.teamC = data.teamC;
  }
  if (data.stopAt) {
    payload.stopAt = data.stopAt;
  }
  let res = await externalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
  return res;
}

exports.addRaceInCache = async (matchId, data) => {
  // Log the update information
  logger.info({
    message: `adding match data in redis with match id  ${matchId}`,
    data: data
  });
  let matchKey = `${matchId}_match`;
  let payload = {
    id: data.id,
    matchType: data.matchType,
    matchOdd: data.matchOdd,
    title: data.title,
    createBy: data.createBy,
    marketId: data.marketId,
    runners: data.runners,
    eventId: data.eventId,
    startAt: data.startAt,
    countryCode: data?.countryCode,
    venue: data?.venue,
    raceType: data?.raceType,
    betPlaceStartBefore: data?.betPlaceStartBefore
  }
  if (data.stopAt) {
    payload.stopAt = data.stopAt;
  }
  let res = await externalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
  return res;
}


exports.updateMatchInCache = async (matchId, data) => {
  // Log the update information
  logger.info({
    message: `updating  match data in redis with match id  ${matchId}`,
    data: data
  });
  let matchKey = `${matchId}_match`;
  let match = await externalRedis.hgetall(matchKey);
  let payload = {
    id: match.id || data.id,
    matchType: data.matchType || match.matchType,
    competitionId: data.competitionId || match.competitionId,
    competitionName: data.competitionName || match.competitionName,
    title: data.title || match.title,
    marketId: data.marketId || match.marketId,
    eventId: data.eventId || match.eventId,
    teamA: data.teamA || match.teamA,
    teamB: data.teamB || match.teamB,
    betFairSessionMaxBet: data.betFairSessionMaxBet || match.betFairSessionMaxBet,
    betFairSessionMinBet: data.betFairSessionMinBet || match.betFairSessionMinBet,
    startAt: data.startAt || match.startAt,
    apiSessionActive: data.apiSessionActive ?? match.apiSessionActive,
    manualSessionActive: data.manualSessionActive ?? match.manualSessionActive,
    rateThan100: data.rateThan100 ?? match?.rateThan100,
    sessionMaxBets: JSON.stringify(data?.sessionMaxBets ?? match?.sessionMaxBets)
  }

  Object.values(marketBettingTypeByBettingType)?.forEach((item) => {
    if (data[item]) {
      payload[item] = JSON.stringify(data[item]);
    }
  });


  if (data.teamC || match.teamC) {
    payload.teamC = data.teamC || match.teamC;
  }
  if (data.stopAt || match.stopAt) {
    payload.stopAt = data.stopAt || match.stopAt;
  }
  return await externalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.updateRaceInCache = async (matchId, data) => {
  // Log the update information
  logger.info({
    message: `updating  race data in redis with match id  ${matchId}`,
    data: data
  });
  let matchKey = `${matchId}_match`;
  let match = await externalRedis.hgetall(matchKey);
  let matchOdd = JSON.parse(match.matchOdd)
  matchOdd.maxBet = data.maxBet
  matchOdd.minBet = data.minBet
  match.matchOdd = JSON.stringify(matchOdd);
  let payload = {
    activeStatus: data.activeStatus || match.activeStatus,
    matchOdd: match.matchOdd,
    createBy: data.createBy || match.createBy,
    createdAt: data.createdAt || match.createdAt,
    isActive: data.isActive,
    marketId: data.marketId || match.marketId,
    matchId: data.matchId || match.matchId,
    type: data.type || match.type
  };

  if (data.stopAt || match.stopAt) {
    payload.stopAt = data.stopAt || match.stopAt;
  }
  return await externalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.updateMatchKeyInCache = async (matchId, key, data) => {
  let matchKey = `${matchId}_match`;
  // Log the update information

  let payload = {
    [key]: data
  }
  return await externalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.hasMatchInCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  return await externalRedis.exists(matchKey);
}

exports.updateMatchExpiry = async (matchId) => {
  let matchKey = `${matchId}_match`;

  return await externalRedis
    .expire(matchKey, expiry);
}

exports.getKeyFromMatchRedis = async (matchId, key) => {
  // Retrieve match data from Redis
  const matchData = await externalRedis.hget(`${matchId}_match`, key);

  // Parse and return the match data or null if it doesn't exist
  return matchData ? JSON.parse(matchData) : null;
};

// exports.getMatchFromCache = async(matchId) =>{
//     let match = await externalRedis.hgetall(`${matchId}_match`);
//     return Object.keys(match)?.length > 0 ? match : null;
// }

/**
 * Updates betting match data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} sessionId - The ID of the session.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.updateSessionMatchRedis = async (matchId, sessionId, data) => {

  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_session`, sessionId, JSON.stringify(data))
    .expire(`${matchId}_session`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};

exports.hasSessionInCache = async (matchId) => {
  let sessionKey = `${matchId}_session`;
  return await externalRedis.exists(sessionKey);
}

/**
 * Updates session match data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllSessionMatchRedis = async (matchId, data) => {

  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_session`, data)
    .expire(`${matchId}_session`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
}

/**
 * Retrieves session data from Redis based on match and session IDs.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Object|null>} - A Promise that resolves with the session data
 *                                   or null if no data is found for the given IDs.
 */
exports.getSessionFromRedis = async (matchId, sessionId) => {
  // Retrieve session data from Redis
  const sessionData = await externalRedis.hget(`${matchId}_session`, sessionId);

  // Parse and return the session data or null if it doesn't exist
  return sessionData ? JSON.parse(sessionData) : null;
};

/**
 * Retrieves all session data for a given match from Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @returns {Promise<Object|null>} - A Promise that resolves with an object containing
 *                                   all session data for the match or null if no data is found.
 */
exports.getAllSessionRedis = async (matchId) => {
  // Retrieve all session data for the match from Redis
  const sessionData = await externalRedis.hgetall(`${matchId}_session`);

  // Return the session data as an object or null if no data is found
  return Object.keys(sessionData)?.length == 0 ? null : sessionData;
};


exports.updateExpiryTimeSession = async (matchId) => {
  await externalRedis.expire(`${matchId}_session`, expiry);
};

/**
* Updates bookmaker match data in Redis.
*
* @param {string} matchId - The ID of the match.
* @param {string} bettingType - The type of the betting.
* @param {Object} data - The data to be updated in the session.
* @returns {Promise<void>} - A Promise that resolves when the update is complete.
*/
exports.updateBettingMatchRedis = async (matchId, bettingType, data) => {
  // Log the update information
  logger.info({
    message: `updating data in redis for bettingType ${bettingType} of match ${matchId}`,
    data: data
  });

  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_manualBetting`, bettingType, JSON.stringify(data))
    .expire(`${matchId}_manualBetting`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};

/**
 * Updates betting data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllBettingMatchRedis = async (matchId, data) => {

  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_manualBetting`, data)
    .expire(`${matchId}_manualBetting`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
}

/**
 * Retrieves betting data from Redis based on match and betting type.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} bettingType - The betting type of match.
 * @returns {Promise<Object|null>} - A Promise that resolves with the betting data
 *                                   or null if no data is found for the given IDs.
 */
exports.getBettingFromRedis = async (matchId, bettingType) => {
  // Retrieve betting data from Redis
  const bettingData = await externalRedis.hget(`${matchId}_manualBetting`, bettingType);

  // Parse and return the betting data or null if it doesn't exist
  return bettingData ? JSON.parse(bettingData) : null;
};

/**
 * Retrieves betting data from Redis based on match and betting type.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} bettingType - The betting type of match.
 * @returns {Promise<Object|null>} - A Promise that resolves with the betting data
 *                                   or null if no data is found for the given IDs.
 */
exports.getBettingFromRedis = async (matchId, bettingType) => {
  // Retrieve betting data from Redis
  const bettingData = await externalRedis.hget(`${matchId}_manualBetting`, bettingType);

  // Parse and return the betting data or null if it doesn't exist
  return bettingData ? JSON.parse(bettingData) : null;
};

/**
 * Retrieves all betting data for a given match from Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @returns {Promise<Object|null>} - A Promise that resolves with an object containing
 *                                   all betting data for the match or null if no data is found.
 */
exports.getAllBettingRedis = async (matchId) => {
  // Retrieve all betting data for the match from Redis
  const bettingData = await externalRedis.hgetall(`${matchId}_manualBetting`);

  // Return the betting data as an object or null if no data is found
  return Object.keys(bettingData)?.length == 0 ? null : bettingData;
};

/**
 * Retrieves all betting data for a given match from Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @returns {Promise<Object|null>} - A Promise that resolves with an object containing
 *                                   all betting data for the match or null if no data is found.
 */
exports.getMatchTournamentFromCache = async (matchId) => {
  // Retrieve all betting data for the match from Redis
  const bettingData = await externalRedis.hget(`${matchId}_match`, "tournament");
  return JSON.parse(bettingData || "[]")
};

exports.updateExpiryTimeBetting = async (matchId) => {
  await externalRedis.expire(`${matchId}_manualBetting`, expiry);
};

exports.hasBettingInCache = async (matchId) => {
  let bettingKey = `${matchId}_manualBetting`;
  return await externalRedis.exists(bettingKey);
}

exports.getMatchFromCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await externalRedis.hgetall(matchKey);
  if (Object.keys(MatchData)?.length) {
    if (MatchData?.sessionMaxBets) {
      MatchData.sessionMaxBets = JSON.parse(MatchData.sessionMaxBets)
    }
    let { validated } = await joiValidator.jsonValidator(getMatchSchema, MatchData);

    Object.values(marketBettingTypeByBettingType)?.forEach((item) => {
      if (validated?.[item]) {
        validated[item] = JSON.parse(validated[item]);
      }
    });

    return validated;
  }
  return null;
}

exports.getRaceFromCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await externalRedis.hgetall(matchKey);
  if (Object.keys(MatchData)?.length) {
    return MatchData;
  }
  return null;
}

exports.getSingleMatchKey = async (matchId, key, type) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await externalRedis.hget(matchKey, key);
  if (type == 'number') {
    MatchData = Number(MatchData);
  }
  if (type == 'boolean') {
    MatchData = Boolean(MatchData);
  }
  if (type == 'json') {
    MatchData = JSON.parse(MatchData);
  }
  return MatchData;
}

exports.getMultipleMatchKey = async (matchId) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await externalRedis.hgetall(matchKey);
  return MatchData;
}

exports.hasMatchInCache = async (matchId) => {
  let key = `${matchId}_match`;
  return await externalRedis.exists(key);
}

exports.settingMatchKeyInCache = async (matchId, data) => {
  let key = `${matchId}_match`;
  return await externalRedis.hset(key, data);
}

exports.addAllsessionInRedis = async (matchId, result) => {
  if (!result)
    result = await getSessionBettings({ matchId, activeStatus: betStatusType?.live });
  if (!result) {
    throw {
      error: true,
      message: { msg: "notFound", keys: { name: "Session" } },
      statusCode: 404,
    };
  }
  let session = {};
  let apiSelectionIdObj = {};
  for (let index = 0; index < result?.length; index++) {
    if (result?.[index]?.activeStatus == betStatusType.live && result?.[index]?.selectionId) {
      apiSelectionIdObj[result?.[index]?.selectionId] = result?.[index]?.id;
    }
    session[result[index].id] = JSON.stringify(result[index]);
  }
  await this.settingAllSessionMatchRedis(matchId, session);
}

exports.hasMarketSessionIdsInCache = async (matchId) => {
  let Key = `${matchId}_selectionId`;
  return await externalRedis.exists(Key);
}

exports.getAllMarketSessionIdsRedis = async (matchId) => {
  // Retrieve all betting data for the match from Redis
  const marketSessionIds = await externalRedis.hgetall(`${matchId}_selectionId`);

  // Return the betting data as an object or null if no data is found
  return lodash.isEmpty(marketSessionIds) ? null : marketSessionIds;
};

exports.getMarketSessionIdFromRedis = async (matchId, selectionId) => {
  // Retrieve betting data from Redis
  const marketSessionId = await externalRedis.hget(`${matchId}_selectionId`, selectionId);

  // Parse and return the betting data or null if it doesn't exist
  return marketSessionId ? marketSessionId : null;
};

exports.updateMarketSessionIdRedis = async (matchId, selectionId, data) => {
  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_selectionId`, selectionId, data)
    .expire(`${matchId}_selectionId`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};

exports.updateMultipleMarketSessionIdRedis = async (matchId, data) => {
  // Use a Redis pipeline for atomicity and efficiency
  await externalRedis
    .pipeline()
    .hset(`${matchId}_selectionId`, data)
    .expire(`${matchId}_selectionId`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};

exports.addDataInRedis = async (key, dataObj) => {
  // Use a Redis pipeline for atomicity and efficiency
  if (!lodash.isEmpty(dataObj)) {
    await internalRedis.hmset(key, dataObj);
  }
};

exports.getUserRedisData = async (userId) => {

  // Retrieve all user data for the match from Redis
  const userData = await internalRedis.hgetall(userId);

  // Return the user data as an object or null if no data is found
  return Object.keys(userData)?.length == 0 ? null : userData;
}

// create function for remove key from market session
exports.deleteKeyFromMarketSessionId = async (matchId, ...selectionId) => {
  const deleteKey = await externalRedis.hdel(`${matchId}_selectionId`, selectionId);
  return deleteKey;
}

// create function for remove key from market session
exports.deleteKeyFromManualSessionId = async (matchId, sessionId) => {
  const deleteKey = await externalRedis.hdel(`${matchId}_session`, sessionId);
  return deleteKey;
}

exports.setExpertsRedisData = async (data) => {
  if (!lodash.isEmpty(data)) {
    await internalRedis.hset(redisKeys.expertRedisData, data)
  }
}

exports.getExpertsRedisData = async () => {
  // Retrieve expert data from Redis
  const expertData = await internalRedis.hgetall(redisKeys.expertRedisData);

  // Parse and return the betting data or null if it doesn't exist
  return lodash.isEmpty(expertData) ? null : expertData;
}

exports.getExpertsRedisSessionData = async (sessionId) => {
  // Retrieve session data from Redis
  const sessionData = await internalRedis.hget(redisKeys.expertRedisData, sessionId + redisKeys.profitLoss);

  // Parse and return the session data or null if it doesn't exist
  return sessionData;

}

exports.getExpertsRedisKeyData = async (key) => {
  // Retrieve session data from Redis
  const data = await internalRedis.hget(redisKeys.expertRedisData, key);
  return data;
}

exports.getExpertsRedisSessionDataByKeys = async (keys) => {
  // Retrieve expert data from Redis
  const expertData = await internalRedis.hmget(redisKeys.expertRedisData, keys);
  let expertRedisData = {};
  expertData?.forEach((item, index) => {
    if (item) {

      expertRedisData[keys?.[index]?.split("_")[0]] = {
        profitLoss: JSON.parse(item)?.betPlaced,
        maxLoss: JSON.parse(item)?.maxLoss,
        totalBet: JSON.parse(item)?.totalBet
      };

    }
  });
  return expertRedisData;

}

exports.getExpertsRedisMatchData = async (matchId) => {
  let matchResult = await this.getHashKeysByPattern(redisKeys.expertRedisData, `*_${matchId}`);
  return matchResult;

}

// create function for remove key from market session
exports.deleteKeyFromExpertRedisData = async (...key) => {
  const deleteKey = await internalRedis.hdel(redisKeys.expertRedisData, key);
  return deleteKey;
}

// create function for remove key from market session
exports.deleteKeyFromMatchRedisData = async (matchId, ...key) => {
  const deleteKey = await externalRedis.hdel(`${matchId}_match`, key);
  return deleteKey;
}

// create function for remove key from redis
exports.deleteAllMatchRedis = async (matchId) => {
  await externalRedis.del(matchId + "_match", matchId + "_manualBetting", matchId + "_session", matchId + "_selectionId");
}

exports.loginCount = async (key) => {
  let totalCount = await internalRedis.get(key);
  totalCount = parseInt(totalCount) || 0
  return totalCount
}

/**
 * Updates betting data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllBettingMatchRedisStatus = async (matchId, status) => {
  const manualBettingData = await externalRedis.hgetall(`${matchId}_manualBetting`);

  let redisPipeline = externalRedis
    .pipeline();

  if (manualBettingData) {
    Object.keys(manualBettingData)?.forEach((item) => {
      if (manualBettingData[item]) {
        let data = JSON.parse(manualBettingData[item]);
        data.activeStatus = status;
        manualBettingData[item] = JSON.stringify(data);
      }
    });

    redisPipeline = redisPipeline.hset(`${matchId}_manualBetting`, manualBettingData).expire(`${matchId}_manualBetting`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key;
  }

  let matchDetails = await externalRedis.hgetall(`${matchId}_match`);

  if (matchDetails) {
    Object.values(marketBettingTypeByBettingType)?.forEach((item) => {
      if (matchDetails[item] && ![marketBettingTypeByBettingType.tournament, marketBettingTypeByBettingType.other].includes(item)) {
        let data = JSON.parse(matchDetails[item]);
        data.activeStatus = status;
        matchDetails[item] = JSON.stringify(data);
      }
    });
    redisPipeline = redisPipeline.hset(`${matchId}_match`, matchDetails).expire(`${matchId}_match`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key;
  }

  // Use a Redis pipeline for atomicity and efficiency
  await redisPipeline.exec();
}

/**
 * Updates betting data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllBettingOtherMatchRedisStatus = async (matchId, status) => {
  const manualBettingData = await externalRedis.hgetall(`${matchId}_manualBetting`);

  let redisPipeline = externalRedis
    .pipeline();

  if (manualBettingData) {
    Object.keys(manualBettingData)?.forEach((item) => {
      if (manualBettingData[item]) {
        let data = JSON.parse(manualBettingData[item]);
        data.activeStatus = status;
        manualBettingData[item] = JSON.stringify(data);
      }
    });

    redisPipeline = redisPipeline.hset(`${matchId}_manualBetting`, manualBettingData).expire(`${matchId}_manualBetting`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key;
  }

  // Use a Redis pipeline for atomicity and efficiency
  await redisPipeline.exec();
}

/**
 * Updates betting data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllBettingRacingMatchRedisStatus = async (matchId, status) => {
  let redisPipeline = externalRedis
    .pipeline();

  let matchDetails = await externalRedis.hgetall(`${matchId}_match`);

  if (matchDetails) {
    Object.keys(mainMatchRacingMarketType)?.forEach((item) => {
      if (matchDetails[raceTypeByBettingType[item]]) {
        let data = JSON.parse(matchDetails[raceTypeByBettingType[item]]);
        data.activeStatus = status;
        matchDetails[raceTypeByBettingType[item]] = JSON.stringify(data);
      }
    });
    redisPipeline = redisPipeline.hset(`${matchId}_match`, matchDetails).expire(`${matchId}_match`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key;
  }

  // Use a Redis pipeline for atomicity and efficiency
  await redisPipeline.exec();
}

exports.getRedisKey = async (key) => {
  return await internalRedis.get(key);
}

exports.setRedisKey = async (key, val) => {
  await internalRedis.set(key, val);
}

exports.deleteRedisKey = async (key, val) => {
  await internalRedis.del(key);
}

exports.getHashKeysByPattern = async (key, pattern) => {
  let cursor = '0';
  let resultObj = {};
  do {
    const result = await internalRedis.hscan(key, cursor, 'MATCH', pattern);
    cursor = result[0];
    const keys = result[1];
    for (let i = 0; i < keys?.length - 1; i += 2) {
      resultObj[keys[i]] = keys[i + 1];
    }
  } while (cursor !== '0');
  return resultObj;
}

exports.setExternalRedisKey = async (key, val) => {
  await externalRedis.set(key, val);
}

exports.getExternalRedisKey = async (key) => {
  return await externalRedis.get(key);
}

exports.setUserPLSession = async (matchId, betId, redisData) => {
  const base = `session:expert:${matchId}:${betId}:`;

  return await internalRedis.eval(`
                local pl = KEYS[1]
                local lo = tonumber(redis.call('GET', KEYS[2])) or 0
                local hi = tonumber(redis.call('GET', KEYS[3])) or 0

                local blo = tonumber(redis.call('HGET', pl, tostring(lo))) or 0
                local bhi = tonumber(redis.call('HGET', pl, tostring(hi))) or 0
                
                local maxLoss=0
                local high=hi
                local low=tonumber(redis.call('GET', KEYS[2])) or 999
                local updatedProfitLoss = {}

                for i = 1, #ARGV, 2 do
                  local k = tonumber(ARGV[i])
                  local v = tonumber(ARGV[i + 1])
                  local base = 0

                  if k < low then
                    low=k
                  end

                  if k > high then
                      high=k
                  end

                  if k < lo then
                    base = blo
                  elseif k > hi then
                    base = bhi 
                  else
                    base = 0
                  end

                  local incr = v
                  local newValue =  redis.call('HINCRBYFLOAT', pl, ARGV[i], tonumber(base + incr))
                  if tonumber(newValue) < maxLoss then
                    maxLoss = tonumber(newValue)
                  end
                  -- Collect updated profitLoss for this odds
                  table.insert(updatedProfitLoss, ARGV[i])      -- odds
                  table.insert(updatedProfitLoss, tostring(newValue))  -- updated profitLoss
                end
                redis.call('SET', KEYS[2], low)
                redis.call('SET', KEYS[3], high)
                local totalBet = redis.call('INCRBY', KEYS[4], 1)
                redis.call('SET', KEYS[5], math.abs(maxLoss))

                return { tostring(math.abs(maxLoss)), low, high, totalBet, unpack(updatedProfitLoss) }
                `, 5,
    base + 'profitLoss',
    base + 'lowerLimitOdds',
    base + 'upperLimitOdds',
    base + 'totalBet',
    base + 'maxLoss',
    ...redisData);
};

exports.setUserPLSessionOddEven = async (matchId, betId, redisData) => {
  const base = `session:expert:${matchId}:${betId}:`;

  return await internalRedis.eval(`
                local pl = KEYS[1]

                local maxLoss=0
                local updatedProfitLoss = {}

                for i = 1, #ARGV, 2 do
                  local k = ARGV[i]
                  local v = tonumber(ARGV[i + 1])
                 
                 local newValue = redis.call('HINCRBYFLOAT', pl, k, v)
                
                  if tonumber(newValue) < maxLoss then
                    maxLoss=tonumber(newValue)
                  end
                 -- Collect updated profitLoss for this odds
                  table.insert(updatedProfitLoss, ARGV[i])      -- odds
                  table.insert(updatedProfitLoss, tostring(newValue))  -- updated profitLoss
                end
                local totalBet =redis.call('INCRBY', KEYS[2], 1)
                redis.call('SET', KEYS[3], math.abs(maxLoss))

                return { tostring(math.abs(maxLoss)), totalBet, unpack(updatedProfitLoss) }

                `, 3,
    base + 'profitLoss',
    base + 'totalBet',
    base + 'maxLoss',
    ...redisData);
};

exports.getUserSessionPL = async (matchId, betId) => {
  const pipeline = internalRedis.pipeline();

  const upperKey = `session:expert:${matchId}:${betId}:upperLimitOdds`;
  const lowerKey = `session:expert:${matchId}:${betId}:lowerLimitOdds`;

  // Queue commands
  pipeline.get(upperKey);
  pipeline.get(lowerKey);

  // Execute pipeline
  const results = await pipeline.exec(); // [ [err, result], [err, result], ... ]

  // Extract results safely
  const [upperLimitRes, lowerLimitRes] = results;

  const upperLimit = upperLimitRes[1] !== null ? Number(upperLimitRes[1]) : null;
  const lowerLimit = lowerLimitRes[1] !== null ? Number(lowerLimitRes[1]) : null;

  return {
    upperLimitOdds: upperLimit,
    lowerLimitOdds: lowerLimit,
  };
};

exports.getUserSessionAllPL = async (matchId, betId, type = sessionBettingType.session) => {
  const pipeline = internalRedis.pipeline();

  const upperKey = `session:expert:${matchId}:${betId}:upperLimitOdds`;
  const lowerKey = `session:expert:${matchId}:${betId}:lowerLimitOdds`;
  const totalBetKey = `session:expert:${matchId}:${betId}:totalBet`;
  const profitLossKey = `session:expert:${matchId}:${betId}:profitLoss`;
  const maxLossKey = `session:expert:${matchId}:${betId}:maxLoss`;

  // Queue commands
  pipeline.get(upperKey);
  pipeline.get(lowerKey);
  pipeline.get(totalBetKey);
  pipeline.hgetall(profitLossKey);
  pipeline.get(maxLossKey);

  // Execute pipeline
  const results = await pipeline.exec(); // [ [err, result], [err, result], ... ]

  // Extract results safely
  const [upperLimitRes, lowerLimitRes, totalBetRes, profitLossRes, maxLossRes] = results;

  const upperLimit = upperLimitRes[1] !== null ? Number(upperLimitRes[1]) : null;
  const lowerLimit = lowerLimitRes[1] !== null ? Number(lowerLimitRes[1]) : null;
  const totalBet = totalBetRes[1] !== null ? Number(totalBetRes[1]) : null;
  const profitLoss = profitLossRes[1] !== null ? profitLossRes[1] : null;
  const maxLoss = maxLossRes[1] !== null ? Number(maxLossRes[1]) : null;

  return {
    upperLimitOdds: upperLimit,
    lowerLimitOdds: lowerLimit,
    totalBet: totalBet,
    betPlaced: oddsSessionBetType.includes(type) ? Object.entries(profitLoss || {}).map(([key, value]) => ({
      odds: parseFloat(key),
      profitLoss: parseFloat(value)
    })) : profitLoss,
    maxLoss: maxLoss
  };
};


exports.setProfitLossData = async (matchId, betId, redisData) => {
  const base = `session:expert:${matchId}:${betId}:`;
  const pipeline = internalRedis.pipeline();
  pipeline.hset(base + 'profitLoss', redisData.betPlaced);
  pipeline.set(base + 'totalBet', redisData.totalBet);
  if (redisData.upperLimitOdds != null) {
    pipeline.set(base + 'upperLimitOdds', redisData.upperLimitOdds);
  }
  if (redisData.lowerLimitOdds != null) {
    pipeline.set(base + 'lowerLimitOdds', redisData.lowerLimitOdds);
  }
  pipeline.set(base + 'maxLoss', redisData.maxLoss);
  await pipeline.exec();
}

exports.deleteProfitLossData = async (matchId, betId) => {
  let cursor = '0';
  const keysToUnlink = [];

  do {
    const [newCursor, keys] = await internalRedis.scan(cursor, 'MATCH', `session:expert:${matchId}:${betId}`, 'COUNT', 10000);
    cursor = newCursor;
    keysToUnlink.push(...keys);
  } while (cursor !== '0');

  if (keysToUnlink.length > 0) {
    const pipeline = internalRedis.pipeline();
    keysToUnlink.forEach(key => pipeline.unlink(key));
    await pipeline.exec();
  }
}

exports.getAllSessions = async (matchId) => {
  if (matchId) {
    const pattern = `session:expert:${matchId}:*`;
    let cursor = '0';
    const sessions = {};

    do {
      // 1) Fetch a batch of keys
      const [nextCursor, keys] = await internalRedis.scan(
        cursor,
        'MATCH', pattern,
        'COUNT', 1000       // bump this up if you can afford more per‐round
      );
      cursor = nextCursor;

      if (keys.length) {
        // 2) Pipeline all TYPE calls
        const typePipeline = internalRedis.pipeline();
        keys.forEach(key => typePipeline.type(key));
        const typeResults = await typePipeline.exec();

        // 3) Pipeline GET or HGETALL based on type
        const dataPipeline = internalRedis.pipeline();
        typeResults.forEach(([_, type], idx) => {
          const key = keys[idx];
          if (type === 'hash') {
            dataPipeline.hgetall(key);
          } else {
            dataPipeline.get(key);
          }
        });
        const dataResults = await dataPipeline.exec();

        // 4) Assemble results
        for (let i = 0; i < keys.length; i++) {
          const [, , , betId, key] = keys[i]?.split(":")
          sessions[betId] = {
            ...sessions[betId],
            [key]: dataResults[i][1]
          }
        }
      }
    } while (cursor !== '0');

    return {
      [matchId]: Object.entries(sessions).reduce((prev, [key, val]) => {
        prev[key] = {
          totalBet: val.totalBet, "maxLoss": val.maxLoss, "betId": key,
          "upperLimitOdds": val.upperLimitOdds, "lowerLimitOdds": val.lowerLimitOdds, "profitLoss": Object.entries(val?.profitLoss || {})?.map(([odds, pl]) => ({ odds: odds, profitLoss: pl })) || [],
        }
        return prev;
      }, {})
    };
  }
  else {
    const data = await internalRedis.eval(`
      local userId = KEYS[1]
local pattern = 'session:' .. userId .. ':*'
local cursor = '0'
local sessions = {}

repeat
  local scanResult = redis.call('SCAN', cursor, 'MATCH', pattern, 'COUNT', 1000)
  cursor = scanResult[1]
  local keys = scanResult[2]

  for _, key in ipairs(keys) do
    local parts = {}
    for part in string.gmatch(key, '([^:]+)') do
      table.insert(parts, part)
    end
    local matchId = parts[3]
    local betId = parts[4]
    local field = parts[5]

    local t = redis.call('TYPE', key).ok
    local value
    if t == 'hash' then
      local raw = redis.call('HGETALL', key)
      local tbl = {}
      for i = 1, #raw, 2 do
        tbl[raw[i]] = raw[i+1]
      end
      value = tbl
    else
      value = redis.call('GET', key)
    end

    sessions[matchId] = sessions[matchId] or {}
    sessions[matchId][betId] = sessions[matchId][betId] or {}
    sessions[matchId][betId][field] = value
  end
until cursor == '0'

return cjson.encode(sessions)
`, 1, "expert")
    return Object.entries(JSON.parse(data || "{}"))?.reduce((prev, [key, val]) => {
      prev[key] = Object.entries(val)?.reduce((prev, [betKey, betVal]) => {
        prev[betKey] = {
          "totalBet": betVal.totalBet, "maxLoss": betVal.maxLoss, "betId": betKey,
          "upperLimitOdds": betVal.upperLimitOdds, "lowerLimitOdds": betVal.lowerLimitOdds, "betPlaced": Object.entries(betVal?.profitLoss || {})?.map(([odds, pl]) => ({ odds: odds, profitLoss: pl })) || [],
        }
        return prev;
      }, {})
      return prev;
    }, {})
  }
};

exports.setLoginVal = async (values) => {
  const pipeline = internalRedis.pipeline();

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'object') {
      pipeline.hset(key, value);
    }
    else {
      pipeline.set(key, value);
    }
  }
  await pipeline.exec();
}