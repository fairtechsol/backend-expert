const { ILike, IsNull, Like } = require("typeorm");
const { matchBettingType, intialMatchBettingsName, bettingType, manualMatchBettingType, initialMatchNames, marketBettingTypeByBettingType, socketData, betStatusType, walletDomain, marketMatchBettingType, teamStatus } = require("../config/contants");
const { logger } = require("../config/logger");
const { getAllProfitLossResults, getAllProfitLossResultsRace } = require("../services/betService");
const { insertMatchBettings, getMatchBattingByMatchId, updateMatchBetting, updateMatchBettingById, getMatchBetting, getMatchAllBettings } = require("../services/matchBettingService");
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
const { addRaceInCache, addRaceBetttingInCache, addMatchInCache, updateMatchInCache, updateRaceInCache, settingAllBettingMatchRedis, getMatchFromCache, updateMatchKeyInCache, updateBettingMatchRedis, getKeyFromMatchRedis, hasBettingInCache, updateMatchExpiry, hasMatchInCache } = require("../services/redis/commonfunction");
const { In } = require("typeorm");
const { getUserById } = require("../services/userService");
const { broadcastEvent, sendMessageToUser } = require("../sockets/socketManager");
const { apiCall, apiMethod, allApiRoutes } = require("../utils/apiService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { commonGetMatchDetails, commonGetMatchDetailsForFootball, commonGetRaceDetails } = require("../services/commonService");
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
      marketData,
      bookmakers,
      isManualMatch = false,
      rateThan100
    } = req.body;


    // Extract user ID from the request object
    const { id: loginId } = req.user;

    logger.info({ message: `Match added by user ${loginId} with market id: ${marketId} and Manual Match: ${isManualMatch}` });
    let user = await getUserById(loginId, ["allPrivilege", "addMatchPrivilege"])
    if (!user) {
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "User" } } }, req, res);
    }
    if (!user.allPrivilege && !user.addMatchPrivilege) {
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }

    // Check if at least one bookmaker is provided
    if (bookmakers?.length == 0) {
      return ErrorResponse({ statusCode: 400, message: { msg: "match.atLeastOneBookmaker" } }, req, res);
    }

    if (isManualMatch) {
      marketId = 'manual' + Date.now();
      const isCompetitionExist = await getOneMatchByCondition({ competitionName: ILike(competitionName) }, ['competitionName', 'competitionId']);
      if (isCompetitionExist) {
        competitionName = isCompetitionExist.competitionName;
        competitionId = isCompetitionExist.competitionId;
      }
      competitionId = competitionId || marketId;

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
      matchType, competitionId, competitionName, title, marketId, eventId, teamA, teamB, teamC, startAt, betFairSessionMaxBet: betFairSessionMaxBet, betFairSessionMinBet: minBet, createBy: loginId, rateThan100
    };

    if (teamB) {
      let maxBetValues = [...bookmakers?.map(item => item.maxBet), ...marketData?.map(item => item.maxBet)];
      let minimumMaxBet = Math.min(...maxBetValues);
      if (minimumMaxBet <= minBet) {
        return ErrorResponse({
          statusCode: 400,
          message: {
            msg: "match.maxMustBeGreater",
          },
        }, req, res);
      }
    }
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

    if (teamB) {
      let matchBetting = {
        matchId: match.id,
        minBet: minBet,
        createBy: loginId
      }

      let matchBettings = (marketData?.map((item) => {
        if (marketMatchBettingType[item?.type]) {

          return {
            ...matchBetting,
            type: item?.type,
            name: intialMatchBettingsName[item?.type],
            maxBet: item?.maxBet,
            marketId: item?.marketId,
            activeStatus: betStatusType.save,
            isManual: false
          }

        }
        return {
          ...matchBetting,
          type: item?.type,
          name: intialMatchBettingsName[item?.type],
          maxBet: item?.maxBet,
        }
      }) || []);
      matchBettings.push(...(bookmakers?.map((item, index) => {
        const { maxBet, marketName } = item;
        index++;
        return {
          ...matchBetting,
          type: matchBettingType["quickbookmaker" + index],
          name: marketName,
          maxBet: maxBet,
        };
      }) || []));


      // Attach bookmakers to the match
      let insertedMatchBettings = await insertMatchBettings(matchBettings);
      if (!insertedMatchBettings) {
        logger.error({
          error: `Match quick bookmaker add fail for quick bookmaker`,
          matchBettings: matchBettings
        });

        return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
      }

      let matchBettingData = await getMatchBattingByMatchId(match.id);

      const convertedData = matchBettingData.reduce((result, item) => {
        const key = item.type;
        result[key] = item;
        return result;
      }, {});

      for (let item of marketData) {
        if (marketMatchBettingType[item?.type]) {
          payload[marketBettingTypeByBettingType[item?.type]] = convertedData[item?.type];
        }
      }
      const manualBettingRedisData = {};
      manualMatchBettingType?.forEach((item) => {
        if (convertedData[item]) {
          manualBettingRedisData[item] = JSON.stringify(convertedData[item]);
        }
      });

      await settingAllBettingMatchRedis(match.id, manualBettingRedisData);
    }


  
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
        createdAt: match.createdAt
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
    const { id, minBet, marketData, betFairSessionMaxBet, bookmakers, startAt, rateThan100 } = req.body;
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

    let matchBatting = await getMatchBattingByMatchId(id, ["id", "minBet", "maxBet", "type"]);
    if ((!matchBatting || !matchBatting.length) && match?.teamB) {
      logger.error({
        error: `Match betting not found for match id ${id}`
      });
      return ErrorResponse({ statusCode: 404, message: { msg: "notFound", keys: { name: "Match batting" } } }, req, res);
    }

    if (loginId != match.createBy && !user.allPrivilege) {
      logger.error({
        error: `User ${loginId} don't have privilege for accessing this match ${id}`
      });
      return ErrorResponse({ statusCode: 403, message: { msg: "notAuthorized", keys: { name: "User" } } }, req, res);
    }

    if (match.teamB) {
      let maxBetValues = [...bookmakers?.map(item => item.maxBet), ...marketData?.map(item => item.maxBet)];
      let minimumMaxBet = Math.min(...maxBetValues);
      if (minimumMaxBet <= minBet) {
        return ErrorResponse({
          statusCode: 400,
          message: {
            msg: "match.maxMustBeGreater",
          },
        }, req, res);
      }
    }
    await updateMatch(id, { betFairSessionMaxBet, betFairSessionMinBet: minBet, rateThan100: rateThan100, ...(startAt ? { startAt } : {}) });


    if (match?.teamB) {
      for (let item of marketData) {
        await updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item?.maxBet, minBet: minBet });
      }
      if (bookmakers && bookmakers.length) {
        await Promise.all(bookmakers.map(item => updateMatchBetting({ id: item.id }, { maxBet: item.maxBet, minBet: minBet })));
      }
    }
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
  await updateMatchKeyInCache(id, "startAt", match.startAt);
  const matchBatting = await getMatchAllBettings({ matchId: id, type: In(manualMatchBettingType) });
  const convertedData = matchBatting.reduce((result, item) => {
    const key = item.type;
    result[key] = item;
    return result;
  }, {});

  // Create an empty object to store manual betting Redis data
  const manualBettingRedisData = {};

  // Iterate through each item in manualMatchBettingType
  manualMatchBettingType?.forEach((item) => {
    // Check if the item exists in the convertedData object
    if (convertedData[item]) {
      // If the item exists, add it to the manualBettingRedisData object
      // with its value stringified using JSON.stringify
      manualBettingRedisData[item] = JSON.stringify(convertedData[item]);
    }
  });

  // Update Redis with the manual betting data for the current match
  await settingAllBettingMatchRedis(id, manualBettingRedisData);
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

    let match;

    // splitting match ids to check if user asking for multiple match or single
    const matchIds = matchId?.split(",");
    if (matchIds?.length > 1) {
      match = [];
      for (let i = 0; i < matchIds?.length; i++) {
        match.push(await commonGetMatchDetails(matchIds[i], userId));
      }
    } else {
      match = await commonGetMatchDetails(matchId, userId);
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
exports.matchDetailsForFootball = async (req, res) => {
  try {
    const { id: matchId } = req.params;
    const userId = req?.user?.id;

    let match;

    // splitting match ids to check if user asking for multiple match or single
    const matchIds = matchId?.split(",");
    if (matchIds?.length > 1) {
      match = [];
      for (let i = 0; i < matchIds?.length; i++) {
        match.push(await commonGetMatchDetailsForFootball(matchIds[i], userId));
      }
    } else {
      match = await commonGetMatchDetailsForFootball(matchId, userId);
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

    // Update the active status based on the matchBettingType
    if (type == bettingType.session) {
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
        const matchBatting = await getMatchBattingByMatchId(matchId);

        const convertedData = matchBatting.reduce((result, item) => {
          const key = item.type;
          result[key] = item;
          return result;
        }, {});
        let payload = {
          ...match,
          ...sessionBetType,
        };

        Object.keys(marketMatchBettingType)?.forEach((item) => {
          if (convertedData[matchBettingType[item]]) {
            payload[marketBettingTypeByBettingType[item]] = convertedData[matchBettingType[item]];
          }
        });
        await updateMatchInCache(match.id, payload);
      }
      else {
        await updateMatchKeyInCache(match.id, isManualBet ? "manualSessionActive" : "apiSessionActive", isActive);
      }

    } else {
      // If it's not a session betting type, update the active status for the specific betting ID
      await updateMatchBettingById(bettingId, {
        isActive: isActive,
        statusTeamA: teamStatus.suspended,
        statusTeamB: teamStatus.suspended,
        statusTeamC: teamStatus.suspended,
        backTeamA: 0,
        backTeamB: 0,
        backTeamC: 0,
        layTeamA: 0,
        layTeamB: 0,
        layTeamC: 0
      });

      const matchBetting = await getMatchBetting({ id: bettingId });

      if (!matchBetting) {
        // If match betting is not found, return a 400 Bad Request response
        return ErrorResponse(
          {
            statusCode: 400,
            message: {
              msg: "notFound",
              keys: {
                name: "Match Betting",
              },
            },
          },
          req,
          res
        );
      }

      if (manualMatchBettingType?.includes(matchBetting?.type)) {
        const isMatchBetting = await hasBettingInCache(matchBetting?.matchId);
        if (isMatchBetting) {
          await updateBettingMatchRedis(
            matchId,
            matchBetting?.type,
            matchBetting
          );
        } else {
          const matchBatting = await getMatchBattingByMatchId(
            matchBetting?.matchId
          );
          const convertedData = matchBatting.reduce((result, item) => {
            const key = item.type;
            result[key] = item;
            return result;
          }, {});

          // Create an empty object to store manual betting Redis data
          const manualBettingRedisData = {};

          // Iterate through each item in manualMatchBettingType
          manualMatchBettingType?.forEach((item) => {
            // Check if the item exists in the convertedData object
            if (convertedData[item]) {
              // If the item exists, add it to the manualBettingRedisData object
              // with its value stringified using JSON.stringify
              manualBettingRedisData[item] = JSON.stringify(
                convertedData[item]
              );
            }
          });

          // Update Redis with the manual betting data for the current match
          await settingAllBettingMatchRedis(match.id, manualBettingRedisData);
        }
      }
      else {
        const redisMatch = await getKeyFromMatchRedis(matchBetting?.matchId, marketBettingTypeByBettingType[matchBetting?.type]);

        if (!redisMatch) {

          const matchBatting = await getMatchBattingByMatchId(match.id);
          const convertedData = matchBatting.reduce((result, item) => {
            const key = item.type;
            result[key] = item;
            return result;
          }, {});
          let payload = {
            ...match
          };

          Object.keys(marketMatchBettingType)?.forEach((item) => {
            if (convertedData[matchBettingType[item]]) {
              payload[marketBettingTypeByBettingType[item]] = convertedData[matchBettingType[item]];
            }
          });

          await updateMatchInCache(match.id, payload);
        }
        else {
          await updateMatchKeyInCache(matchBetting?.matchId, marketBettingTypeByBettingType[matchBetting?.type],
            JSON.stringify(matchBetting)
          )
        }
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
    const { competitionId } = req.params;

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
    const { competitionId, date } = req.params;

    const matches = await getMatchByCompetitionIdAndDates(competitionId, date);

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

    logger.info({ message: `Race added by user ${loginId} with market id: ${marketId}` });
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

// Controller method for updating the active status of betting
exports.multipleMatchActiveInActive = async (req, res) => {
  try {
    // Destructuring properties from the request body
    const { matchId, type, isActive } = req.body;

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

    let cacheMatch = await getMatchFromCache(matchId);
    let match = cacheMatch;
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

 
      // If it's not a session betting type, update the active status for the specific betting ID
    await updateMatchBetting({ name: Like(`${type}%`), matchId: matchId }, {
        isActive: isActive
      });

      const matchBetting = await getMatchAllBettings({  name: Like(`${type}%`), matchId: matchId });

      if (!matchBetting?.length) {
        // If match betting is not found, return a 400 Bad Request response
        return ErrorResponse(
          {
            statusCode: 400,
            message: {
              msg: "notFound",
              keys: {
                name: "Match Betting",
              },
            },
          },
          req,
          res
      );
    }

    if (cacheMatch) {
      for (let item of matchBetting) {
        await updateMatchKeyInCache(matchId, marketBettingTypeByBettingType[item?.type],
          JSON.stringify(item)
        )
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
      error: `Error at updating active status of multiple betting table for match ${req.body.matchId}.`,
      stack: err.stack,
      message: err.message,
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};