
const { addSessionBetting, getSessionBettingById, updateSessionBetting, getSessionBetting, getSessionBettings, getSessionBattingByMatchId } = require("../services/sessionBettingService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const {getUserById} = require("../services/userService");
const { sessionBettingType, teamStatus, socketData, betStatusType } = require("../config/contants");
const { getMatchById } = require("../services/matchService");
const { logger } = require("../config/logger");
const { getAllSessionRedis, getSessionFromRedis, settingAllSessionMatchRedis, updateSessionMatchRedis, hasSessionInCache,addAllsessionInRedis, hasMatchInCache, getMultipleMatchKey,  updateMarketSessionIdRedis, getUserRedisData,  deleteKeyFromMarketSessionId, getExpertsRedisSessionData } = require("../services/redis/commonfunction");
const { sendMessageToUser } = require("../sockets/socketManager");



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
      let isManual = true;
      if(!minBet){
        minBet = match.betFairSessionMinBet
      }
      if(!maxBet){
        maxBet = match.betFairSessionMaxBet
      }
      let status = teamStatus.suspended
      if(yesRate || noRate){
        status = teamStatus.active
      }
      if(selectionId){
        isManual = false;
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
        createBy: loginId,
        isManual
      }
      let session = await addSessionBetting(sessionData)
      if (!session) {
        logger.error({
          error: `Error at add session betting in match :${matchId}`,
          session: sessionData,
        });
        return ErrorResponse(
          { statusCode: 400, message: { msg: "match.sessionAddFail" } },
          req,
          res
        );
      }

      const isSessionExist = await hasSessionInCache(matchId);

      if (isSessionExist) {
        await updateSessionMatchRedis(matchId, session?.id, session);
      }
      else{
        addAllsessionInRedis(matchId);
      }

      if(status == teamStatus.active){
        await updateMarketSessionIdRedis(matchId,selectionId,session.id);
      }

      sendMessageToUser(socketData.expertRoomSocket,socketData.sessionAddedEvent,session);


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
      
      const isSessionExist = await hasSessionInCache(session?.matchId);

      if (isSessionExist) {
        await updateSessionMatchRedis(session?.matchId,session?.id,{...session,...sessionData});
      }
      else{
        addAllsessionInRedis(session?.matchId);
      }

      sendMessageToUser(socketData.expertRoomSocket,socketData.sessionUpdatedEvent,{...session,...sessionData});

      
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
    const { matchId } = req.params;
    const { id: sessionId } = req.query;
    let session;

    if (!sessionId) {
      const redisMatchData = await getAllSessionRedis(matchId);

      if (redisMatchData) {
        session = Object.values(redisMatchData);
      } else {
        session = await getSessionBettings({ matchId });
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
        let result = {};
        for (let index = 0; index < session?.length; index++) {
          if (session[index]?.activeStatus == betStatusType.live) {
            result[session?.[index]?.id] = JSON.stringify(session?.[index]);
          }
          session[index] = JSON.stringify(session?.[index]);
        }
        await settingAllSessionMatchRedis(matchId, result);
      }
    } else {
      const redisMatchData = await getSessionFromRedis(matchId, sessionId);

      if (redisMatchData) {
        session = redisMatchData;
      } else {
        session = await getSessionBettingById(sessionId);
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
        addAllsessionInRedis(matchId,null);
      }

      const isMatch = await hasMatchInCache(matchId);
      let match;
      if (isMatch) {
        match = await getMultipleMatchKey(matchId);
        match = {
          apiSessionActive: JSON.parse(match?.apiSessionActive),
          manualSessionActive: JSON.parse(match?.manualSessionActive),
          marketId: match?.marketId,
        };


      } else {
        match =await getMatchById(matchId, [
          "apiSessionActive",
          "manualSessionActive",
          "marketId"
        ]);
      }

      session = { ...session, ...match };
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

exports.updateMarketSessionActiveStatus = async (req, res) => {
  try {
    let reqUser = req.user;
    let sessionId = req.params.id;
    let {status} = req.body;
    const user = await getUserRedisData(reqUser.id);
    if(!user){
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
    }
    let sessionData = await getSessionBettingById(sessionId);
    if(!sessionData){
      return ErrorResponse({statusCode: 404,message:{msg:"NotFound",keys : "Session"}});
    }
    if(sessionData.createBy != reqUser.id){
      if(!user.allPrivilege){
        if(!user.sessionMatchPrivilege){
          return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
        }
      }
    }
    let updateSession = await updateSessionBetting({id : sessionId},{activeStatus : status});
    // Update redis cache
      if(status == betStatusType.live){
        await updateMarketSessionIdRedis(sessionData.matchId,sessionData.selectionId,sessionId);
      }else if(status == betStatusType.save){
        deleteKeyFromMarketSessionId(sessionData.matchId,sessionData.selectionId);
      }
      return SuccessResponse({statusCode: 200,message: {msg: "updated",keys: {name: "Session"}}}, req,res);

  } catch (error) {
    logger.error({
      error: `Error At update Market Session Active Status.`,
      stack: error.stack,
      message: error.message,
      });
      return ErrorResponse(error, req, res);
  }
}

exports.getSessionProfitLoss = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    let sessionProfitLoss = await getExpertsRedisSessionData(sessionId);
    if (sessionProfitLoss) {
      sessionProfitLoss = JSON.parse(sessionProfitLoss);
    }
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Session profit/loss" } },
        data: sessionProfitLoss,
      },
      req,
      res
    );

  } catch (error) {
    logger.error({
      error: `Error at get session profit loss.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(
      {
        statusCode: 500,
        message: error.message,
      },
      req,
      res
    );
  }
};