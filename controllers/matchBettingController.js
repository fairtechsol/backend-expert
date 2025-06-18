const { In } = require("typeorm");
const { marketBettingTypeByBettingType, betStatusType, socketData, matchBettingType, betStatus, resultStatus } = require("../config/contants");
const { logger } = require("../config/logger");
const { getExpertResult } = require("../services/expertResultService");
const { getMatchById } = require("../services/matchService");
const {  getMatchFromCache,  hasMatchInCache, updateMatchKeyInCache, getSingleMatchKey, getExpertsRedisKeyData } = require("../services/redis/commonfunction");
const { sendMessageToUser } = require("../sockets/socketManager");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const lodash = require('lodash');
const { updateTournamentBetting, addTournamentBetting, insertTournamentRunners, getTournamentBettingById, getTournamentBetting, getTournamentRunners, getTournamentBettings, addTournamentRunners, getSingleTournamentBetting, updateTournamentBettingStatus } = require("../services/tournamentBettingService");



exports.getTournamentBettingDetails = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { type, id, isRate } = req.query;
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
          bettingId: matchBetting?.id
        });
      }


      response = {
        match: match,
        matchBetting: matchBetting,
        runners: runners?.sort((a, b) => a.sortPriority - b.sortPriority)
      };
      if (isRate) {
        response.teamRates = JSON.parse((await getExpertsRedisKeyData(`${matchBetting?.parentBetId || id}_profitLoss_${matchId}`)) || "{}")
      }

      if (matchBetting.activeStatus != betStatus.result) {
        let expertResults = await getExpertResult({ betId: id });
  
        if (expertResults?.length != 0) {
          if (expertResults?.length == 1) {
            matchBetting.resultStatus = resultStatus.pending;
          } else {
            matchBetting.resultStatus = resultStatus.missMatched;
          }
        }
      }
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
    const { isStop, betId, isTournament } = req.body;

    if (isTournament) {
      const tournamentData = await getTournamentBettingById(betId, ["id", "matchId", "activeStatus"]);
      if (tournamentData.activeStatus == betStatusType.result) {
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

exports.addAndUpdateMatchBetting = async (req, res) => {
  try {
    const { matchId, type, name, maxBet, minBet, marketId, mid, id, gtype, sNo, runners, betLimit = 0, exposureLimit, isCommissionActive, isManual } = req.body;
    const match = await getMatchById(matchId, ["id", "betFairSessionMinBet", "stopAt"]);
    if (match.stopAt) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "bet.canNotAddTournament",
        },
      }, req, res);
    }

    if ((minBet ?? match.betFairSessionMinBet) > maxBet) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "match.maxMustBeGreater",
        },
      }, req, res);
    }
    let tournamentBettingData;
    if (id) {
      await updateTournamentBettingStatus(["id = :id OR parentBetId = :id", {
        id: id,
      }], { maxBet: maxBet, betLimit: betLimit, minBet: minBet ?? match.betFairSessionMinBet, exposureLimit: exposureLimit, isCommissionActive: isCommissionActive, name: name });
      await addTournamentRunners(runners?.map((item) => ({ runnerName: item.runnerName, id: item.id })));
      const isMatchExist = await hasMatchInCache(matchId);
      if (isMatchExist) {
        const bettingData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[type], "json");
        if (Array.isArray(bettingData)) {
          bettingData.find((item) => item?.id == id).name = name;
          bettingData.find((item) => item?.id == id).maxBet = maxBet;
          bettingData.find((item) => item?.id == id).minBet = minBet ?? match.betFairSessionMinBet;
          bettingData.find((item) => item?.id == id).betLimit = betLimit;
          bettingData.find((item) => item?.id == id).exposureLimit = exposureLimit;
          bettingData.find((item) => item?.id == id).isCommissionActive = isCommissionActive;

          bettingData.forEach(item => {
            if (item.id === id || item.parentBetId === id) {
              Object.assign(item, {
                exposureLimit: exposureLimit,
                betLimit: betLimit
              });
            }
          });

          for (let i = 0; i < runners.length; i++) {
            bettingData.find((item) => item?.id == id).runners.find((item) => item.id == runners[i].id).runnerName = runners[i].runnerName;
          }
          await updateMatchKeyInCache(matchId, marketBettingTypeByBettingType[type], JSON.stringify(bettingData?.sort((a, b) => a.sNo - b.sNo)));
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
      tournamentBettingData = {
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
        isManual: isManual,
        sNo: sNo,
        mid: mid
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
          await updateMatchKeyInCache(match?.id, marketBettingTypeByBettingType[type], JSON.stringify(bettingData?.sort((a, b) => a.sNo - b.sNo)));
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
        data: { id: tournamentBettingData?.id || id }
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

exports.cloneMatchBetting = async (req, res) => {
  try {
    const { betId, matchId, disabled } = req.body;

    const childBetting = await getTournamentBetting({ parentBetId: betId, matchId: matchId }, ["id", "activeStatus"]);
    if (childBetting && (!disabled && childBetting.activeStatus != betStatusType.close)) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "bet.canNotCloneAgain",
        },
      }, req, res);
    }
    else if (childBetting && (disabled || childBetting.activeStatus == betStatusType.close)) {
      const tournamentStatus = childBetting.activeStatus == betStatusType.close ? betStatus.save : betStatus.close
      await updateTournamentBetting({ id: childBetting.id }, { activeStatus: tournamentStatus });

      const isMatchExist = await hasMatchInCache(matchId);
      if (isMatchExist) {
        const bettingData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType.tournament, "json");
        if (Array.isArray(bettingData)) {
          bettingData.find((item) => item?.id == childBetting.id).activeStatus = tournamentStatus;
          await updateMatchKeyInCache(matchId, marketBettingTypeByBettingType.tournament, JSON.stringify(bettingData?.sort((a, b) => a.sNo - b.sNo)));
        }
      }
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "updated", keys: { name: "Match betting" } },
          data: { id: childBetting?.id }
        },
        req,
        res
      );
    }

    const match = await getMatchById(matchId, ["id", "stopAt"]);
    if (match.stopAt) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "bet.canNotAddTournament",
        },
      }, req, res);
    }
    const currTournament = await getSingleTournamentBetting({ id: betId });
    if (!currTournament) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "bet.canNotClone",
        },
      }, req, res);
    }
    if (currTournament.activeStatus == betStatusType.result) {
      return ErrorResponse({
        statusCode: 400,
        message: {
          msg: "bet.marketAlreadyDeclare",
        },
      }, req, res);
    }
    const currTournamentBettingData = {
      matchId: match.id,
      minBet: currTournament.minBet,
      createBy: req.user.id,
      type: currTournament?.type,
      name: currTournament?.name,
      maxBet: currTournament?.maxBet,
      marketId: new Date().getTime(),
      activeStatus: betStatusType.save,
      gtype: "match1",
      isActive: true,
      betLimit: currTournament?.betLimit,
      exposureLimit: currTournament?.exposureLimit,
      isCommissionActive: currTournament?.isCommissionActive,
      isManual: true,
      sNo: currTournament?.sNo,
      parentBetId: currTournament?.parentBetId || currTournament?.id,
    };

    const tournamentBetting = await addTournamentBetting(currTournamentBettingData);
    await insertTournamentRunners(currTournament?.runners?.map((item) => {
      const { id, createdAt, updatedAt, ...data } = item;
      return ({ ...data, bettingId: tournamentBetting?.id, parentRunnerId: id })
    }));
    tournamentBetting.runners = await getTournamentRunners({ bettingId: tournamentBetting?.id });
    // sort the runner by the sort priority
    tournamentBetting.runners.sort((a, b) => a.sortPriority - b.sortPriority);

    const isMatchExist = await hasMatchInCache(match?.id);
    if (isMatchExist) {
      const bettingData = (await getSingleMatchKey(matchId, marketBettingTypeByBettingType.tournament, "json")) || [];
      if (Array.isArray(bettingData)) {
        bettingData.push(tournamentBetting);
        await updateMatchKeyInCache(match?.id, marketBettingTypeByBettingType.tournament, JSON.stringify(bettingData?.sort((a, b) => a.sNo - b.sNo)));
      }
    }

    sendMessageToUser(
      socketData.expertRoomSocket,
      socketData.matchBettingMinMaxChange,
      { matchId, betId: tournamentBetting?.id }
    );
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Match betting" } },
        data: { id: tournamentBetting?.id }
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