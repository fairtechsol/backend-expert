const { marketBettingTypeByBettingType, manualMatchBettingType, betStatusType, socketData, redisKeys } = require("../config/contants");
const { logger } = require("../config/logger");
const { getMatchBetting, getMatchAllBettings, getMatchBettingById, addMatchBetting } = require("../services/matchBettingService");
const { getMatchById } = require("../services/matchService");
const { getAllBettingRedis, getBettingFromRedis, addAllMatchBetting, getMatchFromCache, hasBettingInCache, hasMatchInCache, settingMatchKeyInCache, getExpertsRedisMatchData } = require("../services/redis/commonfunction");
const { sendMessageToUser } = require("../sockets/socketManager");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const lodash = require('lodash');

exports.getMatchBetting = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { id: matchBetId, type } = req.query;
        let matchBetting;

        if (!matchBetId && !type) {
            const redisMatchData = await getAllBettingRedis(matchId);

            if (redisMatchData) {
                matchBetting = Object.values(redisMatchData).map(item => JSON.parse(item));
            } else {
                matchBetting = await getMatchAllBettings({ matchId });
                if (!matchBetting) {
                    return ErrorResponse(
                        {
                            statusCode: 404,
                            message: { msg: "notFound", keys: { name: "Match Betting" } },
                        },
                        req,
                        res
                    );
                }
                addAllMatchBetting(matchId, matchBetting);
            }
        } else {
            if (!matchBetId || !type) {
                return ErrorResponse({ statusCode: 404, message: { msg: "required", keys: { name: "Match Betting id and type" } } }, req, res);
            }
            const redisMatchData = await getBettingFromRedis(matchId, type);

            if (redisMatchData) {
                matchBetting = redisMatchData;
            } else {
                matchBetting = await getMatchBetting({ id: matchBetId });
                if (!matchBetting) {
                    return ErrorResponse(

                        {
                            statusCode: 404,
                            message: { msg: "notFound", keys: { name: "Match betting" } },
                        },
                        req,
                        res
                    );
                }
                addAllMatchBetting(matchId, null);
            }

          let expertData = await getExpertsRedisMatchData(matchId);
          let redisIds = [`${redisKeys.userTeamARate}${matchId}`, `${redisKeys.userTeamBRate}${matchId}`, `${redisKeys.userTeamCRate}${matchId}`, `${redisKeys.yesRateComplete}${matchId}`, `${redisKeys.noRateComplete}${matchId}`, `${redisKeys.yesRateTie}${matchId}`, `${redisKeys.noRateTie}${matchId}`];
          let teamRates = {};
          expertData?.forEach((item, index) => {
            if (item) {
              teamRates[redisIds?.[index]?.split("_")[0]] = item;
            }
          });
          matchBetting.matchRates = teamRates;
        }

        return SuccessResponse(
            {
                statusCode: 200,
                message: {
                    msg: "success",
                    keys: {
                        name: "Match Betting",
                    },
                },
                data: matchBetting,
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at get list match betting.`,
            stack: error.stack,
            message: error.message,
        });
        return ErrorResponse(error, req, res);
    }
}


exports.getMatchBettingDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type } = req.query;
    let matchBetting, matchDetails;
    let manualBets = Object.values(manualMatchBettingType);
    matchDetails = await getMatchFromCache(matchId);
    if (!matchDetails) {
      matchDetails = await getMatchById(matchId);
    }
    if (!matchDetails || lodash.isEmpty(matchDetails)) {
      return ErrorResponse({statusCode: 404,message: { msg: "notFound", keys: { name: "Match Betting" } }},req,res);
  }
    let match = {
      id: matchDetails.id,
      eventId: matchDetails.eventId,
      competitionName: matchDetails.competitionName,
      teamA: matchDetails.teamA,
      teamB: matchDetails.teamB,
      teamC: matchDetails.teamC ? matchDetails.teamC : null,
      competitionId: matchDetails.competitionId,
      startAt: matchDetails.startAt,
      title: matchDetails.title,
      matchType: matchDetails.matchType,
      stopAt: matchDetails.stopAt
    };
    if (manualBets.includes(type)) {
      matchBetting = await getBettingFromRedis(matchId, type);
    } else {
      matchBetting = matchDetails[marketBettingTypeByBettingType[type]];
      // fetch third party api for market rate
    }
    if (!matchBetting) {
      matchBetting = await getMatchBetting({
        matchId: matchId,
        type: type
      });
    }
    let response = {
      match: match,
      matchBetting: matchBetting,
    };

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "success", keys: { name: "Match" } },
        data: response,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at get list match betting.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
};

exports.matchBettingStatusChange = async (req, res) => {
  try {
    const { isStop, betId } = req.body;

    const matchBettingUpdate = await getMatchBettingById(betId);

    if (isStop) {
      matchBettingUpdate.activeStatus = betStatusType.save;
    } else {
      matchBettingUpdate.activeStatus = betStatusType.live;
    }

    await addMatchBetting(matchBettingUpdate);

    const hasMatchDetailsInCache = await hasMatchInCache(
      matchBettingUpdate?.matchId
    );

    if (hasMatchDetailsInCache) {
      await settingMatchKeyInCache(matchBettingUpdate?.matchId, {
        [marketBettingTypeByBettingType[matchBettingUpdate?.type]]:
          JSON.stringify(matchBettingUpdate),
      });
    }

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchBettingStatusChange,
      matchBettingUpdate
    );

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Status" } },
        data: matchBettingUpdate,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at change match betting status.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
};
