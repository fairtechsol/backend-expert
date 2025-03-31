const { ILike, IsNull } = require("typeorm");
const { bettingType, marketBettingTypeByBettingType, socketData, walletDomain} = require("../config/contants");
const { logger } = require("../config/logger");
const { getAllProfitLossResults, getAllProfitLossResultsRace } = require("../services/betService");
const { getRaceByMarketId, raceAddMatch, deleteRace, getRacingMatchById } = require("../services/racingMatchService");
const { insertRaceBettings, insertRunners, getRacingBetting, updateRaceBetting } = require("../services/raceBettingService");
const {
  getMatchById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
  getMatch,
  getMatchCompetitions,
  getMatchDates,
  getMatchByCompetitionIdAndDates,
  getMatchWithBettingAndSession,
  getOneMatchByCondition,
} = require("../services/matchService");

const { addRaceInCache, addMatchInCache, updateMatchInCache, updateRaceInCache,  getMatchFromCache, updateMatchKeyInCache, hasBettingInCache,  hasMatchInCache, getSingleMatchKey } = require("../services/redis/commonfunction");
const { getUserById } = require("../services/userService");
const { broadcastEvent, sendMessageToUser } = require("../sockets/socketManager");
const { apiCall, apiMethod, allApiRoutes } = require("../utils/apiService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { commonGetMatchDetails, commonGetRaceDetails } = require("../services/commonService");
const { getRacingMatchCountryList, getRacingMatchDateList, getRacingMatch } = require("../services/racingMatchService");
const { getCardMatch } = require("../services/cardMatchService");
const { updateTournamentBetting } = require("../services/tournamentBettingService");
/**
 * Create or update a match.
 *
 * @function
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise that resolves once the operation is complete.
 */
exports.createMatch = async (req, res) => {
  try {
    // Extract relevant information from the request body
    let {
      matchType,
      competitionId,
      competitionName,
      title,
      marketId,
      eventId,
      teamA,
      teamB,
      teamC,
      startAt,
      minBet,
      betFairSessionMaxBet,
      isManualMatch = false,
      rateThan100,
      isTv,
      isFancy,
      isBookmaker
    } = req.body;


    // Extract user ID from the request object
    const { id: loginId } = req.user;

    let user = await getUserById(loginId, ["allPrivilege", "addMatchPrivilege"])
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }
    if (!user.allPrivilege && !user.addMatchPrivilege) {
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }

    if (isManualMatch) {
      marketId = 'manual' + Date.now();
      // const isCompetitionExist = await getOneMatchByCondition({ competitionName: ILike(competitionName) }, ['competitionName', 'competitionId']);
      // if (isCompetitionExist) {
      //   competitionName = isCompetitionExist.competitionName;
      //   competitionId = isCompetitionExist.competitionId;
      // }
      // competitionId = competitionId || marketId;

      if (!title) {
        title = teamA + ' v ' + teamB;
      }
      eventId = marketId;

      // marketData = marketData?.filter((item) => Boolean(marketMatchBettingType[item?.type]) == true)?.map((item) => {
      //   return ({
      //     ...item, marketId: marketId
      //   })
      // });

      const isManualMatchExist = await getOneMatchByCondition({ title: ILike(title), stopAt: IsNull() }, ['id', 'title']);
      if (isManualMatchExist) {
        logger.error({
          error: `Match already exist for title: ${title}`
        });
        return ErrorResponse({ statusCode: 400, message: { msg: "alreadyExist", keys: { name: "Match" } } }, req, res);
      }
    }

    // Prepare match data for a new match
    let matchData = {
      matchType, competitionId, competitionName, title, marketId, eventId, teamA, teamB, teamC, startAt, betFairSessionMaxBet: betFairSessionMaxBet, betFairSessionMinBet: minBet, createBy: loginId, rateThan100, isTv,
      isFancy,
      isBookmaker
    };

    // Check if market ID already exists
    const isMarketIdPresent = await getMatchByMarketId(marketId);
    if (isMarketIdPresent) {
      logger.error({
        error: `Match already exist for market id: ${marketId}`
      });

      return ErrorResponse({ statusCode: 400, message: { msg: "alreadyExist", keys: { name: "Match" } } }, req, res);
    }
    // Add the new match
    const match = await addMatch(matchData);
    if (!match) {
      logger.error({
        error: `Match add fail for market id: ${marketId}`
      });

      return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    }

    let payload = {
      ...match
    };

    await addMatchInCache(match.id, payload);

    broadcastEvent(socketData.addMatchEvent, { gameType: match?.matchType });

    await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.addMatch,
      {
        matchType: match.matchType,
        competitionId: match.competitionId,
        competitionName: match.competitionName,
        title: match.title,
        marketId: match.marketId,
        eventId: match.eventId,
        teamA: match.teamA,
        teamB: match.teamB,
        teamC: match.teamC,
        startAt: match.startAt,
        id: match.id,
        createdAt: match.createdAt,
        isTv: match.isTv,
        isFancy: match.isFancy,
        isBookmaker: match.isBookmaker
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at add match.`,
          stack: err.stack,
          message: err.message,
        });
        throw err;
      });

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "Match",
          },
        },
        data: { match },
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at add match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};
exports.updateMatch = async (req, res) => {
  try {
    // Extract relevant information from the request body
    const { id, minBet, betFairSessionMaxBet, startAt, rateThan100 } = req.body;
    //get user data to check privilages
    const { id: loginId } = req.user;


    const user = await getUserById(loginId, ["allPrivilege", "addMatchPrivilege", "betFairMatchPrivilege", "bookmakerMatchPrivilege", "sessionMatchPrivilege"]);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }

    // Check if the match exists
    let match = await getMatchById(id, ["id", "createBy", "betFairSessionMinBet", "betFairSessionMaxBet", "rateThan100", "teamB"]);

    if (!match) {
      logger.error({
        error: `Match not found for id ${id}`
      });
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }

    if (loginId != match.createBy && !user.allPrivilege) {
      logger.error({
        error: `User ${loginId} don't have privilege for accessing this match ${id}`
      });
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }

    await updateMatch(id, { betFairSessionMaxBet, betFairSessionMinBet: minBet, rateThan100: rateThan100, ...(startAt ? { startAt } : {}) });

    const isExistInRedis=await hasMatchInCache(id);
    if(isExistInRedis){
      updateMatchDataAndBettingInRedis(id);
    }
    // await Promise.all(updatePromises);

    sendMessageToUser(socketData.expertRoomSocket, socketData.updateMatchEvent, match);
    // Send success response with the updated match data
    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "updated",
          keys: {
            name: "Match",
          },
        },
        data: match
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at update match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

const updateMatchDataAndBettingInRedis = async (id) => {
  const match = await getMatchById(id);
  await updateMatchKeyInCache(id, "betFairSessionMaxBet", match.betFairSessionMaxBet);
  await updateMatchKeyInCache(id, "startAt", match.startAt);
  await updateMatchKeyInCache(id, "rateThan100", match.rateThan100);
}

exports.listMatch = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;
    const {
      id: loginId, allPrivilege, betFairMatchPrivilege, bookmakerMatchPrivilege, sessionMatchPrivilege,
    } = req.user;
    const filters =
      allPrivilege ||
        betFairMatchPrivilege ||
        bookmakerMatchPrivilege ||
        sessionMatchPrivilege
        ? {}
        : {
          createBy: loginId,
        };

    //   let userRedisData = await internalRedis.hgetall(user.userId);
    const match = await getMatch(filters, fields?.split(",") || null, query);
    if (!match) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "notFound",
            keys: {
              name: "Match",
            },
          },
        },
        req,
        res
      );
    }

    for (let i = 0; i < match?.matches?.length; i++) {
      match.matches[i].pl = await getAllProfitLossResults(match.matches[i].id);
    }


    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.matchDetails = async (req, res) => {
  try {
    const { id: matchId } = req.params;
    const userId = req?.user?.id;
    let { isSessionAllowed, isMarketAllowed } = req.query;
    isSessionAllowed = isSessionAllowed == 'false' ? false : true
    isMarketAllowed = isMarketAllowed == 'false' ? false : true
    let match;

    // splitting match ids to check if user asking for multiple match or single
    const matchIds = matchId?.split(",");
    if (matchIds?.length > 1) {
      match = [];
      for (let i = 0; i < matchIds?.length; i++) {
        match.push(await commonGetMatchDetails(matchIds[i], userId, isSessionAllowed, isMarketAllowed));
      }
    } else {
      match = await commonGetMatchDetails(matchId, userId, isSessionAllowed, isMarketAllowed);
    }

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match Details" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error while getting match detail for match: ${req.params.id}.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

// Controller method for updating the active status of betting
exports.matchActiveInActive = async (req, res) => {
  try {
    // Destructuring properties from the request body
    const { matchId, bettingId, type, isManualBet, isActive } = req.body;

    const { allPrivilege, addMatchPrivilege } = req.user;

    if (!allPrivilege && !addMatchPrivilege) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "notAuthorized",
            keys: {
              name: "Expert",
            },
          },
        },
        req,
        res
      );
    }

    let match = await getMatchFromCache(matchId);

    if (!match) {
      match = await getMatchById(matchId);
    }

    if (!match) {
      // If match is not found, return a 400 Bad Request response
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "notFound",
            keys: {
              name: "Match",
            },
          },
        },
        req,
        res
      );
    }

    if (type == bettingType.tournament) {
      await updateTournamentBetting({ id: bettingId }, { isActive: isActive });
      const isMatchExist = await hasMatchInCache(matchId);
      if (isMatchExist) {
        const bettingData = await getSingleMatchKey(matchId, marketBettingTypeByBettingType[type], "json");
        if (Array.isArray(bettingData)) {
          bettingData.find((item) => item?.id == bettingId).isActive = isActive;
          await updateMatchKeyInCache(matchId, marketBettingTypeByBettingType[type], JSON.stringify(bettingData?.sort((a, b) => a.sNo - b.sNo)));
        }
      }
    }

    // Update the active status based on the matchBettingType
    else if (type == bettingType.session) {
      const sessionBetType = isManualBet
        ? {
          manualSessionActive: isActive,
        }
        : {
          apiSessionActive: isActive,
        };

      // If it's a session betting type, update sessionActive accordingly
      await updateMatch(matchId, sessionBetType);

      const isMatchBetting = await hasBettingInCache(matchId);
      if (!isMatchBetting) {
        let payload = {
          ...match,
          ...sessionBetType,
        };
        await updateMatchInCache(match.id, payload);
      }
      else {
        await updateMatchKeyInCache(match.id, isManualBet ? "manualSessionActive" : "apiSessionActive", isActive);
      }

    }

    sendMessageToUser(matchId, socketData.matchActiveInActiveEvent);
    // Return a success response with the updated match information
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "updated", keys: { name: "Match" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    // Log any errors that occur during the process
    logger.error({
      error: `Error at updating active status of betting table for match ${req.body.matchId}.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.getMatchCompetitionsByType = async (req, res) => {
  try {
    const { type } = req.params;

    const competitions = await getMatchCompetitions(type);

    return SuccessResponse(
      {
        statusCode: 200,
        data: competitions,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list competition for the user.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.getMatchDatesByCompetitionId = async (req, res) => {
  try {
    const { type  } = req.params;

    const dates = await getMatchDates(type);

    return SuccessResponse(
      {
        statusCode: 200,
        data: dates,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list date for the user.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.getMatchDatesByCompetitionIdAndDate = async (req, res) => {
  try {
    const {  date, type  } = req.params;

    const matches = await getMatchByCompetitionIdAndDates(type, date);

    return SuccessResponse(
      {
        statusCode: 200,
        data: matches,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list match for the user.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.matchListWithManualBetting = async (req, res) => {
  try {
    const { matchType } = req.query;
    const {
      allPrivilege, addMatchPrivilege, bookmakerMatchPrivilege, sessionMatchPrivilege,
    } = req.user;

    const match = await getMatchWithBettingAndSession(
      allPrivilege,
      addMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
      matchType
    );
    if (!match) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: { msg: "notFound", keys: { name: "Match" }, },
        },
        req, res
      );
    }

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list match for the manual betting and session.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.racingCreateMatch = async (req, res) => {
  try {
    let {
      matchType,
      title,
      marketId,
      eventId,
      runners,
      startAt,
      minBet,
      venue,
      raceType,
      countryCode,
      maxBet,
      type
    } = req.body;

    // Extract user ID from the request object
    const { id: loginId } = req.user;

    let user = await getUserById(loginId, ["allPrivilege", "addMatchPrivilege"])
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }
    if (!user.allPrivilege && !user.addMatchPrivilege) {
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }

    // Check if market ID already exists
    const isRacePresent = await getRaceByMarketId({ marketId });
    if (isRacePresent) {
      logger.error({
        error: `Race already exist for market id: ${marketId}`
      });

      return ErrorResponse({ statusCode: 400, message: { msg: "alreadyExist", keys: { name: "Race" } } }, req, res);
    }

    // Prepare race data for a new race
    let raceData = {
      countryCode, matchType, title, marketId, eventId, startAt, createBy: loginId, eventName: title, venue, raceType, betPlaceStartBefore: 5
    };

    const race = await raceAddMatch(raceData);

    if (!race) {
      logger.error({
        error: `Match add fail for market id: ${marketId}`
      });

      return ErrorResponse({ statusCode: 400, message: { msg: "race.matchAddFail" } }, req, res);
    }

    let matchBettings = {
      matchId: race.id, minBet: minBet, createBy: loginId, createdAt: race.createdAt, type, name: title, maxBet, marketId
    }

    try {
      var insertedRaceBettings = await insertRaceBettings(matchBettings);
    } catch (error) {
      await deleteRace({ id: race.id });
      logger.error({
        error: `An error occurred while inserting race bettings.`,
        matchBettings: matchBettings,
        details: error.message
      });

      return ErrorResponse(err, req, res);
    }

    let runnersData = [];
    for (let runner of runners) {
      let runnerData = {
        matchId: race.id,
        createBy: loginId,
        bettingId: insertedRaceBettings.id,
        metadata: runner.metadata,
        runnerName: runner.runnerName,
        selectionId: runner.selectionId,
        sortPriority: runner.sortPriority
      };
      runnersData.push(runnerData);
    }

    let runnerData = await insertRunners(runnersData);

    let stringRunnerData = JSON.stringify(runnerData)
    let stringBettingData = JSON.stringify(insertedRaceBettings)


    const runnerAndRaceData = {
      ...race,
      runners: stringRunnerData,
      matchOdd: stringBettingData
    };

    await addRaceInCache(race.id, runnerAndRaceData)
    broadcastEvent(socketData.addMatchEvent, { gameType: race?.matchType, startAt: startAt, countryCode: countryCode });

    await apiCall(
      apiMethod.post,
      walletDomain + allApiRoutes.wallet.addRaceMatch,
      {
        matchType: race.matchType,
        title: race.title,
        marketId: race.marketId,
        createBy: loginId,
        eventId: race.eventId,
        startAt: race.startAt,
        id: race.id,
        venue: venue,
        raceType: raceType,
        countryCode: countryCode,
        createdAt: race.createdAt
      }
    )
      .then((data) => {
        return data;
      })
      .catch(async (err) => {
        logger.error({
          error: `Error at add race.`,
          stack: err.stack,
          message: err.message,
        });
        throw err;
      });

    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "Race",
          },
        },
        data: { race, insertedRaceBettings },
      },
      req,
      res
    );

  } catch (err) {
    logger.error({
      error: `Error at add race for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
}

exports.racingUpdateMatch = async (req, res) => {
  try {
    // Extract relevant information from the request body
    const { id, minBet, maxBet } = req.body;
    //get user data to check privilages
    const { id: loginId } = req.user;


    const user = await getUserById(loginId, ["allPrivilege", "addMatchPrivilege", "betFairMatchPrivilege", "bookmakerMatchPrivilege", "sessionMatchPrivilege"]);
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }

    // Check if the race exists
    let race = await getRacingMatchById(id, ["id", "createBy"]);

    if (!race) {
      logger.error({
        error: `Match not found for id ${id}`
      });
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }

    let raceBatting = await getRacingBetting({ matchId: id });
    if (!raceBatting) {
      logger.error({
        error: `Race betting not found for race id ${id}`
      });
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Race batting" } } }, req, res);
    }

    if (loginId != race.createBy && !user.allPrivilege) {
      logger.error({
        error: `User ${loginId} don't have privilege for accessing this race ${id}`
      });
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }


    await updateRaceBetting({ matchId: id }, { minBet, maxBet });
    raceBatting.minBet = minBet;
    raceBatting.maxBet = maxBet;

    updateRaceInCache(raceBatting.matchId, raceBatting);

    sendMessageToUser(socketData.expertRoomSocket, socketData.updateMatchEvent,raceBatting);
    // Send success response with the updated race data
    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "updated",
          keys: {
            name: "Race",
          },
        },
        data: raceBatting
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at update race for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};


exports.raceDetails = async (req, res) => {
  try {
    const { id: raceId } = req.params;
    const userId = req?.user?.id;
    let race = [];

    const raceIds = raceId?.split(",");

    for (let i = 0; i < raceIds?.length; i++) {
      race.push(await commonGetRaceDetails(raceIds[i], userId));
    }

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match Details" } },
        data: raceIds.length == 1 ? race[0] : race,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error while getting match detail for match: ${req.params.id}.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.cardDetails = async (req, res) => {
  try {
    const { type } = req.params;

    let casinoDetails = await getCardMatch({ type: type });

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Card Details" } },
        data: casinoDetails,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error while getting card detail for match: ${req.params.id}.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};


exports.racingMatchDateList = async (req, res) => {
  try {
    const { page, limit, matchType } = req.query;
    const { id: loginId, allPrivilege, betFairMatchPrivilege, bookmakerMatchPrivilege, sessionMatchPrivilege } = req.user;
    const filters = allPrivilege || betFairMatchPrivilege || bookmakerMatchPrivilege || sessionMatchPrivilege ? {} : { createBy: loginId };
    if (matchType) {
      filters.matchType = matchType
    }
    const match = await getRacingMatchDateList(filters, page, limit);
    if (!match) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "notFound",
            keys: {
              name: "Match",
            },
          },
        },
        req,
        res
      );
    }

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list racing match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.racingCountryCodeList = async (req, res) => {
  try {
    const { date, matchType } = req.query;
    const { id: loginId, allPrivilege, betFairMatchPrivilege, bookmakerMatchPrivilege, sessionMatchPrivilege } = req.user;
    const filters = allPrivilege || betFairMatchPrivilege || bookmakerMatchPrivilege || sessionMatchPrivilege ? {} : { createBy: loginId };
    if (matchType) {
      filters.matchType = matchType
    }
    const match = await getRacingMatchCountryList(filters, date);
    if (!match) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "notFound",
            keys: {
              name: "Match",
            },
          },
        },
        req,
        res
      );
    }
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list racing match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.listRacingMatch = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;
    const { id: loginId, allPrivilege, betFairMatchPrivilege, bookmakerMatchPrivilege, sessionMatchPrivilege } = req.user;
    const filters = allPrivilege || betFairMatchPrivilege || bookmakerMatchPrivilege || sessionMatchPrivilege ? {} : { createBy: loginId };

    const match = await getRacingMatch(filters, fields?.split(",") || null, query);
    if (!match) {
      return ErrorResponse({ statusCode: 400, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }

    for (let i = 0; i < match?.matches?.length; i++) {
      match.matches[i].pl = await getAllProfitLossResultsRace(match.matches[i].id);
    }

    const matchData = match?.matches?.reduce((acc, item) => {
      const venue = item?.venue;
      acc[venue] = acc[venue] || [];
      acc[venue].push(item);
      return acc;
    }, {});

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: matchData,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

