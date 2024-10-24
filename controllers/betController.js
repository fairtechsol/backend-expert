const { Not, In } = require("typeorm");
const {
  betStatus,
  socketData,
  teamStatus,
  walletDomain,
  betStatusType,
  bettingType,
  noResult,
  redisKeys,
  matchBettingType,
  resultStatus,
  mainMatchMarketType,
  marketBettingTypeByBettingType,
  redisKeysMarketWise,
  scoreBasedMarket,
  otherEventMatchBettingRedisKey,
  betType,
} = require("../config/contants");
const { logger } = require("../config/logger");
const { addResult, deleteResult, getResult } = require("../services/betService");
const {
  getExpertResult,
  addExpertResult,
  deleteExpertResult,
  updateExpertResult,
  deleteAllExpertResult,
} = require("../services/expertResultService");
const { getMatchBattingByMatchId, updateMatchBetting, getMatchBettingById, getMatchBetting, getMatchAllBettings } = require("../services/matchBettingService");
const { getMatchById, addMatch } = require("../services/matchService");
const {
  getSessionFromRedis,
  updateSessionMatchRedis,
  deleteKeyFromMarketSessionId,
  deleteKeyFromManualSessionId,
  deleteKeyFromExpertRedisData,
  updateMarketSessionIdRedis,
  setExpertsRedisData,
  deleteAllMatchRedis,
  deleteKeyFromMatchRedisData,
  settingAllBettingMatchRedisStatus,
  getSingleMatchKey,
  settingMatchKeyInCache,
  settingAllBettingOtherMatchRedisStatus,
  settingAllBettingRacingMatchRedisStatus,
  getRedisKey,
  setRedisKey,
  deleteRedisKey,
} = require("../services/redis/commonfunction");
const {
  getSessionBettingById,
  updateSessionBetting,
  addSessionBetting,
  getSessionBettings,
} = require("../services/sessionBettingService");
const { sendMessageToUser } = require("../sockets/socketManager");
const { apiCall, apiMethod, allApiRoutes } = require("../utils/apiService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { extractNumbersFromString } = require("../services/commonService");
const { getRacingMatchById, raceAddMatch } = require("../services/racingMatchService");
const { getRaceBettingWithRunners, updateRaceBetting } = require("../services/raceBettingService");
const { getTournamentBettingWithRunners, updateTournamentBetting, getTournamentBetting, getTournamentBettings } = require("../services/tournamentBettingService");
const { removeBlinkingTabs } = require("../services/blinkingTabsService");


exports.getPlacedBets = async (req, res, next) => {
  try {
    const result = await apiCall(apiMethod.get, walletDomain + allApiRoutes.wallet.bets, null, {}, req.query)
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at get bet wallet side`,
          stack: err.stack,
          message: err.message,
        });
        throw err;
      });

    return SuccessResponse(
      {
        statusCode: 200,
        data: result?.data,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at get bet.`,
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
}
exports.declareSessionResult = async (req, res) => {
  let isResultChange = false;
  const { betId, matchId, score } = req.body;
  const { id: userId } = req.user;
  try {

    const isRedisSessionResultDeclare= await getRedisKey(`${betId}${redisKeys.declare}`);

    if (isRedisSessionResultDeclare) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.sessionDeclare" },
        },
        req,
        res
      );
    }
    await setRedisKey(`${betId}${redisKeys.declare}`, true);

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

    if (match?.stopAt) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    const isSessionDeclared = await getResult({
      betId: betId,
      matchId: matchId
    }, ["id"]);

    if (isSessionDeclared) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.sessionDeclare" },
        },
        req,
        res
      );
    }
    // check result already declare
    let resultDeclare = await getSessionBettingById(betId);
    if (resultDeclare && resultDeclare.activeStatus == betStatus.result) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }
    await updateSessionBetting({ id: betId },
      { activeStatus: betStatus.result, result: score }
    );

    isResultChange = true;

    const resultValidate = await checkResult({
      betId: resultDeclare.id,
      matchId: resultDeclare.matchId,
      isSessionBet: true,
      userId: userId,
      result: score,
      selectionId: resultDeclare.selectionId,
      match: match
    })

    if (resultValidate) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId },
        { activeStatus: betStatus.save, result: null }
      );
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareSessionResult,
      {
        betId,
        score,
        sessionDetails: resultDeclare,
        userId,
        matchId,
        match
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await deleteRedisKey(`${betId}${redisKeys.declare}`);
        let bet = await getSessionBettingById(betId);
        bet.activeStatus = betStatusType.save;
        bet.result = null;
        await addSessionBetting(bet);
        await deleteExpertResult(betId, userId);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.session,
      betId: betId,
      matchId: matchId,
      result: score,
      profitLoss: fwProfitLoss,
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.sessionResultDeclared,
      {
        matchId: matchId,
        betId: betId,
        score,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
      }
    );

    await deleteKeyFromManualSessionId(matchId, betId);
    await deleteKeyFromExpertRedisData(betId + redisKeys.profitLoss);
    await deleteRedisKey(`${betId}${redisKeys.declare}`);

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Bet Result declared",
          },
        },
        data: {
          score,
          profitLoss: fwProfitLoss,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at result declare match`,
      stack: err.stack,
      message: err.message,
    });

    if(isResultChange){
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId },
        { activeStatus: betStatus.save, result: null }
      );
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareSessionNoResult = async (req, res) => {
  let isResultChange = false;
  const { betId, matchId } = req.body;
  const { id: userId } = req.user;
  try {
    const isRedisSessionResultDeclare= await getRedisKey(`${betId}${redisKeys.declare}`);

    if (isRedisSessionResultDeclare) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.sessionDeclare" },
        },
        req,
        res
      );
    }
    await setRedisKey(`${betId}${redisKeys.declare}`, true);

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

    if (match?.stopAt) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    const isSessionDeclared = await getResult({
      betId: betId,
      matchId: matchId
    }, ["id"]);

    if (isSessionDeclared) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.sessionDeclare" },
        },
        req,
        res
      );
    }

    // check result already declare
    let resultDeclare = await getSessionBettingById(betId);
    if (resultDeclare && resultDeclare.activeStatus == betStatus.result) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }
    await updateSessionBetting({ id: betId }, { activeStatus: betStatus.result, result: noResult });

    isResultChange = true;
    
    const resultValidate = await checkResult({
      betId: resultDeclare.id,
      matchId: resultDeclare.matchId,
      isSessionBet: true,
      userId: userId,
      result: noResult,
      selectionId: resultDeclare.selectionId,
    })

    if (resultValidate) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId },
        { activeStatus: betStatus.save, result: null }
      );

      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareSessionNoResult,
      {
        score: noResult,
        betId,
        noResult,
        userId,
        matchId,
        match
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at no result declare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await deleteRedisKey(`${betId}${redisKeys.declare}`);
        let bet = await getSessionBettingById(betId);
        bet.activeStatus = betStatusType.save;
        bet.result = null;
        await addSessionBetting(bet);
        await deleteExpertResult(betId, userId);

        throw err;
      });

    isResultChange = false;

    await addResult({
      betType: bettingType.session,
      betId: betId,
      matchId: matchId,
      result: noResult,
      profitLoss: 0,
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.sessionResultDeclared,
      {
        matchId: matchId,
        betId: betId,
        score: noResult,
        profitLoss: 0,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result
      }
    );

    await deleteKeyFromExpertRedisData(`${betId}${redisKeys.profitLoss}`);
    await deleteKeyFromManualSessionId(matchId, betId);
    await deleteRedisKey(`${betId}${redisKeys.declare}`);

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Bet no result declared",
          },
        },
        data: {
          score: noResult,
          betId,
          matchId,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at no result declare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId },
        { activeStatus: betStatus.save, result: null }
      );
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareSessionResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;

  const { betId, matchId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);
    if (match?.stopAt) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getSessionBettingById(betId);
    if (!bet) {
      logger.error({
        message: "Error in unDeclare no bet found",
        data: {
          betId
        }
      });
      return ErrorResponse(
        {
          statusCode: 404,
          message: {
            msg: "notFound", keys: {
              name: "Bet"
            }
          },
        },
        req,
        res
      );
    }

    if (bet.activeStatus == betStatusType.live || bet.activeStatus == betStatusType.save) {
      logger.error({
        message: "Error in unDeclare no bet found",
        data: {
          betId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateSessionBetting(
      { id: betId },
      {
        activeStatus: betStatus.live,
        result: null,
      }
    );
    isResultChange = true;
    oldResult = bet.result;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareSessionResult,
      {
        betId,
        userId,
        matchId,
        sessionDetails: bet
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        let bettingGame = await getSessionBettingById(betId);
        bettingGame.activeStatus = betStatusType.result;
        bettingGame.result = bet.result;
        await addSessionBetting(bettingGame);
        throw err;
      });

    isResultChange = false;

    await deleteResult(betId);
    await deleteAllExpertResult(betId);

    bet.activeStatus = betStatusType.live;
    bet.result = null;

    if (bet?.selectionId && bet?.selectionId != "") {
      await updateMarketSessionIdRedis(bet.matchId, bet.selectionId, bet.id);
      await updateSessionMatchRedis(bet.matchId, bet.id, bet);
    } else {
      await updateSessionMatchRedis(bet.matchId, bet.id, bet);
    }

    await setExpertsRedisData({
      [`${bet.id}${redisKeys.profitLoss}`]: JSON.stringify(response?.data?.profitLossObj),
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.sessionResultDeclared,
      {
        matchId: matchId,
        betId: betId,
        profitLoss: response?.data?.profitLoss,
        profitLossObj: response?.data?.profitLossObj,
        activeStatus: betStatusType.live
      }
    );

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Bet result undeclared",
          },
        },
        data: {
          betId,
          matchId,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      await updateSessionBetting(
        { id: betId },
        {
          activeStatus: betStatus.result,
          result: oldResult,
        }
      );
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

const checkResult = async (body) => {
  const { betId, matchId, isSessionBet, userId, result, betType, isOtherMatch, isRacingMatch } = body;
  let checkExistResult = await getExpertResult({
    betId: betId
  });

  if (isSessionBet) {
    let redisSession = await getSessionFromRedis(matchId, betId);
    if (redisSession) {
      try {
        let redisSessionData = redisSession;
        redisSessionData["noRate"] = 0;
        redisSessionData["yesRate"] = 0;
        redisSessionData["yesPercent"] = 0;
        redisSessionData["noPercent"] = 0;
        redisSessionData["activeStatus"] = betStatus.save;
        redisSessionData["status"] = teamStatus.suspended;
        redisSessionData["updatedAt"] = new Date();

        await updateSessionMatchRedis(matchId, betId, redisSession);
        await updateSessionBetting({ id: betId }, {
          noRate: 0,
          yesRate: 0,
          yesPercent: 0,
          noPercent: 0,
          status: teamStatus.suspended
        });

        sendMessageToUser(
          socketData.expertRoomSocket,
          socketData.updateSessionRateClient,
          redisSessionData,
        );
      } catch (error) { }
    }
  }
  else if (betType) {
    const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[betType], 'json');
    if (betType == matchBettingType.other || betType == matchBettingType.tournament) {
      matchData.find((item) => item?.id == betId).activeStatus = betStatus.save;
    }
    else {
      matchData.activeStatus = betStatus.save;
    }
    await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[betType]]: JSON.stringify(matchData) });
  }
  else if(isOtherMatch) {
    await settingAllBettingOtherMatchRedisStatus(matchId, betStatus.save);
  }
  else if(isRacingMatch){
    await settingAllBettingRacingMatchRedisStatus(matchId, betStatus.save);
  }
  else{
    await settingAllBettingMatchRedisStatus(matchId, betStatus.save);
  }


  if (!checkExistResult?.length) {
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: true,
      isReject: false,
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.updateInResultDeclare,
      { matchId, betId, status: resultStatus.pending, userId, betType }
    );

    return true;
  }
  else if (checkExistResult?.find((item) => item?.result == result && item?.userId != userId)) {

    await updateExpertResult({ betId: betId, userId: userId }, {
      result: result
    });
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: true,
      isReject: false,
    });
  }
  else if (checkExistResult?.find((item) => item?.userId == userId)) {
    await updateExpertResult({ betId: betId, userId: userId }, {
      result: result
    });
    return true;
  }
  else if (!checkExistResult?.find((item) => item?.result == result)) {
    await updateExpertResult({ betId: betId, userId: userId }, {
      isReject: true
    });
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: false,
      isReject: true,
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.updateInResultDeclare,
      { matchId, betId, status: resultStatus.missMatched, userId, betType }
    );

    throw {
      statusCode: 400,
      message: { msg: "bet.resultReject" },
    };
  }
};

exports.declareMatchResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result } = req.body;
  const { id: userId } = req.user;
  try {
      const isRedisSessionResultDeclare= await getRedisKey(`${matchId}${redisKeys.declare}`);

    if (isRedisSessionResultDeclare) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }
    await setRedisKey(`${matchId}${redisKeys.declare}`, true);

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

    if (!match) {
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "notFound", keys: { name: "Match" } },
      }, req, res
      );
    }

    if (match?.stopAt) {
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res
      );
    }

    // check result already declare
    let resultDeclare = await getMatchAllBettings({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) });
    const matchOddBetting = resultDeclare?.find(
      (item) => item.type == matchBettingType.quickbookmaker1
    );


    if (resultDeclare?.length > 0 && matchOddBetting.activeStatus == betStatus.result) {
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    const isMatchDeclared = await getResult({ betId: matchOddBetting.id, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res);
    }
    await updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });

    isResultChange = true;

    const sessions = await getSessionBettings({ matchId: matchId, activeStatus: Not(betStatus.result) }, ["id"]);
    if (sessions?.length > 0) {
      logger.error({
        error: `Sessions is not declared yet.`,
      });
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      updateMatchBetting({ matchId: matchId , type: Not(In([matchBettingType.other, matchBettingType.tournament]))}, { activeStatus: betStatus.save, result: null, stopAt: null});
      
      return ErrorResponse(
        { statusCode: 403, message: { msg: "bet.sessionAllResult" } },
        req,
        res
      );
    }

    const otherMatchBetting = await getMatchBetting({ matchId: matchId, activeStatus: Not(betStatus.result), type: matchBettingType.other }, ["id"]);
    let resultDeclareTournament = await getTournamentBetting({ matchId: matchId, activeStatus: Not(betStatus.result) });
    if (otherMatchBetting || resultDeclareTournament) {
      logger.error({
        error: `Other match is not declared yet.`,
      });
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.save, result: null, stopAt: null });
      
      return ErrorResponse(
        { statusCode: 403, message: { msg: "bet.declareOtherMarket" } },
        req,
        res
      );
    }

    const resultValidate = await checkResult({
      betId: matchOddBetting.id,
      matchId: matchOddBetting.matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      match: match
    });

    if (resultValidate) {
      await deleteRedisKey(`${matchId}${redisKeys.declare}`);
      updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareMatchResult,
      {
        result,
        matchDetails: resultDeclare,
        userId,
        matchId,
        matchOddId: matchOddBetting.id,
        match
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await deleteRedisKey(`${matchId}${redisKeys.declare}`);
        await updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.save, result: null, stopAt: null});
        await deleteExpertResult(matchOddBetting.id, userId);
        throw err;
      });
    isResultChange = false;


    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;


    await addResult({
      betType: bettingType.match,
      betId: matchOddBetting.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss,
      commission: response?.data?.totalCommission
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        result,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result
      }
    );

    deleteAllMatchRedis(matchId);
    deleteKeyFromExpertRedisData(redisKeys.userTeamARate + matchId, redisKeys.userTeamBRate + matchId, redisKeys.userTeamCRate + matchId, redisKeys.yesRateTie + matchId, redisKeys.noRateTie + matchId, redisKeys.yesRateComplete + matchId, redisKeys.noRateComplete + matchId)
    match.stopAt = new Date();

    addMatch(match);
    await deleteRedisKey(`${matchId}${redisKeys.declare}`);
    await removeBlinkingTabs({ matchId: matchId });

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Match Result declared",
          },
        },
        data: {
          result,
          profitLoss: fwProfitLoss,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at result declare match`,
      stack: err.stack,
      message: err.message,
    });
    await deleteRedisKey(`${matchId}${redisKeys.declare}`);
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId , type: Not(In([matchBettingType.other, matchBettingType.tournament]))}, { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareMatchResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;
  let oldStopAt = null;
  const { matchId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "notFound", keys: {
              name: "Match"
            }
          },
        },
        req,
        res
      );
    }

    if (!match?.stopAt) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getMatchAllBettings({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) });
    const matchOddBetting = bet?.find(
      (item) => item.type == matchBettingType.quickbookmaker1
    );
    if (bet?.length == 0) {
      logger.error({
        message: "Error in unDeclare match",

      });
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    if (matchOddBetting.activeStatus != betStatus.result) {
      logger.error({
        message: "Error in unDeclare match no bet found",
        data: {
          matchId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = matchOddBetting.result;
    oldStopAt = match?.stopAt;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareMatchResult,
      {
        matchOddId: matchOddBetting?.id,
        userId,
        matchId,
        match,
        matchBetting: bet
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.result, result: matchOddBetting.result, stopAt: match?.stopAt });
        throw err;
      });

    isResultChange = false;

    await deleteResult(matchOddBetting.id);
    await deleteAllExpertResult(matchOddBetting.id);
    await deleteAllMatchRedis(matchId);

    if (response?.data?.profitLossWallet) {
      await setExpertsRedisData(response?.data?.profitLossWallet);
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        profitLoss: response?.data?.profitLoss,
        activeStatus: betStatusType.live
      }
    );

    match.stopAt = null;
    addMatch(match);

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId, type: Not(In([matchBettingType.other, matchBettingType.tournament])) }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareMatchOtherMarketResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare other match",
      data: match,
      result: result,
      betId: betId
    });

    if (!match) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "notFound", keys: { name: "Match" } },
      }, req, res
      );
    }

    if (match?.stopAt) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res
      );
    }

    // check result already declare
    let matchBettingDetails = await getMatchBettingById(betId);
    
    if (matchBettingDetails?.activeStatus == betStatus.result) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    let dbScore = result;


    const isMatchDeclared = await getResult({ betId: matchBettingDetails.id, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res);
    }
    await updateMatchBetting({ matchId: matchId, id: betId }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const resultValidate = await checkResult({
      betId: matchBettingDetails.id,
      matchId: matchBettingDetails.matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      match: match,
      betType: matchBettingDetails?.type,
      isOtherMatch: true
    });

    if (resultValidate) {
      await updateMatchBetting({ matchId: matchId, id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareOtherMarketResult,
      {
        result: dbScore,
        matchBettingDetail: matchBettingDetails,
        userId,
        matchId,
        matchOddId: matchBettingDetails.id,
        match,
        matchBettingTypeData: matchBettingDetails?.type,
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare other market match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateMatchBetting({ matchId: matchId, id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
        await deleteExpertResult(matchBettingDetails.id, userId);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.match,
      betId: matchBettingDetails.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss,
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        result,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
        betId: matchBettingDetails?.id,
        betType: matchBettingDetails?.type
      }
    );


    const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchBettingDetails?.type], 'json');

    matchData.find((item) => item.id == betId).activeStatus = betStatus.result;
    matchData.find((item) => item.id == betId).result = result;
    matchData.find((item) => item.id == betId).stopAt = new Date();
    matchData.find((item) => item.id == betId).updatedAt = new Date();
    await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchBettingDetails?.type]]: JSON.stringify(matchData) });
    
    await deleteKeyFromExpertRedisData(redisKeys.expertRedisData, ...redisKeysMarketWise[matchBettingDetails.type].map((item) => item + betId + "_" + matchId));

    await addMatch(match);

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Match Result declared",
          },
        },
        data: {
          result,
          profitLoss: fwProfitLoss,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at result declare other match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId,  id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareMatchOtherMarketResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;
  let oldStopAt = null;
  const { matchId, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);

    logger.info({
      message: "Result un declare other market match",
      data: match,
      betId: betId
    });

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "notFound", keys: {
              name: "Match"
            }
          },
        },
        req,
        res
      );
    }

    if (match.stopAt) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: { msg: "bet.matchAlreadyDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getMatchBettingById(betId);
    
    if (!bet) {
      logger.error({
        message: "Error in unDeclare other match",

      });
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    if (bet.activeStatus != betStatus.result) {
      logger.error({
        message: "Error in unDeclare match no bet found",
        data: {
          matchId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateMatchBetting({ matchId: matchId,  id: betId }, { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = bet.result;
    oldStopAt = match?.stopAt;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareOtherMarketResult,
      {
        matchOddId: bet?.id,
        userId,
        matchId,
        match,
        matchBetting: bet,
        matchBettingTypeData: bet?.type
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateMatchBetting({ matchId: matchId, id: betId }, { activeStatus: betStatus.result, result: bet.result, stopAt: match?.stopAt });
        throw err;
      });

    isResultChange = false;

    await deleteResult(bet.id);
    await deleteAllExpertResult(bet.id);

    if (response?.data?.profitLossWallet) {
      await setExpertsRedisData(response?.data?.profitLossWallet);
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        profitLoss: response?.data?.profitLoss,
        activeStatus: betStatusType.live,
        betId: bet?.id,
        betType: bet?.type,
        profitLossData: response?.data?.profitLossWallet,
        teamArateRedisKey: `${otherEventMatchBettingRedisKey[bet?.type]?.a}${bet?.type == matchBettingType.other ? bet?.id+ "_"  : ""}${matchId}`,
        teamBrateRedisKey: `${otherEventMatchBettingRedisKey[bet?.type]?.b}${bet?.type == matchBettingType.other ? bet?.id + "_" : ""}${matchId}`,
        teamCrateRedisKey: `${otherEventMatchBettingRedisKey[bet?.type]?.c}${bet?.type ==matchBettingType.other?bet?.id+ "_" :""}${matchId}`,
      }
    );
  
      const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[bet?.type], 'json'); 
      matchData.find((item)=>item.id==bet?.id).activeStatus = betStatus.save;
      matchData.find((item)=>item.id==bet?.id).result = null;
      matchData.find((item)=>item.id==bet?.id).stopAt = null;
      matchData.find((item)=>item.id==bet?.id).updatedAt = new Date();
      await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[bet?.type]]: JSON.stringify(matchData) });
    
    await addMatch(match);

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId, id: betId }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareOtherMatchResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare other match",
      data: match,
      result: result,
      betId: betId
    });

    if (!match) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "notFound", keys: { name: "Match" } },
      }, req, res
      );
    }

    if (match?.stopAt) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res
      );
    }

    // check result already declare
    let matchBettingDetails = await getMatchBattingByMatchId(matchId);
    let matchOddBetting;

    if(betId){
      matchOddBetting = matchBettingDetails?.find(
        (item) => item.id == betId
      );
    }
    else{
      matchOddBetting = matchBettingDetails?.find(
        (item) => item.type == matchBettingType.quickbookmaker1
      );
    }
    if (matchBettingDetails?.length > 0 && matchOddBetting?.activeStatus == betStatus.result) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    let dbScore = result;

    if (scoreBasedMarket.find((item) => matchOddBetting?.type?.startsWith(item)) && result != noResult) {
      const currScore = extractNumbersFromString(matchOddBetting?.type);
      dbScore = parseFloat(result) < parseFloat(currScore) ? "UNDER" : "OVER";
    }

    if(!betId){
      let isOtherMatchResultDeclared = matchBettingDetails?.filter((item) => !mainMatchMarketType.includes(item?.type) && item?.activeStatus != betStatus.result);
      const resultDeclareTournament = await getTournamentBetting({ matchId: matchId, activeStatus: Not(betStatus.result) });

      if (isOtherMatchResultDeclared?.length > 0 || resultDeclareTournament) {
        logger.error({
          error: `Other match markets is not declared yet.`,
        });
        return ErrorResponse({
          statusCode: 400,
          message: { msg: "bet.declareOtherMarket" },
        }, req, res);
      }
    }

    const isMatchDeclared = await getResult({ betId: matchOddBetting.id, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res);
    }



    await updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const resultValidate = await checkResult({
      betId: matchOddBetting.id,
      matchId: matchOddBetting.matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      match: match,
      ...(betId ? { betType: matchBettingDetails?.type } : {}),
      isOtherMatch: true
    });

    if (resultValidate) {
      await updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareOtherMatchResult,
      {
        result: dbScore,
        matchBettingDetails: matchBettingDetails,
        userId,
        matchId,
        matchOddId: matchOddBetting.id,
        match,
        matchBettingType: matchOddBetting?.type,
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare other match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateMatchBetting({ matchId: matchId,...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.save, result: null, stopAt: null });
        await deleteExpertResult(matchOddBetting.id, userId);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.match,
      betId: matchOddBetting.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss,
      commission: response?.data?.totalCommission
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        result,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type
      }
    );

    if (!betId) {
      deleteAllMatchRedis(matchId);
      match.stopAt = new Date();
    }
    else {
      const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchOddBetting?.type], 'json');
      matchData.activeStatus = betStatus.result;
      matchData.result = result;
      matchData.stopAt = new Date();
      matchData.updatedAt = new Date();
      await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchOddBetting?.type]]: JSON.stringify(matchData) });
    }
    await deleteKeyFromExpertRedisData(redisKeys.expertRedisData, ...redisKeysMarketWise[matchOddBetting.type].map((item) => item + matchId));

    await addMatch(match);

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "success",
          keys: {
            name: "Match Result declared",
          },
        },
        data: {
          result,
          profitLoss: fwProfitLoss,
        },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at result declare other match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareOtherMatchResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;
  let oldStopAt = null;
  const { matchId, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);

    logger.info({
      message: "Result un declare other match",
      data: match,
      betId: betId
    });

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "notFound", keys: {
              name: "Match"
            }
          },
        },
        req,
        res
      );
    }

    if (betId && match.stopAt) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: { msg: "bet.matchAlreadyDeclared" },
        },
        req,
        res
      );
    }

    if (!match.stopAt && !betId) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getMatchBattingByMatchId(matchId);
    let matchOddBetting;

    if(betId){
      matchOddBetting = bet?.find(
        (item) => item.id == betId
      );
    }
    else{
      matchOddBetting = bet?.find(
        (item) => item.type == matchBettingType.quickbookmaker1
      );
    }
    if (bet?.length == 0) {
      logger.error({
        message: "Error in unDeclare other match",

      });
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    if (matchOddBetting.activeStatus != betStatus.result) {
      logger.error({
        message: "Error in unDeclare match no bet found",
        data: {
          matchId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = matchOddBetting.result;
    oldStopAt = match?.stopAt;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareOtherMatchResult,
      {
        matchOddId: matchOddBetting?.id,
        userId,
        matchId,
        match,
        matchBetting: bet,
        matchBettingType: matchOddBetting?.type
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.result, result: matchOddBetting.result, stopAt: match?.stopAt });
        throw err;
      });

    isResultChange = false;

    await deleteResult(matchOddBetting.id);
    await deleteAllExpertResult(matchOddBetting.id);

    if (response?.data?.profitLossWallet) {
      await setExpertsRedisData(response?.data?.profitLossWallet);
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        profitLoss: response?.data?.profitLoss,
        activeStatus: betStatusType.live,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type,
        profitLossData: response?.data?.profitLossWallet,
        teamArateRedisKey: `${otherEventMatchBettingRedisKey[matchOddBetting?.type]?.a}${matchId}`,
        teamBrateRedisKey: `${otherEventMatchBettingRedisKey[matchOddBetting?.type]?.b}${matchId}`,
        teamCrateRedisKey: `${otherEventMatchBettingRedisKey[matchOddBetting?.type]?.c}${matchId}`,
      }
    );
    if (!betId) {
      await deleteAllMatchRedis(matchId);
      match.stopAt = null;
    }
    else {
      const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchOddBetting?.type], 'json');
      matchData.activeStatus = betStatus.save;
      matchData.result = null;
      matchData.stopAt = null;
      matchData.updatedAt = new Date();
      await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchOddBetting?.type]]: JSON.stringify(matchData) });
    }
    await addMatch(match);

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId, ...(betId ? { id: betId } : { type: In(mainMatchMarketType) }) }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareTournamentMatchResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare tournament match",
      data: match,
      result: result,
      betId: betId,
    });

    if (!match) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "notFound", keys: { name: "Match" } },
      }, req, res
      );
    }

    if (match?.stopAt) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res
      );
    }

    // check result already declare
    let matchBettingDetails = await getTournamentBettingWithRunners({ id: betId });
    let matchOddBetting;

    if(betId){
      matchOddBetting = matchBettingDetails?.find(
        (item) => item.id == betId
      );
    }
    if (matchBettingDetails?.length > 0 && matchOddBetting?.activeStatus == betStatus.result) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    const isMatchDeclared = await getResult({ betId: matchOddBetting.id, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res);
    }
    await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const unDeclaredMatchBettingTournament = await getTournamentBetting({ activeStatus: Not(betStatusType.result), matchId: matchId }, ["id"]);
    const unDeclaredMatchBetting = await getMatchBetting({ activeStatus: Not(betStatusType.result), matchId: matchId }, ["id"]);


    const sessions = await getSessionBettings({ matchId: matchId, activeStatus: Not(betStatus.result) }, ["id"]);
    if (sessions?.length > 0) {
      logger.error({
        error: `Sessions is not declared yet.`,
      });
      updateTournamentBetting({ id: betId}, { activeStatus: betStatus.save, result: null, stopAt: null});
      return ErrorResponse(
        { statusCode: 403, message: { msg: "bet.sessionAllResult" } },
        req,
        res
      );
    }

    const resultValidate = await checkResult({
      betId: matchOddBetting.id,
      matchId: matchOddBetting.matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      match: match,
      betType: matchBettingType.tournament
    });

    if (resultValidate) {
      await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse({ statusCode: 200, message: { msg: "bet.resultApprove" }, }, req, res);
    }

 
    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareTournamentMatchResult,
      {
        result: result,
        matchBettingDetails: matchBettingDetails,
        userId,
        matchId,
        matchOddId: matchOddBetting.id,
        match,
        matchBettingType: matchOddBetting?.type,
        isMatchDeclare: !unDeclaredMatchBettingTournament && !unDeclaredMatchBetting
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare tournament match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
        await deleteExpertResult(matchOddBetting.id, userId);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.match,
      betId: matchOddBetting?.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        result,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type,
        type: match?.matchType,
        isMatchDeclare: !unDeclaredMatchBettingTournament && !unDeclaredMatchBetting
      }
    );
 
    if (!unDeclaredMatchBetting && !unDeclaredMatchBettingTournament) {
      deleteAllMatchRedis(matchId);
      match.stopAt = new Date();
      await removeBlinkingTabs({ matchId: matchId });
      await addMatch(match);
    }
    else{
      const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchOddBetting?.type], 'json');

      matchData.find((item) => item.id == betId).activeStatus = betStatus.result;
      matchData.find((item) => item.id == betId).result = result;
      matchData.find((item) => item.id == betId).stopAt = new Date();
      matchData.find((item) => item.id == betId).updatedAt = new Date();
      await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchOddBetting?.type]]: JSON.stringify(matchData) });
    }
    await deleteKeyFromExpertRedisData(redisKeys.expertRedisData, `${betId}${redisKeys.profitLoss}_${matchId}`);


    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match Result declared" } }, data: { result, profitLoss: fwProfitLoss } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result declare tournament match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareTournamentMatchResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;
  let oldStopAt = null;
  const { matchId, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId);

    logger.info({
      message: "Result un declare tournament match",
      data: match,
      betId: betId
    });

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "notFound", keys: {
              name: "Match"
            }
          },
        },
        req,
        res
      );
    }

    const matchBettingsUndec = await getMatchBetting({ activeStatus: Not(betStatusType.result), matchId: matchId }, ["id"]);
    const tournamentBettingsUndec = await getTournamentBetting({ activeStatus: Not(betStatusType.result), matchId: matchId }, ["id"]);

    if (!match.stopAt && !matchBettingsUndec && !tournamentBettingsUndec) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getTournamentBettingWithRunners({ id: betId });
    let matchOddBetting;

    matchOddBetting = bet?.find((item) => item.id == betId);
   
    if (bet?.length == 0) {
      logger.error({
        message: "Error in unDeclare racing match",

      });
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    if (matchOddBetting.activeStatus != betStatus.result) {
      logger.error({
        message: "Error in unDeclare match no bet found",
        data: {
          matchId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = matchOddBetting.result;
    oldStopAt = match?.stopAt;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareTournamentMatchResult,
      {
        matchOddId: matchOddBetting?.id,
        userId,
        matchId,
        match,
        matchBetting: bet,
        matchBettingType: matchOddBetting?.type
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateTournamentBetting({ id: betId }, { activeStatus: betStatus.result, result: matchOddBetting.result, stopAt: matchOddBetting?.stopAt });
        throw err;
      });

    isResultChange = false;

    await deleteResult(matchOddBetting.id);
    await deleteAllExpertResult(matchOddBetting.id);

    if (response?.data?.profitLossWallet) {
      let expertPL=response?.data?.profitLossWallet;
      Object.keys(expertPL)?.forEach((item)=>{
        expertPL[item]=JSON.stringify(expertPL[item]);
      });
      await setExpertsRedisData(expertPL);
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        profitLoss: response?.data?.profitLoss,
        activeStatus: betStatusType.live,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type,
        profitLossData: response?.data?.profitLossWallet?.[`${betId}${redisKeys.profitLoss}_${matchId}`],
        type: match?.matchType
      }
    );

    const unDeclaredMatchBetting = await getMatchBetting({ type: matchBettingType.quickbookmaker1, matchId: matchId }, ["id"]);
    const declaredMatchBetting = await getTournamentBettings({ activeStatus: Not(betStatusType.result), matchId: matchId }, ["id"]);
    if (declaredMatchBetting?.length == 1 && !unDeclaredMatchBetting) {
      await deleteAllMatchRedis(matchId);
      match.stopAt = null;
      await addMatch(match);
    }
    else{
      const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchOddBetting?.type], 'json');
      matchData.find((item) => item.id == matchOddBetting?.id).activeStatus = betStatus.save;
      matchData.find((item) => item.id == matchOddBetting?.id).result = null;
      matchData.find((item) => item.id == matchOddBetting?.id).stopAt = null;
      matchData.find((item) => item.id == matchOddBetting?.id).updatedAt = new Date();
      await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchOddBetting?.type]]: JSON.stringify(matchData) });

    }
    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateTournamentBetting({ id: betId }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareRacingMatchResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getRacingMatchById(matchId);
    logger.info({
      message: "Result declare racing match",
      data: match,
      result: result,
      betId: betId,
    });

    if (!match) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "notFound", keys: { name: "Match" } },
      }, req, res
      );
    }

    if (match?.stopAt) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res
      );
    }

    // check result already declare
    let matchBettingDetails = await getRaceBettingWithRunners({ id: betId });
    let matchOddBetting;

    if(betId){
      matchOddBetting = matchBettingDetails?.find(
        (item) => item.id == betId
      );
    }
    if (matchBettingDetails?.length > 0 && matchOddBetting?.activeStatus == betStatus.result) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.matchDeclare" },
        },
        req,
        res
      );
    }

    const isMatchDeclared = await getResult({ betId: matchOddBetting.id, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.matchDeclare" },
      }, req, res);
    }
    await updateRaceBetting({ id: betId }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const resultValidate = await checkResult({
      betId: matchOddBetting.id,
      matchId: matchOddBetting.matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      match: match,
      isRacingMatch: true
    });

    if (resultValidate) {
      await updateRaceBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse({ statusCode: 200, message: { msg: "bet.resultApprove" }, }, req, res);
    }

    let fwProfitLoss;

    const response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareRacingMatchResult,
      {
        result: result,
        matchBettingDetails: matchBettingDetails,
        userId,
        matchId,
        matchOddId: matchOddBetting.id,
        match,
        matchBettingType: matchOddBetting?.type,
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare other match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateRaceBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
        await deleteExpertResult(matchOddBetting.id, userId);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.racing,
      betId: matchOddBetting.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss
    });

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        result,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type,
        type: match?.matchType
      }
    );

    deleteAllMatchRedis(matchId);
    match.stopAt = new Date();
    await deleteKeyFromExpertRedisData(redisKeys.expertRedisData, `${matchId}${redisKeys.profitLoss}`);

    await raceAddMatch(match);
    await removeBlinkingTabs({ matchId: matchId });

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match Result declared" } }, data: { result, profitLoss: fwProfitLoss } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result declare other match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      await updateRaceBetting({ id: betId }, { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareRacingMatchResult = async (req, res) => {
  let isResultChange = false;
  let oldResult = null;
  let oldStopAt = null;
  const { matchId, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getRacingMatchById(matchId);

    logger.info({
      message: "Result un declare racing match",
      data: match,
      betId: betId
    });

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "notFound", keys: {
              name: "Match"
            }
          },
        },
        req,
        res
      );
    }

    if (!match.stopAt) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getRaceBettingWithRunners({ id: betId });
    let matchOddBetting;

    matchOddBetting = bet?.find((item) => item.id == betId);
   
    if (bet?.length == 0) {
      logger.error({
        message: "Error in unDeclare racing match",

      });
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    if (matchOddBetting.activeStatus != betStatus.result) {
      logger.error({
        message: "Error in unDeclare match no bet found",
        data: {
          matchId
        }
      });

      return ErrorResponse(
        {
          statusCode: 404,
          message: { msg: "bet.notDeclared" },
        },
        req,
        res
      );
    }

    await updateRaceBetting({ id: betId }, { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = matchOddBetting.result;
    oldStopAt = match?.stopAt;

    let response = await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.unDeclareRacingMatchResult,
      {
        matchOddId: matchOddBetting?.id,
        userId,
        matchId,
        match,
        matchBetting: bet,
        matchBettingType: matchOddBetting?.type
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateRaceBetting({ id: betId }, { activeStatus: betStatus.result, result: matchOddBetting.result, stopAt: match?.stopAt });
        throw err;
      });

    isResultChange = false;

    await deleteResult(matchOddBetting.id);
    await deleteAllExpertResult(matchOddBetting.id);

    if (response?.data?.profitLossWallet) {
      let expertPL=response?.data?.profitLossWallet;
      Object.keys(expertPL)?.forEach((item)=>{
        expertPL[item]=JSON.stringify(expertPL[item]);
      });
      await setExpertsRedisData(expertPL);
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        profitLoss: response?.data?.profitLoss,
        activeStatus: betStatusType.live,
        betId: matchOddBetting?.id,
        betType: matchOddBetting?.type,
        profitLossData: response?.data?.profitLossWallet?.[`${matchId}${redisKeys.profitLoss}`],
        type: match?.matchType
      }
    );

    await deleteAllMatchRedis(matchId);
    match.stopAt = null;

    await raceAddMatch(match);

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateRaceBetting({ id: betId }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.sendUpdateDeleteReason = async (req, res, next) => {
  try {
    const { betIds, matchId, deleteReason } = req.body;

    sendMessageToUser(socketData.expertRoomSocket,
      socketData.updateDeleteReason, {
      betIds: betIds,
      deleteReason: deleteReason,
      matchId: matchId
    });
    return SuccessResponse(
      {
        statusCode: 200,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at sending update delete reason.`,
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
}