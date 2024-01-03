
const internalRedis = require("../../config/internalRedisConnection");
const { logger } = require("../../config/logger");
const joiValidator = require("../../middleware/joi.validator");
const { getMatchSchema } = require("../../validators/matchValidator");
const { getMatchAllBettings } = require("../matchBettingService");
const { getSessionBettings } = require("../sessionBettingService");
const lodash = require('lodash')
let expiry = 3600;

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
    ...(data.matchOdd ? { matchOdd: JSON.stringify(data.matchOdd) } : {}),
    ...(data.marketBookmaker ? { marketBookmaker: JSON.stringify(data.marketBookmaker) } : {}),
    ...(data.marketTiedMatch ? { marketTiedMatch: JSON.stringify(data.marketTiedMatch) } : {}),
    ...(data.marketCompleteMatch ? { marketCompleteMatch: JSON.stringify(data.marketCompleteMatch) } : {}),
  }
  if (data.teamC) {
    payload.teamC = data.teamC;
  }
  if (data.stopAt) {
    payload.stopAt = stopAt;
  }
  let res = await internalRedis
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
  let match = await internalRedis.hgetall(matchKey);
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
    matchOdd: JSON.stringify(data.matchOdd) || match.matchOdd,
    marketBookmaker: JSON.stringify(data.marketBookmaker) || match.marketBookmaker,
    marketTiedMatch: JSON.stringify(data.marketTiedMatch) || match.marketTiedMatch,
    marketCompleteMatch : JSON.stringify(data.marketCompleteMatch) || match.marketCompleteMatch
  }
  if (data.teamC || match.teamC) {
    payload.teamC = data.teamC || match.teamC;
  }
  if (data.stopAt || match.stopAt) {
    payload.stopAt = data.stopAt || match.stopAt;
  }
  return await internalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.updateMatchKeyInCache = async (matchId, key, data) => {
  let matchKey = `${matchId}_match`;
  // Log the update information
  logger.info({
    message: `updating key ${data} in match data in redis with match id  ${matchId}`,
    data: data
  });

  let payload = {
    [key]: data
  }
  return await internalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.hasMatchInCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  return await internalRedis.exists(matchKey);
}

exports.updateMatchExpiry = async (matchId) => {
  let matchKey = `${matchId}_match`;

  return await internalRedis
    .expire(matchKey, expiry);
}

exports.getKeyFromMatchRedis = async (matchId, key) => {
  // Retrieve match data from Redis
  const matchData = await internalRedis.hget(`${matchId}_match`, key);

  // Parse and return the match data or null if it doesn't exist
  return matchData ? JSON.parse(matchData) : null;
};

// exports.getMatchFromCache = async(matchId) =>{
//     let match = await internalRedis.hgetall(`${matchId}_match`);
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
  // Log the update information
  logger.info({
    message: `updating data in redis for session ${sessionId} of match ${matchId}`,
    data: data
  });

  // Use a Redis pipeline for atomicity and efficiency
  await internalRedis
    .pipeline()
    .hset(`${matchId}_session`, sessionId, JSON.stringify(data))
    .expire(`${matchId}_session`, expiry) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};


exports.hasSessionInCache = async (matchId) => {
    let sessionKey = `${matchId}_session`;
    return await internalRedis.exists(sessionKey);
  }

/**
 * Updates session match data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
exports.settingAllSessionMatchRedis = async (matchId, data) => {
  logger.info({
    message: `updating data in redis for session of match ${matchId}`,
    data: data
  });

  // Use a Redis pipeline for atomicity and efficiency
  await internalRedis
    .pipeline()
    .hset(`${matchId}_session`, data)
    .expire(`${matchId}_session`, 3600) // Set a TTL of 3600 seconds (1 hour) for the key
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
  const sessionData = await internalRedis.hget(`${matchId}_session`, sessionId);

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
  const sessionData = await internalRedis.hgetall(`${matchId}_session`);

  // Return the session data as an object or null if no data is found
  return Object.keys(sessionData)?.length == 0 ? null : sessionData;
};



exports.updateExpiryTimeSession = async (matchId) => {
  await internalRedis.expire(`${matchId}_session`, expiry);
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
  await internalRedis
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
  logger.info({
    message: `updating data in redis for betting of match ${matchId}`,
    data: data
  });

  // Use a Redis pipeline for atomicity and efficiency
  await internalRedis
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
  const bettingData = await internalRedis.hget(`${matchId}_manualBetting`, bettingType);

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
  const bettingData = await internalRedis.hgetall(`${matchId}_manualBetting`);

  // Return the betting data as an object or null if no data is found
  return Object.keys(bettingData)?.length == 0 ? null : bettingData;
};


exports.updateExpiryTimeBetting = async (matchId) => {
  await internalRedis.expire(`${matchId}_manualBetting`, expiry);
};


exports.hasBettingInCache = async (matchId) => {
    let bettingKey = `${matchId}_manualBetting`;
    return await internalRedis.exists(bettingKey);
  }


exports.getMatchFromCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await internalRedis.hgetall(matchKey);
  if (Object.keys(MatchData)?.length) {
    let {validated} = await joiValidator.jsonValidator(getMatchSchema, MatchData);
    if (validated?.matchOdd)
      validated.matchOdd = JSON.parse(validated.matchOdd);
    if (validated?.marketBookmaker)
      validated.marketBookmaker = JSON.parse(validated?.marketBookmaker);
    if (validated.marketTiedMatch)
      validated.marketTiedMatch = JSON.parse(validated.marketTiedMatch);
    if (validated.marketCompleteMatch)
      validated.marketCompleteMatch = JSON.parse(validated.marketCompleteMatch);
    return validated;
  }
  return null;
}

exports.getSingleMatchKey = async (matchId, key, type) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await internalRedis.hget(matchKey, key);
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


exports.getMultipleMatchKey = async (matchId, keys) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await internalRedis.hmget(matchKey, keys);
  return MatchData;
}


exports.addAllsessionInRedis = async (matchId, result) => {
  if (!result)
      result = await getSessionBettings({ matchId });
  if (!result) {
      throw {
          error: true,
          message: { msg: "notFound", keys: { name: "Session" } },
          statusCode: 404,
      };
  }
  let session = {};
  for (let index = 0; index < result?.length; index++) {
    session[result[index].id] = JSON.stringify(result[index]);
  }
  await this.settingAllSessionMatchRedis(matchId, session);
}



exports.addAllMatchBetting = async (matchId, result) => {
  if (!result)
      result = await getMatchAllBettings({ matchId });
  if (!result) {
      throw {
          error: true,
          message: { msg: "notFound", keys: { name: "Match betting" } },
          statusCode: 404,
      };
  }
  let matchBetting = {};
  for (let index = 0; index < result?.length; index++) {
      matchBetting[result[index].type] = JSON.stringify(result[index]);
  }
  await this.settingAllBettingMatchRedis(matchId, matchBetting);
}

exports.hasMarketSessionIdsInCache = async (matchId) => {
  let Key = `${matchId}_selectionId`;
  return await internalRedis.exists(Key);
}

exports.getAllMarketSessionIdsRedis = async (matchId) => {
  // Retrieve all betting data for the match from Redis
  const MarketSessionIds = await internalRedis.hgetall(`${matchId}_selectionId`);

  // Return the betting data as an object or null if no data is found
  return lodash.isEmpty(MarketSessionIds)? null : MarketSessionIds;
};

exports.getMarketSessionIdFromRedis = async (matchId, selectionId) => {
  // Retrieve betting data from Redis
  const MarketSessionId = await internalRedis.hget(`${matchId}_selectionId`, selectionId);

  // Parse and return the betting data or null if it doesn't exist
  return MarketSessionId ? MarketSessionId : null;
};

exports.updateMarketSessionIdRedis = async (matchId, selectionId, data) => {
  // Use a Redis pipeline for atomicity and efficiency
  await internalRedis.hset(`${matchId}_selectionId`, selectionId, data)
};

exports.getUserRedisData = async (userId)=>{
  
  // Retrieve all user data for the match from Redis
  const userData = await internalRedis.hgetall(userId);

  // Return the user data as an object or null if no data is found
  return Object.keys(userData)?.length == 0 ? null : userData;
}