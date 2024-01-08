const { betStatus, socketData, teamStatus } = require("../config/contants");
const { logger } = require("../config/logger");
const { getExpertResult, addExpertResult } = require("../services/expertResultService");
const { getMatchById } = require("../services/matchService");
const { getSessionFromRedis, updateSessionMatchRedis, deleteKeyFromMarketSessionId } = require("../services/redis/commonfunction");
const { getSessionBettingById, updateSessionBetting } = require("../services/sessionBettingService");
const { sendMessageToUser } = require("../sockets/socketManager");
const { ErrorResponse } = require("../utils/response");

exports.declareSessionResult = async (req, res) => {
  try {
    const { betId, matchId, score } = req.body;
    const { id: userId } = req.user;

    const match=await getMatchById(matchId);
    logger.info({
        message:"Result declare",
        data:match
    });

    if(match.stopAt){
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
        betId:resultDeclare.id,
        matchId:resultDeclare.matchId,
        isSessionBet:true,
        userId:userId,
        result:score,
        selectionId:resultDeclare.selectionId,
    });

    if (resultValidate) {
      return ErrorResponse(
        {
          statusCode: 500,
          message: { msg: "bet.resultApprove" },
        },
        req,
        res
      );
    }

    await updateSessionBetting({id:betId},{
        status: betStatus.result,
        result: score
    });

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


const checkResult =async (body)=> {
    const {
      betId,
      matchId,
      isSessionBet,
      userId,
      result,
      
      selectionId,
    } = body;
    let checkExistResult = await getExpertResult( { betId: betId, isApprove: 1, isReject: 0 });

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
          } catch {
            
          }
        }
      }
    }

    if (!checkExistResult) {
        await addExpertResult({
            betId:betId,
            matchId:matchId,
            result:result,
            userId:userId,
            isApprove:1,
            isReject:0
        });

      return true;
    } else if (checkExistResult && checkExistResult.userId == userId) {
      throw {
        statusCode: 400,
        message: { msg: "bet.resultDuplicate" },
      }
    } else if (checkExistResult && checkExistResult.result != result) {
      checkExistResult.isReject = 1;
      addExpertResult(checkExistResult);
      await addExpertResult({
        betId:betId,
        matchId:matchId,
        result:result,
        userId:userId,
        isApprove:0,
        isReject:1
    });
     
      throw {
        statusCode: 400,
        message: { msg: "bet.resultReject" },
      }
    } else if (checkExistResult && checkExistResult.result == result) {
      checkExistResult.isReject = 0;
      addExpertResult(checkExistResult);
      await addExpertResult({
        betId:betId,
        matchId:matchId,
        result:result,
        userId:userId,
        isApprove:1,
        isReject:0
    });
    }
  }