const { Not, In } = require("typeorm");
const {
  betStatus,
  socketData,
  teamStatus,
  betStatusType,
  bettingType,
  noResult,
  redisKeys,
  matchBettingType,
  resultStatus,
  marketBettingTypeByBettingType,
  matchOddName,
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
const { getMatchById, updateMatch } = require("../services/matchService");
const {
  getSessionFromRedis,
  updateSessionMatchRedis,
  deleteKeyFromManualSessionId,
  deleteKeyFromExpertRedisData,
  updateMarketSessionIdRedis,
  setExpertsRedisData,
  deleteAllMatchRedis,
  getSingleMatchKey,
  settingMatchKeyInCache,
  getRedisKey,
  setRedisKey,
  deleteRedisKey,
  getExternalRedisKey,
  setExternalRedisKey,
} = require("../services/redis/commonfunction");
const {
  getSessionBettingById,
  updateSessionBetting,
  addSessionBetting,
  getSessionBettings,
} = require("../services/sessionBettingService");
const { sendMessageToUser } = require("../sockets/socketManager");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { getTournamentBettingWithRunners, getSingleTournamentBetting, updateTournamentBettingStatus } = require("../services/tournamentBettingService");
const { removeBlinkingTabs } = require("../services/blinkingTabsService");
const { declareSessionHandler, declareSessionNoResultHandler, unDeclareSessionHandler } = require("../grpc/grpcClient/handlers/wallet/declareSession");
const { declareMatchHandler, unDeclareMatchHandler, declareFinalMatchHandler, unDeclareFinalMatchHandler } = require("../grpc/grpcClient/handlers/wallet/declareMatch");
const { getBets, verifyBetHandler } = require("../grpc/grpcClient/handlers/wallet/betsHandler");
const { notifyTelegram } = require("../utils/telegramMessage");


exports.getPlacedBets = async (req, res, next) => {
  try {
    const result = await getBets({ query: JSON.stringify(req.query) })
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
        data: result,
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

    const isRedisSessionResultDeclare = await getRedisKey(`${betId}${redisKeys.declare}`);

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

    const match = await getMatchById(matchId, ["id", "stopAt", "title", "startAt"]);

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
    let resultDeclare = await getSessionBettingById(betId, ["activeStatus", "id", "matchId", "selectionId", "type"]);
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
    })

    if (resultValidate) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId }, { activeStatus: betStatus.save, result: null });
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

    const response = await declareSessionHandler({
      betId,
      score,
      sessionDetails: resultDeclare,
      userId,
      matchId,
      match
    })
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
        notifyTelegram(`Error at result declare session expert side while calling wallet api on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);
        throw err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss ? Number(parseFloat(response?.data?.profitLoss).toFixed(2)) : 0;

    await addResult({
      betType: bettingType.session,
      betId: betId,
      matchId: matchId,
      result: score,
      profitLoss: fwProfitLoss,
      commission: response?.data?.totalCommission
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

    if (isResultChange) {
      await deleteRedisKey(`${betId}${redisKeys.declare}`);
      updateSessionBetting({ id: betId },
        { activeStatus: betStatus.save, result: null }
      );
    }
    notifyTelegram(`Error at result declare session expert side on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareSessionNoResult = async (req, res) => {
  let isResultChange = false;
  const { betId, matchId } = req.body;
  const { id: userId } = req.user;
  try {
    const isRedisSessionResultDeclare = await getRedisKey(`${betId}${redisKeys.declare}`);

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

    const match = await getMatchById(matchId, ["id", "stopAt", "title", "startAt"]);
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

    await declareSessionNoResultHandler(
      {
        score: noResult,
        betId,
        userId,
        matchId,
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
        notifyTelegram(`Error at result declare session no result expert side while calling wallet api on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);

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
    notifyTelegram(`Error at result declare session no result expert side on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);
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

    let response = await unDeclareSessionHandler(
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

        notifyTelegram(`Error at result undeclare session expert side while calling wallet api on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);

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
    notifyTelegram(`Error at result undeclare session expert side on session ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);

    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

const checkResult = async (body) => {
  const { betId, matchId, isSessionBet, userId, result, betType } = body;
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
        // redisSessionData["updatedAt"] = new Date();

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
    if (betType == matchBettingType.tournament) {
      for (let item of matchData) {
        if (item.id == betId || item.parentBetId == betId) {
          item.activeStatus = betStatus.save;
        }
      }
    }
    else {
      matchData.activeStatus = betStatus.save;
    }
    await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[betType]]: JSON.stringify(matchData) });
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

exports.declareTournamentMatchResult = async (req, res) => {
  let isResultChange = false;
  const { matchId, result, betId } = req.body;
  const { id: userId } = req.user;
  try {
    const match = await getMatchById(matchId, ["stopAt", "matchType", "title", "startAt", "id"]);

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
    let matchBettingDetails = await getTournamentBettingWithRunners({ id: betId }, ["tournamentBetting.type", "tournamentBetting.activeStatus", "tournamentBetting.id", "tournamentBetting.name", "tournamentRunner.id", "tournamentRunner.runnerName"]);

    if (matchBettingDetails?.activeStatus == betStatus.result) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.marketAlreadyDeclare" },
        },
        req,
        res
      );
    }

    const isMatchDeclared = await getResult({ betId: betId, matchId: matchId }, ["id"]);
    if (isMatchDeclared) {
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "bet.marketAlreadyDeclare" },
      }, req, res);
    }
    await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
      id: betId,
    }], { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const resultValidate = await checkResult({
      betId: betId,
      matchId: matchId,
      isSessionBet: false,
      userId: userId,
      result: result,
      betType: matchBettingType.tournament
    });

    if (resultValidate) {
      await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
        id: betId,
      }], { activeStatus: betStatus.save, result: null, stopAt: null });
      return SuccessResponse({ statusCode: 200, message: { msg: "bet.resultApprove" }, }, req, res);
    }


    let fwProfitLoss;

    const response = await declareMatchHandler(
      {
        result: result,
        matchBettingDetails: matchBettingDetails,
        userId,
        matchId,
        match,
        isMatchOdd: matchBettingDetails.name == matchOddName
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
        await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
          id: betId,
        }], { activeStatus: betStatus.save, result: null, stopAt: null });
        await deleteExpertResult(matchBettingDetails.id, userId);

        notifyTelegram(`Error at result declare tournament expert side while calling wallet api on tournament ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);

        throw err?.response?.data || err;
      });
    isResultChange = false;

    fwProfitLoss = response?.data?.profitLoss
      ? Number(parseFloat(response?.data?.profitLoss).toFixed(2))
      : 0;

    await addResult({
      betType: bettingType.match,
      betId: matchBettingDetails?.id,
      matchId: matchId,
      result: result,
      profitLoss: fwProfitLoss,
      commission: response?.data?.totalCommission
    });


    const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[matchBettingDetails?.type], 'json');
    matchData.forEach(item => {
      if (item.id === betId || item.parentBetId === betId) {
        Object.assign(item, {
          activeStatus: betStatus.result,
          result: result,
          stopAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[matchBettingDetails?.type]]: JSON.stringify(matchData) });
    await deleteKeyFromExpertRedisData(redisKeys.expertRedisData, `${betId}${redisKeys.profitLoss}_${matchId}`);

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
        betType: matchBettingDetails?.type,
        type: match?.matchType,
      }
    );
    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match Result declared" } } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result declare tournament match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
        id: betId,
      }], { activeStatus: betStatus.save, result: null, stopAt: null });
    }
    notifyTelegram(`Error at result declare tournament expert side on tournament ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);

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
    const match = await getMatchById(matchId, ["id", "stopAt", "matchType"]);

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
          statusCode: 403,
          message: { msg: "bet.matchAlreadyDeclared" },
        },
        req,
        res
      );
    }

    // check result already declare
    let bet = await getTournamentBettingWithRunners({ id: betId }, ["tournamentBetting.result", "tournamentBetting.stopAt", "tournamentBetting.type", "tournamentBetting.activeStatus", "tournamentBetting.id", "tournamentBetting.name", "tournamentRunner.id", "tournamentRunner.runnerName"]);

    if (!bet) {
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

    await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
      id: betId,
    }], { activeStatus: betStatus.live, result: null, stopAt: null });
    isResultChange = true;
    oldResult = bet.result;
    oldStopAt = match?.stopAt;

    let response = await unDeclareMatchHandler({
      userId,
      matchId,
      match,
      matchBetting: bet,
      isMatchOdd: bet.name == matchOddName
    })
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result undeclare match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
          id: betId,
        }], { activeStatus: betStatus.result, result: bet.result, stopAt: bet?.stopAt });

        notifyTelegram(`Error at result undeclare tournament expert side while calling wallet api on tournament ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);
        throw err;
      });

    isResultChange = false;

    await deleteResult(bet.id);
    await deleteAllExpertResult(bet.id);

    if (response?.data?.profitLossWallet) {
      let expertPL = response?.data?.profitLossWallet;
      Object.keys(expertPL)?.forEach((item) => {
        expertPL[item] = JSON.stringify(expertPL[item]);
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
        betId: bet?.id,
        betType: bet?.type,
        profitLossData: response?.data?.profitLossWallet?.[`${betId}${redisKeys.profitLoss}_${matchId}`],
        type: match?.matchType
      }
    );

    const matchData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[bet?.type], 'json');


    matchData.forEach(item => {
      if (item.id === betId || item.parentBetId === betId) {
        Object.assign(item, {
          activeStatus: betStatus.save,
          result: null,
          stopAt: null,
          updatedAt: new Date()
        });
      }
    });

    await settingMatchKeyInCache(matchId, { [marketBettingTypeByBettingType[bet?.type]]: JSON.stringify(matchData) });

    // }
    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    if (isResultChange) {
      updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
        id: betId,
      }], { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    notifyTelegram(`Error at result undeclare tournament expert side on tournament ${betId} for match ${matchId} ${JSON.stringify(err || "{}")}`);
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareFinalMatchResult = async (req, res) => {
  const { matchId } = req.body;
  try {
    const match = await getMatchById(matchId, ["id", "stopAt", "matchType"]);

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
    const matchTournamentsDetails = await getSingleTournamentBetting({ activeStatus: Not(betStatus.result), matchId: matchId }, ["id", "sNo"]);


    if (matchTournamentsDetails) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "bet.declareOtherMarket" },
        },
        req,
        res
      );
    }

    const sessions = await getSessionBettings({ matchId: matchId, activeStatus: Not(betStatus.result) }, ["id"]);
    if (sessions?.length > 0) {
      logger.error({
        error: `Sessions is not declared yet.`,
      });
      return ErrorResponse(
        { statusCode: 403, message: { msg: "bet.sessionAllResult" } },
        req,
        res
      );
    }

    await declareFinalMatchHandler(
      {
        matchId,
        matchType: match.matchType
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare final match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        notifyTelegram(`Error at result declare final match expert side while calling wallet api for match ${matchId} ${JSON.stringify(err || "{}")}`);

        throw err;
      });

    deleteAllMatchRedis(matchId);
    await updateMatch({ id: matchId }, { stopAt: new Date() })
    await removeBlinkingTabs({ matchId: matchId });
    let blinkingTabs = await getExternalRedisKey(redisKeys.blinkingTabs);
    if (blinkingTabs) {
      blinkingTabs = JSON.parse(blinkingTabs);
      blinkingTabs = blinkingTabs.filter(tab => tab.matchId !== matchId);
      setExternalRedisKey(redisKeys.blinkingTabs, JSON.stringify(blinkingTabs))
    }
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultDeclared,
      {
        matchId: matchId,
        stopAt: match.stopAt,
        activeStatus: betStatusType.result,
        type: match?.matchType,
        isMatchDeclare: true
      }
    );
    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match Result declared" } } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at final result declare match`,
      stack: err.stack,
      message: err.message,
    });
    notifyTelegram(`Error at result declare final match expert side for match ${matchId} ${JSON.stringify(err || "{}")}`);

    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.unDeclareFinalMatchResult = async (req, res) => {
  const { matchId } = req.body;
  try {
    const match = await getMatchById(matchId, ["id", "matchType"]);
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

    await unDeclareFinalMatchHandler({
      matchId,
      matchType: match.matchType
    }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at result declare final match wallet side`,
          stack: err.stack,
          message: err.message,
        });
        notifyTelegram(`Error at result undeclare final match expert side while calling wallet api for match ${matchId} ${JSON.stringify(err || "{}")}`);

        throw err;
      });

    await deleteAllMatchRedis(matchId);
    await updateMatch({ id: matchId }, { stopAt: null })

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchResultUnDeclared,
      {
        matchId: matchId,
        activeStatus: betStatusType.live,
        type: match?.matchType
      }
    );

    return SuccessResponse({ statusCode: 200, message: { msg: "success", keys: { name: "Match result undeclared" } }, data: { matchId } }, req, res);
  } catch (err) {
    logger.error({
      error: `Error at final result undeclare match`,
      stack: err.stack,
      message: err.message,
    });
    notifyTelegram(`Error at result undeclare final match expert side for match ${matchId} ${JSON.stringify(err || "{}")}`);

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

exports.verifyBet = async (req, res) => {
  try {
    let { isVerified, id, domain, matchId } = req.body;
    await verifyBetHandler({ isVerified, id, verifyBy: !isVerified ? null : req?.user?.userName }, domain
    );

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.verifyBet,
      {
        matchId: matchId,
        id: id,
        isVerified: isVerified,
        verifyBy: !isVerified ? null : req?.user?.userName
      }
    );
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "bet.isVerified" }
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at verify bet.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res)
  }
}
