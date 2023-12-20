
const { addSessionBetting, getSessionBettingById, updateSessionBetting, getSessionBetting, getSessionBettings } = require("../services/sessionBettingService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const {getUserById} = require("../services/userService");
const { sessionBettingType, teamStatus } = require("../config/contants");
const { getMatchById } = require("../services/matchService");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");


/**
 * Updates session match data in Redis.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} sessionId - The ID of the session.
 * @param {Object} data - The data to be updated in the session.
 * @returns {Promise<void>} - A Promise that resolves when the update is complete.
 */
const updateSessionMatchRedis = async (matchId, sessionId, data) => {
  // Log the update information
  logger.info({
    message: `updating data in redis for session ${sessionId} of match ${matchId}`,
    data: data
  });

  // Use a Redis pipeline for atomicity and efficiency
  await internalRedis
    .pipeline()
    .hset(`${matchId}_session`, sessionId, JSON.stringify(data))
    .expire(`${matchId}_session`, 3600) // Set a TTL of 3600 seconds (1 hour) for the key
    .exec();
};


/**
 * Retrieves session data from Redis based on match and session IDs.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<Object|null>} - A Promise that resolves with the session data
 *                                   or null if no data is found for the given IDs.
 */
const getSessionFromRedis = async (matchId, sessionId) => {
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
const getAllSessionRedis = async (matchId) => {
  // Retrieve all session data for the match from Redis
  const sessionData = await internalRedis.hgetall(`${matchId}_session`);

  // Return the session data as an object or null if no data is found
  return sessionData ?? null;
};


exports.addSession = async (req,res) =>{
    try {
      let {matchId,type,name,minBet,maxBet,yesRate,noRate,yesPercent,noPercent,selectionId} = req.body
      const { id: loginId } = req.user;
      if(type == sessionBettingType.marketSession && !selectionId){
        return ErrorResponse({statusCode: 400,message: {msg: "required", keys : {name : "Selection id"} }},req,res);
      }
      
      const user = await getUserById(loginId,["allPrivilege","sessionMatchPrivilege","betFairMatchPrivilege"]);
      if(!user){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
      }
      let match = await getMatchById(matchId,["id","createBy","betFairSessionMinBet","betFairSessionMaxBet"])
      if(!match){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match"}}},req,res);
      }
      if(match.createBy != loginId){
        if(!user.allPrivilege){
          if(!user.sessionMatchPrivilege && !user.betFairMatchPrivilege){
            return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
          }
        }
      }
   
      if(!minBet){
        minBet = match.betFairSessionMinBet
      }
      if(!maxBet){
        maxBet = match.betFairSessionMaxBet
      }
      if(selectionId){
        type = sessionBettingType.marketSession
      }
      let status = teamStatus.suspended
      if(yesRate || noRate){
        status = teamStatus.active
      }
      let sessionData = {
        matchId,
        type,
        name,
        minBet,
        maxBet,
        yesRate,
        noRate,
        yesPercent,
        noPercent,
        selectionId,
        status,
        createBy: loginId
      }
      let session = await addSessionBetting(sessionData)
      if(!session){

        logger.error({
          error: `Error at add session betting in match :${matchId}`,
          session:sessionData
        });
        return ErrorResponse({statusCode: 400,message: {msg: "match.sessionAddFail" }},req,res);
      }

      const { createdAt, updatedAt, deletedAt, ...sessionRedisData } = session;

     
      await updateSessionMatchRedis(matchId,session?.id,sessionRedisData);


      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "created",
            keys: {
              name: "Session",
            },
          },
          data : session
        },
        req,
        res
      );
    } catch (error) {
      logger.error({
        error: `Error at adding session.`,
        stack: error.stack,
        message: error.message
      });
      return ErrorResponse(error, req, res);
    }
  }
  
  //update session betting general data
  
  exports.updateSession = async (req,res) =>{
    try {
      let {id,name,minBet,maxBet} = req.body
      const { id: loginId } = req.user;
      const user = await getUserById(loginId,["allPrivilege","sessionMatchPrivilege","betFairMatchPrivilege"]);
      if(!user){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
      }

      let session = await getSessionBettingById(id)
      if(!session){
        return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Session"}}},req,res);
      }

      if(session.createBy != loginId){
        if(!user.allPrivilege){
          if(!user.sessionMatchPrivilege && !user.betFairMatchPrivilege){
            return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
          }
        }
      }
  
      let sessionData = {
        name : name || session.name,
        minBet : minBet || session.minBet,
        maxBet : maxBet || session.maxBet
      }
      let updatedSession = await updateSessionBetting({id},sessionData)
      if(!updatedSession){
        logger.error({
          error: `Error at update session betting in match :${matchId}`,
          session:sessionData
        });
        return ErrorResponse({statusCode: 400,message: {msg: "match.sessionUpdateFail" }},req,res);
      }
      
     
      const { createdAt, updatedAt, deletedAt, ...sessionRedisData } = session;

     
      await updateSessionMatchRedis(session?.matchId,session?.id,{...sessionRedisData,...sessionData});
      
      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "updated",
            keys: {
              name: "Session",
            },
          },
          data : sessionData
        },
        req,
        res
      );
    } catch (error) {
      logger.error({
        error: `Error at update session.`,
        stack: error.stack,
        message: error.message
      });
      return ErrorResponse(error, req, res);
    }
  }

exports.getSessions = async (req, res) => {
  try {
    const {matchId}=req.params;
    const { id: sessionId } = req.query;
    let session;
    const select = [
      "id",
      "matchId",
      "type",
      "name",
      "minBet",
      "maxBet",
      "yesRate",
      "noRate",
      "yesPercent",
      "noPercent",
      "selectionId",
      "status",
      "createBy",
      "stopAt",
      "activeStatus",
      "isManual"      
    ];

    if (!sessionId) {
      const redisMatchData = await getAllSessionRedis(matchId);

      if (redisMatchData) {
        session = Object.values(redisMatchData);
      } else {
        session = await getSessionBettings({ matchId }, select);
        if (!session) {
          return ErrorResponse(
            {
              statusCode: 404,
              message: { msg: "notFound", keys: { name: "Session" } },
            },
            req,
            res
          );
        }
        for (let index = 0; index < session?.length; index++) {
          await updateSessionMatchRedis(
            matchId,
            session?.[index]?.id,
            session[index]
          );
        }
      }
    } else {
      const redisMatchData = await getSessionFromRedis(matchId, sessionId);

      if (redisMatchData) {
        session = redisMatchData;
      } else {
        session = await getSessionBettingById(sessionId, select);
        if (!session) {
          return ErrorResponse(
            {
              statusCode: 404,
              message: { msg: "notFound", keys: { name: "Session" } },
            },
            req,
            res
          );
        }
        await updateSessionMatchRedis(matchId, sessionId, session);
      }
    }

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Session",
          },
        },
        data: session,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at get list session.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
};