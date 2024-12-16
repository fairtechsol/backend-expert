const { addSessionBetting, getSessionBettingById, updateSessionBetting, getSessionBettings, getSessionBetting } = require("../services/sessionBettingService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { getUserById } = require("../services/userService");
const { sessionBettingType, teamStatus, socketData, betStatusType, bettingType, resultStatus, betStatus, gameType, gameTypeMatchBetting } = require("../config/contants");
const { getMatchById, updateMatch } = require("../services/matchService");
const { logger } = require("../config/logger");
const { getAllSessionRedis, getSessionFromRedis, settingAllSessionMatchRedis, updateSessionMatchRedis, hasSessionInCache, addAllsessionInRedis, hasMatchInCache, getMultipleMatchKey, updateMarketSessionIdRedis, getUserRedisData, deleteKeyFromMarketSessionId, getExpertsRedisSessionData, addDataInRedis, updateMultipleMarketSessionIdRedis, updateMatchInCache, updateMatchKeyInCache } = require("../services/redis/commonfunction");
const { sendMessageToUser } = require("../sockets/socketManager");
const { getSpecificResultsSession } = require("../services/betService");
const { getExpertResult } = require("../services/expertResultService");

exports.addSession = async (req, res) => {
  try {
    let { matchId, type, name, minBet, maxBet, yesRate, noRate, yesPercent, noPercent, selectionId, gtype = gameTypeMatchBetting.fancy, exposureLimit } = req.body
    const { id: loginId } = req.user;
    if (type == sessionBettingType.marketSession && !selectionId) {
      return ErrorResponse({ statusCode: 400, message: { msg: "required", keys: { name: "Selection id" } } }, req, res);
    }

    const user = await getUserById(loginId, ["allPrivilege", "sessionMatchPrivilege", "betFairMatchPrivilege"]);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }
    let match = await getMatchById(matchId, ["id", "createBy", "betFairSessionMinBet", "betFairSessionMaxBet", "stopAt", "matchType", "sessionMaxBets"])
    if (!match) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }
    if(match?.stopAt){
      return ErrorResponse({ statusCode: 400, message: { msg: "bet.matchDeclare" } }, req, res);
    }
    if (match.createBy != loginId) {
      if (!user.allPrivilege) {
        if (!user.sessionMatchPrivilege && !user.betFairMatchPrivilege) {
          return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
        }
      }
    }
    if(match.matchType==gameType.football){
      return ErrorResponse({ statusCode: 400, message: { msg: "notCreated", keys: { name: "Session" } } }, req, res); 
    }
    let isManual = true;
    if (!minBet) {
      minBet = match.betFairSessionMinBet
    }
    if (!maxBet) {
      maxBet = match?.sessionMaxBets?.[type] || match.betFairSessionMaxBet
    }
    if (exposureLimit == null) {
      exposureLimit = match?.sessionMaxBets?.[`${type}_exposureLimit`] ?? 500000;
    }
    let status = teamStatus.suspended
    if (yesRate || noRate) {
      status = teamStatus.active
    }
    if (selectionId) {
      isManual = false;
      status = teamStatus.active
      const isSessionExist = await getSessionBetting({ matchId: matchId, selectionId: selectionId }, ["id"]);
      if (isSessionExist) {
        return ErrorResponse({ statusCode: 400, message: { msg: "alreadyExist", keys: { name: "Session" } } }, req, res);
      }
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
      isManual,
      gtype,
      exposureLimit
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
    } else {
      addAllsessionInRedis(matchId);
    }

    if (status == teamStatus.active) {
      await updateMarketSessionIdRedis(matchId, selectionId, session.id);
    }
    sendMessageToUser(socketData.expertRoomSocket, socketData.sessionAddedEvent, session);

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "Session",
          },
        },
        data: session
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
exports.updateSession = async (req, res) => {
  try {
    let { id, name, minBet, maxBet, exposureLimit, isCommissionActive } = req.body
    const { id: loginId } = req.user;
    const user = await getUserById(loginId, ["allPrivilege", "sessionMatchPrivilege", "betFairMatchPrivilege"]);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }

    let session = await getSessionBettingById(id)
    if (!session) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Session" } } }, req, res);
    }

    if (session.createBy != loginId) {
      if (!user.allPrivilege) {
        if (!user.sessionMatchPrivilege && !user.betFairMatchPrivilege) {
          return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
        }
      }
    }

    let sessionData = {
      name: name || session.name,
      minBet: minBet ?? session.minBet,
      maxBet: maxBet ?? session.maxBet,
      exposureLimit: exposureLimit ?? session.exposureLimit,
      isCommissionActive: isCommissionActive ?? session.isCommissionActive
    }
    let updatedSession = await updateSessionBetting({ id }, sessionData)
    if (!updatedSession) {
      logger.error({
        error: `Error at update session betting in match :${matchId}`,
        session: sessionData
      });
      return ErrorResponse({ statusCode: 400, message: { msg: "match.sessionUpdateFail" } }, req, res);
    }

    const isSessionExist = await hasSessionInCache(session?.matchId);

    if (isSessionExist) {
      await updateSessionMatchRedis(session?.matchId, session?.id, { ...session, ...sessionData });
    }
    else {
      addAllsessionInRedis(session?.matchId);
    }

    sendMessageToUser(socketData.expertRoomSocket, socketData.sessionUpdatedEvent, { ...session, ...sessionData });


    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "updated",
          keys: {
            name: "Session",
          },
        },
        data: { ...sessionData, id: id }
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
        session = await getSessionBettings({ matchId, activeStatus: betStatusType.live });
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
        let apiSelectionIdObj = {};
        for (let index = 0; index < session?.length; index++) {
          if (session[index]?.activeStatus == betStatusType.live) {
            if (session?.[index]?.selectionId) {
              apiSelectionIdObj[session?.[index]?.selectionId] = session?.[index]?.id;
            }
            result[session?.[index]?.id] = JSON.stringify(session?.[index]);
          }
          session[index] = JSON.stringify(session?.[index]);
        }
        settingAllSessionMatchRedis(matchId, result);
        updateMultipleMarketSessionIdRedis(matchId, apiSelectionIdObj);
      }
    } else {
      const redisMatchData = await getSessionFromRedis(matchId, sessionId);
      let expertResults = await getExpertResult({ betId: sessionId });

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
        addAllsessionInRedis(matchId, null);
      }

      const isMatch = await hasMatchInCache(matchId);
      let match;
      if (isMatch) {
        match = await getMultipleMatchKey(matchId);
        match = {
          apiSessionActive: JSON.parse(match?.apiSessionActive),
          manualSessionActive: JSON.parse(match?.manualSessionActive),
          marketId: match?.marketId,
          stopAt: match?.stopAt,
        };


      } else {
        match = await getMatchById(matchId, [
          "apiSessionActive",
          "manualSessionActive",
          "marketId",
          "stopAt",
        ]);
      }

      if (expertResults?.length != 0 && !(session.activeStatus == betStatus.result)) {
        if (expertResults?.length == 1) {
          session.resultStatus = resultStatus.pending;
        }
        else {
          session.resultStatus = resultStatus.missMatched;
        }

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
    let { status, matchId, stopAllSessions, type } = req.body;
    const user = await getUserRedisData(reqUser.id);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }

    if (stopAllSessions) {
      let conditionObj = { matchId: matchId, isManual: false, activeStatus: betStatusType.live };
      if(type) {
        conditionObj.type = type;
      }
      let sessionData = await getSessionBettings(conditionObj);
      if (!sessionData?.length) {
        return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Session" } } }, req, res);
      }
      if (sessionData[0].createBy != reqUser.id) {
        if (!user.allPrivilege) {
          if (!user.sessionMatchPrivilege) {
            return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
          }
        }
      }
      let sessions = {};
      let sessionDetailData = {};


      await updateSessionBetting(conditionObj, { activeStatus: status });

      sessionData?.map((item) => {
        sessions[item?.selectionId] = item?.id;
        item.activeStatus = status;
        item.updatedAt = new Date();
        sessionDetailData[item?.id] = JSON.stringify(item);
      });

      settingAllSessionMatchRedis(matchId, sessionDetailData);
      // Update redis cache
      if (status == betStatusType.live) {
        await updateMultipleMarketSessionIdRedis(matchId, sessions);
      } else if (status == betStatusType.save) {
        deleteKeyFromMarketSessionId(matchId, ...sessionData?.map((item) => {
          return item?.selectionId
        }));
      }
    }
    else {

      let sessionData = await getSessionBettingById(sessionId);
      if (!sessionData) {
        return ErrorResponse({ statusCode: 404, message: { msg: "NotFound", keys: "Session" } });
      }
      if(sessionData.activeStatus == betStatus.result || sessionData == betStatus.close){
        return ErrorResponse({ statusCode: 403, message: { msg: "bet.resultDeclareOrProgress" } });
      }
      if (sessionData.createBy != reqUser.id) {
        if (!user.allPrivilege) {
          if (!user.sessionMatchPrivilege) {
            return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
          }
        }
      }
      await updateSessionBetting({ id: sessionId }, { activeStatus: status });
      sessionData.activeStatus = status;
      sessionData.updatedAt = new Date();
      updateSessionMatchRedis(sessionData.matchId, sessionData.id, sessionData);
      // Update redis cache
      if (status == betStatusType.live) {
        await updateMarketSessionIdRedis(sessionData.matchId, sessionData.selectionId, sessionId);
      } else if (status == betStatusType.save) {
        deleteKeyFromMarketSessionId(sessionData.matchId, sessionData.selectionId);
      }
    }
    return SuccessResponse({ statusCode: 200 }, req, res);

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

exports.getSessionBetResult = async (req, res) => {
  try {
    const { matchId } = req.params;

    const sessionResults = await getSpecificResultsSession({
      matchId: matchId,
      betType: bettingType.session
    });

    return SuccessResponse(
      {
        statusCode: 200,
        data: sessionResults
      },
      req,
      res
    );

  } catch (error) {
    logger.error({
      error: `Error at get session results`,
      stack: error.stack,
      message: error.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(error, req, res);
  }

}

//update session betting general data
exports.updateSessionMaxBet = async (req, res) => {
  try {
    let { matchId, maxBet, minBet, type, exposureLimit } = req.body
    const { id: loginId } = req.user;
    const user = await getUserById(loginId, ["allPrivilege", "sessionMatchPrivilege", "betFairMatchPrivilege"]);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }

    let match = await getMatchById(matchId, ["id", "sessionMaxBets"]);
    if (!match) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }

    if (match.createBy != loginId) {
      if (!user.allPrivilege) {
        if (!user.sessionMatchPrivilege && !user.betFairMatchPrivilege) {
          return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
        }
      }
    }

    if (maxBet < (minBet ?? match.betFairSessionMinBet)) {
      return ErrorResponse({ statusCode: 400, message: { msg: "match.maxMustBeGreater" } }, req, res);
    }

    await updateMatch({ id: matchId }, { sessionMaxBets: { ...match.sessionMaxBets, [type]: maxBet, [`${type}_minBet`]: minBet ?? match.betFairSessionMinBet, [`${type}_exposureLimit`]: exposureLimit } })
    const isExistInRedis = await hasMatchInCache(matchId);
    if (isExistInRedis) {
      await updateMatchKeyInCache(matchId, "sessionMaxBets", JSON.stringify({ ...match.sessionMaxBets, [type]: maxBet, [`${type}_minBet`]: minBet ?? match.betFairSessionMinBet, [`${type}_exposureLimit`]: exposureLimit }))
    }
    let sessionData = {
      maxBet: maxBet,
      minBet: minBet ?? match.betFairSessionMinBet,
      ...(exposureLimit != null ? { exposureLimit: exposureLimit } : {})
    }
    let updatedSession = await updateSessionBetting({ matchId: matchId, type: type }, sessionData);
    if (!updatedSession) {
      logger.error({
        error: `Error at update session betting in match :${matchId}`,
        session: sessionData
      });
      return ErrorResponse({ statusCode: 400, message: { msg: "match.sessionUpdateFail" } }, req, res);
    }

    const isSessionExist = await hasSessionInCache(matchId);

    if (isSessionExist) {
      let sessions = await getSessionBettings({ matchId: matchId , type: type});
      sessions = sessions.reduce((prev, curr) => {
        prev[curr.id] = JSON.stringify(curr);
        return prev;
      }, {});
      await settingAllSessionMatchRedis(matchId, sessions);
    }
    else {
      addAllsessionInRedis(matchId);
    }

    sendMessageToUser(socketData.expertRoomSocket, socketData.multiSessionUpdatedEvent, { type: type, maxBet: maxBet, matchId: matchId, minBet: minBet, exposureLimit: exposureLimit });


    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "updated",
          keys: {
            name: "Session",
          },
        },
        data: { ...sessionData, matchId: matchId, type: type }
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