const {
  betStatus,
  socketData,
  teamStatus,
  walletDomain,
  betStatusType,
  bettingType,
  noResult,
} = require("../config/contants");
const { logger } = require("../config/logger");
const { addResult } = require("../services/betService");
const {
  getExpertResult,
  addExpertResult,
  deleteExpertResult,
} = require("../services/expertResultService");
const { getMatchById } = require("../services/matchService");
const {
  getSessionFromRedis,
  updateSessionMatchRedis,
  deleteKeyFromMarketSessionId,
  deleteKeyFromManualSessionId,
  deleteKeyFromExpertRedisData,
} = require("../services/redis/commonfunction");
const {
  getSessionBettingById,
  updateSessionBetting,
  addSessionBetting,
} = require("../services/sessionBettingService");
const { sendMessageToUser } = require("../sockets/socketManager");
const { apiCall, apiMethod, allApiRoutes } = require("../utils/apiService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");

exports.declareSessionResult = async (req, res) => {
  try {
    const { betId, matchId, score } = req.body;
    const { id: userId } = req.user;

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

    if (match.stopAt) {
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

    const resultValidate = await checkResult({
      betId: resultDeclare.id,
      matchId: resultDeclare.matchId,
      isSessionBet: true,
      userId: userId,
      result: score,
      selectionId: resultDeclare.selectionId,
    });

    if (resultValidate) {
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    await updateSessionBetting(
      { id: betId },
      {
        activeStatus: betStatus.result,
        result: score,
      }
    );

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
        }
      );

    await deleteKeyFromManualSessionId(matchId, betId);

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
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.declareSessionNoResult = async (req, res) => {
  try {
    const { betId, matchId } = req.body;
    const { id: userId } = req.user;

    const match = await getMatchById(matchId);
    logger.info({
      message: "Result declare",
      data: match,
    });

    if (match.stopAt) {
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

    const resultValidate = await checkResult({
      betId: resultDeclare.id,
      matchId: resultDeclare.matchId,
      isSessionBet: true,
      userId: userId,
      result: noResult,
      selectionId: resultDeclare.selectionId,
    });

    if (resultValidate) {
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    await updateSessionBetting(
      { id: betId },
      {
        activeStatus: betStatus.result,
        result: noResult,
      }
    );

    await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.declareSessionNoResult,
      {
        score:noResult,
        betId,
        noResult,
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
        let bet = await getSessionBettingById(betId);
        bet.activeStatus = betStatusType.save;
        bet.result = null;
        await addSessionBetting(bet);
        await deleteExpertResult(betId, userId);
        throw err;
      });

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
        score:noResult,
        profitLoss: fwProfitLoss,
        stopAt: match.stopAt,
      }
    );

    await deleteKeyFromExpertRedisData(`${betId}_profitLoss`);
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
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};
  

const checkResult = async (body) => {
  const { betId, matchId, isSessionBet, userId, result, selectionId } = body;
  let checkExistResult = await getExpertResult({
    betId: betId,
    isApprove: true,
    isReject: false,
  });

  if (isSessionBet) {
    if (selectionId) {
      deleteKeyFromMarketSessionId(matchId, selectionId);
    } else {
      let redisSession = await getSessionFromRedis(matchId, betId);
      if (redisSession) {
        try {
          let redisSessionData = JSON.parse(redisSession);
          if (redisSessionData["noRate"] || redisSessionData["yesRate"]) {
            sendMessageToUser(
              socketData.expertRoomSocket,
              "updateSessionRateClient",
              { matchId, betId, status: teamStatus.suspended }
            );

            redisSessionData["noRate"] = null;
            redisSessionData["yesRate"] = null;
            redisSessionData["yesPercent"] = null;
            redisSessionData["noPercent"] = null;
            redisSessionData["status"] = teamStatus.suspended;

            updateSessionBetting({ id: betId }, redisSessionData);
            updateSessionMatchRedis(matchId, betId, redisSession);
          }
        } catch {}
      }
    }
  }

  if (!checkExistResult) {
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: true,
      isReject: false,
    });

    return true;
  } else if (checkExistResult && checkExistResult.userId == userId) {
    throw {
      statusCode: 400,
      message: { msg: "bet.resultDuplicate" },
    };
  } else if (checkExistResult && checkExistResult.result != result) {
    checkExistResult.isReject = true;
    addExpertResult(checkExistResult);
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: false,
      isReject: true,
    });

    throw {
      statusCode: 400,
      message: { msg: "bet.resultReject" },
    };
  } else if (checkExistResult && checkExistResult.result == result) {
    checkExistResult.isReject = 0;
    addExpertResult(checkExistResult);
    await addExpertResult({
      betId: betId,
      matchId: matchId,
      result: result,
      userId: userId,
      isApprove: true,
      isReject: false,
    });
  }
};
