const { matchBettingType, intialMatchBettingsName, bettingType, tiedMatchNames, manualMatchBettingType } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { insertMatchBettings, getMatchBattingByMatchId, updateMatchBetting, updateMatchBettingById } = require("../services/matchBettingService");
const {
  getMatchById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
  getMatch,
  getMatchDetails,
} = require("../services/matchService");
const { addMatchInCache, updateMatchInCache, settingAllBettingMatchRedis, getMatchFromCache, getAllBettingRedis, getAllSessionRedis, settingAllSessionMatchRedis } = require("../services/redis/commonfunction");
const { getSessionBattingByMatchId } = require("../services/sessionBettingService");
const { getUserById } = require("../services/userService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
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
    const {
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
      matchOddMaxBet,
      betFairSessionMaxBet,
      betFairBookmakerMaxBet,
      bookmakers,
      marketTiedMatchMaxBet,
      manualTiedMatchMaxBet
    } = req.body;

    /* access work left */

    // Extract user ID from the request object
    const { id: loginId } = req.user;

    logger.info({message:`Match added by user ${loginId} with market id: ${marketId}`});
    let user = await getUserById(loginId,["allPrivilege","addMatchPrivilege"])
    if(!user){
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
    }
    if(!user.allPrivilege && !user.addMatchPrivilege){
      return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
    }

    // Check if at least one bookmaker is provided
    if (bookmakers?.length == 0) {
      return ErrorResponse({statusCode: 400,message: {msg: "match.atLeastOneBookmaker"}},req,res);
    }
    // If ID is not provided, it's a new match creation

    // Check if market ID already exists
    const isMarketIdPresent = await getMatchByMarketId(marketId);
    if (isMarketIdPresent) {
        logger.error({
            error: `Match already exist for market id: ${marketId}`
          });

      return ErrorResponse({statusCode: 400,message: {msg: "alreadyExist",keys: {name: "Match"}}},req,res);
    }

    // Prepare match data for a new match
    let matchData = {
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
      betFairSessionMaxBet : betFairSessionMaxBet,
      betFairSessionMinBet: minBet,
      createBy: loginId
    };

    let maxBetValues = bookmakers.map(item => item.maxBet);
    let minimumMaxBet = Math.min(...maxBetValues);
    if(minimumMaxBet < minBet){
 
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "match.maxMustBeGreater",
          },
        },
        req,
        res
      );
    }
    // Add the new match
    const match = await addMatch(matchData);
    if (!match) {
        logger.error({
            error: `Match add fail for market id: ${marketId}`
          });

      return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    }

    let matchBetting = {
      matchId: match.id,
      minBet: minBet,
      createBy: loginId
    }

    let matchBettings = [
      {
        ...matchBetting,
        type: matchBettingType.matchOdd,
        name: intialMatchBettingsName.initialMatchOdd,
        maxBet: matchOddMaxBet,
      },
      {
        ...matchBetting,
        type: matchBettingType.bookmaker,
        name: intialMatchBettingsName.initialBookmaker,
        maxBet: betFairBookmakerMaxBet,
      },
      {
        ...matchBetting,
        type: matchBettingType.tiedMatch1,
        name: tiedMatchNames.market,
        maxBet:marketTiedMatchMaxBet
      },
      {
        ...matchBetting,
        type: matchBettingType.tiedMatch2,
        name: tiedMatchNames.manual,
        maxBet:manualTiedMatchMaxBet
      }
    ]

    // Prepare bookmakers for the new match
    bookmakers?.map((item, index) => {
      const { maxBet, marketName } = item;
      index++;
      // Add the bookmaker
      matchBettings.push({
        type: matchBettingType["quickbookmaker" + index],
        matchId: match.id,
        name: marketName,
        minBet: minBet,
        maxBet: maxBet,
        createBy:loginId
      });
    });

    // Attach bookmakers to the match
    let insertedMatchBettings = await insertMatchBettings(matchBettings);
    if (!insertedMatchBettings) {
        logger.error({
            error: `Match quick bookmaker add fail for quick bookmaker`,
            matchBettings:matchBettings
          });

      return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    }
 
    let matchBettingData = await getMatchBattingByMatchId(match.id);

    const convertedData = matchBettingData.reduce((result, item) => {
      const key = item.type; // Assuming type is unique and case-insensitive

      if (!manualMatchBettingType?.includes(key)) {
        result[key] = {
          id: item.id,
          minBet: item.minBet,
          maxBet: item.maxBet,
          activeStatus: item.activeStatus,
        };
      } else {
        result[key] = item;
      }
      return result;
    }, {});

    let payload = {
      ...match,
      matchOdd: convertedData[matchBettingType.matchOdd],
      marketBookmaker: convertedData[matchBettingType.bookmaker],
      marketTiedMatch: convertedData[matchBettingType.tiedMatch2],
    };
    await addMatchInCache(match.id, payload);
    const manualBettingRedisData ={};
     manualMatchBettingType?.forEach((item) => {
      if(convertedData[item]){
        manualBettingRedisData[item]= JSON.stringify(convertedData[item]);
      }
    });

    await settingAllBettingMatchRedis(match.id, manualBettingRedisData);
    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "Match",
          },
        },
        data: {match,matchBettingData},
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
    const {
      id,
      minBet,
      matchOddMaxBet,
      betFairSessionMaxBet,
      betFairBookmakerMaxBet,
      bookmakers,
      tiedMatch
    } = req.body;
    //get user data to check privilages
    const { id: loginId } = req.user;
    const user = await getUserById(loginId,["allPrivilege","addMatchPrivilege","betFairMatchPrivilege","bookmakerMatchPrivilege","sessionMatchPrivilege"]);
    if(!user){
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
    }

    // Check if the match exists
    let match = await getMatchById(id, ["id","createBy", "betFairSessionMinBet", "betFairSessionMaxBet"]);

    if (!match) {
        logger.error({
            error: `Match not found for id ${id}`
          });
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match"}}},req,res);
    }

    let matchBatting = await getMatchBattingByMatchId(id, ["id", "minBet", "maxBet", "type"]);
    if(!matchBatting || !matchBatting.length){
        logger.error({
            error: `Match betting not found for match id ${id}`
          });
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match batting"}}},req,res)
    }

    if(loginId != match.createBy && !user.allPrivilege){
      logger.error({
        error: `User ${loginId} don't have privilege for accessing this match ${id}`
      });
        return ErrorResponse({statusCode: 403,message: {msg: "notAuthorized",keys: {name: "User"}}},req,res);
    }

    if (minBet) {
      await updateMatchBetting({ matchId: id }, { minBet });
      await updateMatch(id, { betFairSessionMinBet: minBet });
    }

    if (matchOddMaxBet) {
      await updateMatchBetting({ matchId: id, type: matchBettingType.matchOdd }, { maxBet: matchOddMaxBet });
    }

    if (betFairSessionMaxBet) {
      await updateMatch(id, { betFairSessionMaxBet });
    }

    if (betFairBookmakerMaxBet) {
      await updateMatchBetting({ matchId: id, type: matchBettingType.bookmaker }, { maxBet: betFairBookmakerMaxBet });
    }

    if (bookmakers && bookmakers.length) {
      logger.info({
        message: `User ${loginId} updating bookmaker this match ${id}`,
        bookmakers:bookmakers
      });
      await Promise.all[bookmakers.map(item => updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item.maxBet }))];
    }

    if (tiedMatch && tiedMatch.length) {
      logger.info({
        message: `User ${loginId} updating tied match this match ${id}`,
        tiedMatch:tiedMatch
      });
      await Promise.all[tiedMatch.map(item => updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item.maxBet }))];
    }

    // await Promise.all(updatePromises);

    match = await getMatchById(id, ["id", "betFairSessionMinBet", "betFairSessionMaxBet"]);
    matchBatting = await getMatchBattingByMatchId(id);
    const convertedData = matchBatting.reduce((result, item) => {
      const key = item.type; // Assuming type is unique and case-insensitive
      if (!manualMatchBettingType?.includes(key)) {
        result[key] = {
          id: item.id,
          minBet: item.minBet,
          maxBet: item.maxBet,
          activeStatus: item.activeStatus,
        };
      } else {
        result[key] = item;
      }
      return result;
    }, {});

    let payload = {
      ...match,
      matchOdd: convertedData[matchBettingType.matchOdd],
      marketBookmaker: convertedData[matchBettingType.bookmaker],
      marketTiedMatch: convertedData[matchBettingType.tiedMatch2],
    };
    updateMatchInCache(match.id, payload);

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
    await settingAllBettingMatchRedis(match.id, manualBettingRedisData);

    
    // Attach bookmaker data to the match object
    match["bookmaker"] = matchBatting;

   

    //   broadcastEvent("newMatchAdded", match);

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
        data : match
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


exports.listMatch = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;
    const { id: loginId } = req.user;

    const loginUser = await getUserById(loginId, [
      "id",
      "allPrivilege",
      "addMatchPrivilege",
      "betFairMatchPrivilege",
      "bookmakerMatchPrivilege",
      "sessionMatchPrivilege",
    ]);

    const filters = loginUser?.allPrivilege||loginUser?.betFairMatchPrivilege||loginUser?.bookmakerMatchPrivilege||loginUser?.sessionMatchPrivilege
      ? {}
      : {
        "createBy": loginId,
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

    let match = await getMatchFromCache(matchId);

    // Check if the match exists
    if (match) {
      // Retrieve all betting data from Redis for the given match
      let betting = await getAllBettingRedis(matchId);

      // If betting data is found in Redis, update its expiry time
      if (!betting) {
        
        // If no betting data is found in Redis, fetch it from the database
        betting = await getMatchBattingByMatchId(matchId);

        // Create an empty object to store manual betting Redis data
        const manualBettingRedisData = {};

        // Iterate through each item in manualMatchBettingType
        betting?.forEach((item) => {
          // Check if the item exists in the convertedData object
          if (manualMatchBettingType.includes(item?.type)) {
            // If the item exists, add it to the manualBettingRedisData object
            // with its value stringified using JSON.stringify
            item.type = JSON.stringify(item);
          }
        });

        // Update Redis with the manual betting data for the current match
        await settingAllBettingMatchRedis(match.id, manualBettingRedisData);
      }

      // Retrieve all session data from Redis for the given match
      let sessions = await getAllSessionRedis(matchId);

      // If session data is found in Redis, update its expiry time
      if (!sessions) {
     
        // If no session data is found in Redis, fetch it from the database
        sessions = await getSessionBattingByMatchId(matchId);

        let result = {};
        for (let index = 0; index < sessions?.length; index++) {
          sessions[index] = JSON.stringify(sessions?.[index]);
          result[sessions?.[index]?.id] = sessions?.[index];
        }
        await settingAllSessionMatchRedis(matchId, result);
      }

      const categorizedMatchBettings = {
        ...(match.matchOdd
          ? { [matchBettingType.matchOdd]: JSON.parse(match.matchOdd) }
          : {}),
        ...(match.marketBookmaker
          ? { [matchBettingType.bookmaker]: JSON.parse(match.marketBookmaker) }
          : {}),
        quickBookmaker: [],
        ...(match.marketTiedMatch
          ? { apiTideMatch: JSON.parse(match.marketTiedMatch) }
          : {}),
        manualTiedMatch: null,
      };
      // Iterate through matchBettings and categorize them
      (Object.values(betting) || []).forEach((item) => {
        item=JSON.parse(item);
        switch (item?.type) {
          case matchBettingType.quickbookmaker1:
          case matchBettingType.quickbookmaker2:
          case matchBettingType.quickbookmaker3:
            categorizedMatchBettings.quickBookmaker.push(item);
            break;
          case matchBettingType.tiedMatch2:
            categorizedMatchBettings.manualTiedMatch= item;
            break;
        }
      });
      // Assign the categorized match betting to the match object
      Object.assign(match, categorizedMatchBettings);

      delete match.matchOdd;
      delete match.marketBookmaker;
      delete match.marketTiedMatch;

      match.sessionBettings = sessions;
    } else {
      match = await getMatchDetails(matchId, []);
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

      const categorizedMatchBettings = {
        [matchBettingType.matchOdd]: null,
        [matchBettingType.bookmaker]: null,
        quickBookmaker: [],
        apiTideMatch: null,
        manualTideMatch: null,
      };

      // Iterate through matchBettings and categorize them
      (match?.matchBettings || []).forEach((item) => {
        switch (item?.type) {
          case matchBettingType.matchOdd:
            categorizedMatchBettings[matchBettingType.matchOdd] = item;
            break;
          case matchBettingType.bookmaker:
            categorizedMatchBettings[matchBettingType.bookmaker] = item;
            break;
          case matchBettingType.quickbookmaker1:
          case matchBettingType.quickbookmaker2:
          case matchBettingType.quickbookmaker3:
            categorizedMatchBettings.quickBookmaker.push(item);
            break;
          case matchBettingType.tiedMatch1:
            categorizedMatchBettings.apiTideMatch = item;
            break;
          case matchBettingType.tiedMatch2:
            categorizedMatchBettings.manualTideMatch = item;
            break;
        }
      });

      let payload = {
        ...match,
        matchOdd: categorizedMatchBettings[matchBettingType.matchOdd],
        marketBookmaker: categorizedMatchBettings[matchBettingType.bookmaker],
        marketTiedMatch: categorizedMatchBettings.tideMatch,
      };
      await addMatchInCache(match.id, payload);

      // Create an empty object to store manual betting Redis data
      const manualBettingRedisData = {};

      // Iterate through each item in manualMatchBettingType
      match?.matchBettings?.forEach((item) => {
        // Check if the item exists in the convertedData object
        if (manualMatchBettingType.includes(item?.type)) {
          // If the item exists, add it to the manualBettingRedisData object
          // with its value stringified using JSON.stringify
          manualBettingRedisData[item?.type] = JSON.stringify(item);
        }
      });

      // Update Redis with the manual betting data for the current match
      await settingAllBettingMatchRedis(matchId, manualBettingRedisData);

      let sessions = match?.sessionBettings;
      let result = {};
      for (let index = 0; index < sessions?.length; index++) {
        sessions[index] = JSON.stringify(sessions?.[index]);
        result[sessions?.[index]?.id] = sessions?.[index];
      }
      await settingAllSessionMatchRedis(matchId, result);

      match.sessionBettings=sessions;
      // Assign the categorized match betting to the match object
      Object.assign(match, categorizedMatchBettings);

      delete match.matchBettings;
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
    const { matchId, bettingId, matchBettingType, isManualBet, isActive } =
      req.body;

    // Check if the match with the given ID exists
    const match = await getMatchById(matchId, ["id"]);
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
    if (matchBettingType == bettingType.session) {
      // If it's a session betting type, update sessionActive accordingly
      await updateMatch(
        matchId,
        isManualBet
          ? {
              manualSessionActive: isActive,
            }
          : {
              apiSessionActive: isActive,
            }
      );
    } else {
      // If it's not a session betting type, update the active status for the specific betting ID
      const matchBetting = await updateMatchBettingById(bettingId, {
        isActive: isActive,
      });
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
    }

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
