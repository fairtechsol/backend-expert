
const internalRedis = require("../../config/internalRedisConnection");
const { logger } = require("../../config/logger");
const joiValidator = require("../../middleware/joi.validator");
const { getMatchSchema } = require("../../validators/userValidator");

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
   ...(data.matchOdd ? { matchOdd: JSON.stringify(data.matchOdd)}:{}),
   ...(data.marketBookmaker ? { marketBookmaker: JSON.stringify(data.marketBookmaker)}:{}),
   ...(data.marketTiedMatch ? { marketTiedMatch: JSON.stringify(data.marketTiedMatch)}:{})
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
    id: match.id,
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
    marketTiedMatch: JSON.stringify(data.marketTiedMatch) || match.marketTiedMatch
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


exports.getMatchFromCache = async (matchId) => {
  let matchKey = `${matchId}_match`;
  let MatchData = await internalRedis.hgetall(matchKey);
  if (Object.keys(MatchData)?.length) {
    let validate = await joiValidator.jsonValidator(getMatchSchema, MatchData);
    if (validate?.matchOdd)
      validate.matchOdd = JSON.parse(validate.matchOdd);
    if (validate?.marketBookmaker)
      validate.marketBookmaker = JSON.parse(validate?.marketBookmaker);
    if (validate.marketTiedMatch)
      validate.marketTiedMatch = JSON.parse(validate.marketTiedMatch);
    console.log(validate);
    return validate;
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
