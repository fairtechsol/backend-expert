const { In } = require("typeorm");
const { marketBettingTypeByBettingType, manualMatchBettingType, betStatusType, socketData, matchBettingType, betStatus, resultStatus, raceTypeByBettingType, mainMatchMarketType } = require("../config/contants");
const { logger } = require("../config/logger");
const { getExpertResult } = require("../services/expertResultService");
const { getMatchBetting, getMatchAllBettings, getMatchBettingById, addMatchBetting, updateMatchBetting } = require("../services/matchBettingService");
const { getMatchById } = require("../services/matchService");
const { getRacingBetting, getRunners, getRacingBettingById, addRaceBetting, updateRaceBetting, getRacingBettings } = require("../services/raceBettingService");
const { getRacingMatchById } = require("../services/racingMatchService");
const { getAllBettingRedis, getBettingFromRedis, addAllMatchBetting, getMatchFromCache, hasBettingInCache, hasMatchInCache, settingMatchKeyInCache, getExpertsRedisMatchData, updateBettingMatchRedis, getRaceFromCache, updateMatchKeyInCache, getSingleMatchKey, settingAllBettingMatchRedis } = require("../services/redis/commonfunction");
const { sendMessageToUser } = require("../sockets/socketManager");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const lodash = require('lodash');
const { updateTournamentBetting, addTournamentBetting, insertTournamentRunners, getTournamentBettingById, getTournamentBetting, getTournamentRunners, getTournamentBettings } = require("../services/tournamentBettingService");

exports.getMatchBetting = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { id: matchBetId, type } = req.query;
    let matchBetting;

    let matchDetails=await getMatchFromCache(matchId);

    if(!matchDetails){
      matchDetails = await getMatchById(matchId, ["id", "rateThan100"]);
    }

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

      let teamRates = await getExpertsRedisMatchData(matchId);
      matchBetting.matchRates = teamRates;
      matchBetting.rateThan100 = matchDetails?.rateThan100;
    }
    if (matchBetting.activeStatus != betStatus.result) {
      let qBookId = await getMatchAllBettings({ type: matchBettingType.quickbookmaker1, matchId }, ['id']);
      let expertResults = await getExpertResult({ betId: qBookId[0]?.id });

      if (expertResults?.length != 0) {
        if (expertResults?.length == 1) {
          matchBetting.resultStatus = resultStatus.pending;
        } else{
          matchBetting.resultStatus = resultStatus.missMatched;
        }
      }
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
    const { type, id } = req.query;
    let matchBetting, matchDetails;
    let manualBets = Object.values(manualMatchBettingType);
    matchDetails = await getMatchFromCache(matchId);
    if (!matchDetails) {
      matchDetails = await getMatchById(matchId);
    }
    if (!matchDetails || lodash.isEmpty(matchDetails)) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match Betting" } } }, req, res);
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
    } else if(matchDetails){
      matchBetting = matchDetails[marketBettingTypeByBettingType[type]];
      if (id && type == matchBettingType.other) {
        matchBetting = matchDetails?.other?.find((item) => item?.id == id);
      }
      // fetch third party api for market rate
    }
    if (!matchBetting) {
      if (!id && type == matchBettingType?.other) {
        matchBetting = await getMatchAllBettings({
          matchId: matchId,
          type: type,
        });
      }
      matchBetting = await getMatchBetting({
        matchId: matchId,
        type: type,
        ...(id ? { id: id } : {})
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

exports.getRaceBettingDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type } = req.query;
    let matchBetting, raceDetails, runners;
    raceDetails = await getRaceFromCache(matchId);
    if (!raceDetails) {
      raceDetails = await getRacingMatchById(matchId);
    }
    if (!raceDetails || lodash.isEmpty(raceDetails)) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Race Betting" } } }, req, res);
    }
    let race = {
      id: raceDetails.id,
      eventId: raceDetails.eventId,
      startAt: raceDetails.startAt,
      title: raceDetails.title,
      matchType: raceDetails.matchType,
      stopAt: raceDetails.stopAt,
      betPlaceStartBefore: raceDetails?.betPlaceStartBefore
    };

    matchBetting = raceDetails[raceTypeByBettingType[type]];
    // fetch third party api for market rate

    if (!matchBetting) {
      matchBetting = await getRacingBetting({
        matchId: matchId,
        type: type
      });
    }
    else {
      matchBetting = JSON.parse(matchBetting);
    }

    runners = raceDetails?.runners;

    if (!runners) {
      runners = await getRunners({
        bettingId: matchBetting.id
      });
    }
    else {
      runners = JSON.parse(runners);
    }

    let response = {
      match: race,
      matchBetting: matchBetting,
      runners: runners
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

exports.getTournamentBettingDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type, id } = req.query;
    let matchBetting, matchDetails, runners;
    matchDetails = await getMatchFromCache(matchId);
    if (!matchDetails) {
      matchDetails = await getMatchById(matchId);
    }
    if (!matchDetails || lodash.isEmpty(matchDetails)) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match Betting" } } }, req, res);
    }
    let match = {
      id: matchDetails.id,
      eventId: matchDetails.eventId,
      startAt: matchDetails.startAt,
      title: matchDetails.title,
      matchType: matchDetails.matchType,
      stopAt: matchDetails.stopAt,
      betPlaceStartBefore: matchDetails?.betPlaceStartBefore,
      rateThan100: matchDetails?.rateThan100
    };

    matchBetting = matchDetails[marketBettingTypeByBettingType[type]];
    // fetch third party api for market rate
    let response;
    if (id) {
      if (!matchBetting) {
        matchBetting = await getTournamentBetting({
          id: id
        });
      }
      else {
        matchBetting = matchBetting?.find((item) => item?.id == id);
      }

      runners = matchBetting?.runners;

      if (!runners) {
        runners = await getTournamentRunners({
          bettingId: matchBetting.id
        });
      }

      response = {
        match: match,
        matchBetting: matchBetting,
        runners: runners
      };
    }
    else {
      if (!matchBetting) {
        matchBetting = await getTournamentBettings({
          matchId: matchId
        });
      }

      response = {
        match: match,
        matchBetting: matchBetting
      };
    }
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
    const { isStop, betId, isManual, isTournament } = req.body;

    if (isTournament) {
      const tournamentData = await getTournamentBettingById(betId, ["id", "matchId","activeStatus"]);
      if(tournamentData.activeStatus==betStatusType.result){
        return ErrorResponse({
          statusCode: 400,
          message: {
            msg: "match.matchAlreadyDeclared",
            keys: { name: "This market" }
          },
        }, req, res);
      }
      await updateTournamentBetting({ id: betId }, { activeStatus: isStop ? betStatusType.save : betStatusType.live });
      const isMatchExist = await hasMatchInCache(tournamentData?.matchId);
      if (isMatchExist) {
        const bettingData = await getSingleMatchKey(tournamentData?.matchId, marketBettingTypeByBettingType[matchBettingType.tournament], "json");
        if (Array.isArray(bettingData)) {
          bettingData.find((item) => item?.id == betId).activeStatus = isStop ? betStatusType.save : betStatusType.live;
          await updateMatchKeyInCache(tournamentData?.matchId, marketBettingTypeByBettingType[matchBettingType.tournament], JSON.stringify(bettingData));
        }
      }

      sendMessageToUser(
        socketData.expertRoomSocket,
        socketData.matchBettingStatusChange,
        { ...tournamentData, isTournament }
      );
    }
    else {
      const matchBettingUpdate = await getMatchBettingById(betId);
      if (matchBettingUpdate.activeStatus == betStatusType.result) {
        return ErrorResponse({
          statusCode: 400,
          message: {
            msg: "match.matchAlreadyDeclared",
            keys: { name: "This market" }
          },
        }, req, res);
      }
      if (isStop) {
        matchBettingUpdate.activeStatus = betStatusType.save;
      } else {
        matchBettingUpdate.activeStatus = betStatusType.live;
      }

      await addMatchBetting(matchBettingUpdate);
      if (isManual) {
        const hasMatchBettingInCache = await hasBettingInCache(matchBettingUpdate?.matchId);
        if (hasMatchBettingInCache) {
          await updateBettingMatchRedis(matchBettingUpdate?.matchId, matchBettingType[matchBettingUpdate?.type], matchBettingUpdate);
        }
      }
      else {

        const hasMatchDetailsInCache = await hasMatchInCache(
          matchBettingUpdate?.matchId
        );

        if (hasMatchDetailsInCache) {
          if (matchBettingUpdate?.type == matchBettingType.other) {
            const bettingData = await getSingleMatchKey(matchBettingUpdate?.matchId, marketBettingTypeByBettingType[matchBettingUpdate?.type], "json");
            if (bettingData.find((item) => item?.id == betId)) {
              bettingData[bettingData.findIndex((item) => item?.id == betId)] = matchBettingUpdate;
            }
            else {
              bettingData.push(matchBettingUpdate);
            }
            await updateMatchKeyInCache(matchBettingUpdate?.matchId, marketBettingTypeByBettingType[matchBettingUpdate?.type], JSON.stringify(bettingData));
          }
          else {
            await settingMatchKeyInCache(matchBettingUpdate?.matchId, {
              [marketBettingTypeByBettingType[matchBettingUpdate?.type]]:
                JSON.stringify(matchBettingUpdate),
            });
          }
        }
      }

      
    }
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Status" } },
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

exports.raceBettingStatusChange = async (req, res) => {
  try {
    const { isStop, betId } = req.body;

    const raceBettingUpdate = await getRacingBettingById(betId);

    if(!raceBettingUpdate){
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match betting" } } }, req, res);
    }

    if (isStop) {
      raceBettingUpdate.activeStatus = betStatusType.save;
    } else {
      raceBettingUpdate.activeStatus = betStatusType.live;
    }

    await addRaceBetting(raceBettingUpdate);

    const hasMatchDetailsInCache = await hasMatchInCache(
      raceBettingUpdate?.matchId
    );

    if (hasMatchDetailsInCache) {
      await settingMatchKeyInCache(raceBettingUpdate?.matchId, {
        [raceTypeByBettingType[raceBettingUpdate?.type]]:
          JSON.stringify(raceBettingUpdate),
      });
    }

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchBettingStatusChange,
      raceBettingUpdate
    );

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Status" } },
        data: raceBettingUpdate,
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

exports.matchBettingRateApiProviderChange = async (req, res) => {
  try {
    const { apiType, betIds, matchId } = req.body;

    await updateMatchBetting({ id: In(betIds) }, { apiType: apiType });

    const matchBettings=await getMatchAllBettings({id:In(betIds)});
   

    const hasMatchDetailsInCache = await hasMatchInCache(
      matchId
    );

    if (hasMatchDetailsInCache) {
      await settingMatchKeyInCache(matchId,
        matchBettings?.reduce((prev, curr) => {
          return { ...prev, [marketBettingTypeByBettingType[curr?.type]]: JSON.stringify(curr) }
        }, {})
      );
    }
 
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Api type" } }, 
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at change match betting api type.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
};

exports.raceBettingRateApiProviderChange = async (req, res) => {
  try {
    const { apiType,betIds,matchId } = req.body;

    await updateRaceBetting({ id: In(betIds) }, { apiType: apiType });

    const raceBettings = await getRacingBettings({ id: In(betIds) });
   

    const hasRaceDetailsInCache = await hasMatchInCache(
      matchId
    );

    if (hasRaceDetailsInCache) {
      await settingMatchKeyInCache(matchId,
        raceBettings?.reduce((prev, curr) => {
          return { ...prev, [marketBettingTypeByBettingType[curr?.type]]: JSON.stringify(curr) }
        }, {})
      );
    }
  

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Api type" } }, 
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at change match betting api type.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
};

exports.addAndUpdateMatchBetting = async (req, res) => {
  try {
    const { matchId, type, name, maxBet, minBet, marketId, id, gtype, runners, betLimit = 0, exposureLimit, isCommissionActive, isManual } = req.body;
    const match = await getMatchById(matchId, ["id", "betFairSessionMinBet"]);

    if ((minBet ?? match.betFairSessionMinBet) > maxBet) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "match.maxMustBeGreater",
        },
      }, req, res);
    }
   
      if (id) {
        await updateTournamentBetting({ id: id }, { maxBet: maxBet, betLimit: betLimit, minBet: minBet ?? match.betFairSessionMinBet, exposureLimit: exposureLimit, isCommissionActive: isCommissionActive });
        const isMatchExist = await hasMatchInCache(matchId);
        if (isMatchExist) {
          const bettingData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[type], "json");
          if (Array.isArray(bettingData)) {
            bettingData.find((item) => item?.id == id).maxBet = maxBet;
            bettingData.find((item) => item?.id == id).minBet = minBet ?? match.betFairSessionMinBet;
            bettingData.find((item) => item?.id == id).betLimit = betLimit;
            bettingData.find((item) => item?.id == id).exposureLimit = exposureLimit;
            bettingData.find((item) => item?.id == id).isCommissionActive = isCommissionActive;
            await updateMatchKeyInCache(matchId, marketBettingTypeByBettingType[type], JSON.stringify(bettingData));
          }
        }

      }
      else {
        const hasTournamentBetting = await getTournamentBetting({ marketId: marketId, matchId: matchId }, ["id"]);
        if (hasTournamentBetting) {
          return ErrorResponse({
            statusCode: 400,
            message: {
              msg: "bet.alreadyExist",
            },
          }, req, res);
        }
        const tournamentBettingData = {
          matchId: match.id,
          minBet: minBet ?? match.betFairSessionMinBet,
          createBy: req.user.id,
          type: type,
          name: name,
          maxBet: maxBet,
          marketId: marketId,
          activeStatus: betStatusType.save,
          gtype: gtype,
          isActive: true,
          betLimit: betLimit,
          exposureLimit: exposureLimit,
          isCommissionActive: isCommissionActive,
          isManual: isManual
        };

        const tournamentBetting = await addTournamentBetting(tournamentBettingData);
         await insertTournamentRunners(runners?.map((item) => ({ ...item, bettingId: tournamentBetting?.id })));
        tournamentBetting.runners = await getTournamentRunners({ bettingId: tournamentBetting?.id });
         // sort the runner by the sort priority
        tournamentBetting.runners.sort((a, b) => a.sortPriority - b.sortPriority);
        
        const isMatchExist = await hasMatchInCache(match?.id);
        if (isMatchExist) {
          const bettingData = (await getSingleMatchKey(matchId, marketBettingTypeByBettingType[type], "json")) || [];
          if (Array.isArray(bettingData)) {
            bettingData.push(tournamentBetting);
            await updateMatchKeyInCache(match?.id, marketBettingTypeByBettingType[type], JSON.stringify(bettingData));
          }
        }
      }
    
    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchBettingMinMaxChange,
      { matchId, type, maxBet, minBet, betId: id, betLimit, exposureLimit, isCommissionActive }
    );
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Match betting" } },
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at adding match betting api type.`,
      stack: error.stack,
      message: error.message,
    });
    return ErrorResponse(error, req, res);
  }
}
