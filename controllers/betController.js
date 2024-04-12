const { Not } = require("typeorm");
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
const { getMatchBattingByMatchId, updateMatchBetting } = require("../services/matchBettingService");
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

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

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

    const isSessionDeclared = await getResult({
      betId: betId,
      matchId: matchId
    }, ["id"]);

    if (isSessionDeclared) {
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
        activeStatus: betStatusType.result
      }
    );

    await deleteKeyFromManualSessionId(matchId, betId);
    await deleteKeyFromExpertRedisData(betId + redisKeys.profitLoss);

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
    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

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

    const isSessionDeclared = await getResult({
      betId: betId,
      matchId: matchId
    }, ["id"]);

    if (isSessionDeclared) {
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
  const { betId, matchId, isSessionBet, userId, result, selectionId } = body;
  let checkExistResult = await getExpertResult({
    betId: betId
  });

  if (isSessionBet) {
    if (selectionId) {
      deleteKeyFromMarketSessionId(matchId, selectionId);
    } else {
      let redisSession = await getSessionFromRedis(matchId, betId);
      if (redisSession) {
        try {
          let redisSessionData = redisSession;
          if (redisSessionData["noRate"] || redisSessionData["yesRate"]) {
            redisSessionData["noRate"] = null;
            redisSessionData["yesRate"] = null;
            redisSessionData["yesPercent"] = null;
            redisSessionData["noPercent"] = null;
            redisSessionData["status"] = teamStatus.suspended;
            sendMessageToUser(
              socketData.expertRoomSocket,
              socketData.updateSessionRateClient,
              redisSessionData
            );

            updateSessionBetting({ id: betId }, redisSessionData);
            updateSessionMatchRedis(matchId, betId, redisSession);
          }
        } catch (error) { }
      }
    }
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
      { matchId, betId, status: resultStatus.pending, userId }
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
      { matchId, betId, status: resultStatus.missMatched, userId }
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
    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
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
    let resultDeclare = await getMatchBattingByMatchId(matchId);
    const matchOddBetting = resultDeclare?.find(
      (item) => item.type == matchBettingType.quickbookmaker1
    );
    if (resultDeclare?.length > 0 && matchOddBetting.activeStatus == betStatus.result) {
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
    await updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.result, result: result, stopAt: new Date() });
    isResultChange = true;

    const sessions = await getSessionBettings({ matchId: matchId, activeStatus: Not(betStatus.result) }, ["id"]);
    if (sessions?.length > 0) {
      logger.error({
        error: `Sessions is not declared yet.`,
      });
      updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.save, result: null, stopAt: null });
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
      match: match
    })

    if (resultValidate) {
      updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.save, result: null, stopAt: null });
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
        await updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.save, result: null, stopAt: null });
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
    if (isResultChange) {
      updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.save, result: null, stopAt: null });
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
    let bet = await getMatchBattingByMatchId(matchId);
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

    await updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.live, result: null, stopAt: null });
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
        await updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.result, result: matchOddBetting.result, stopAt: match?.stopAt });
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
      updateMatchBetting({ matchId: matchId }, { activeStatus: betStatus.result, result: oldResult, stopAt: oldStopAt });
    }
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};
