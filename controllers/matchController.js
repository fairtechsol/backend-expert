const { betStatus, matchBettingType, intialBookmaker, intialMatchBettingsName } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { insertMatchBettings, getMatchBattingByMatchId, updateMatchBetting } = require("../services/matchBettingService");
const {
  getMatchById,
  updateBookmaker,
  getBookMakerById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
} = require("../services/matchService");
const { broadcastEvent } = require("../sockets/socketManager");
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
      tiedMatch
    } = req.body;

    /* access work left */

    // Extract user ID from the request object
    const { id: loginId } = req.user;

    // Check if at least one bookmaker is provided
    if (bookmakers?.length == 0) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "match.atLeastOneBookmaker",
          },
        },
        req,
        res
      );
    }
    // If ID is not provided, it's a new match creation

    // Check if market ID already exists
    const isMarketIdPresent = await getMatchByMarketId(marketId);
    if (isMarketIdPresent) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "alreadyExist",
            keys: {
              name: "Match",
            },
          },
        },
        req,
        res
      );
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
      betFairSessionMaxBet : 50,
      betFairSessionMinBet: 100,
      createBy: loginId
    };

    let allArrays = [...bookmakers, ...tiedMatch];
    let maxBetValues = allArrays.map(item => item.maxBet);
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
      return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    }

    // let matchBetting = {
    //   matchId: match.id,
    //   minBet: minBet
    // }
    // let matchBettings = [
    //   {
    //     ...matchBetting,
    //     type: matchBettingType.matchOdd,
    //     name: intialMatchBettingsName.initialMatchOdd,
    //     maxBet: matchOddMaxBet,
    //   },
    //   {
    //     ...matchBetting,
    //     type: matchBettingType.bookmaker,
    //     name: intialMatchBettingsName.initialBookmaker,
    //     maxBet: betFairBookmakerMaxBet,
    //   }
    // ]
    // if (tiedMatch && tiedMatch.length) {
    //   tiedMatch.map((item, index) => {
    //     const { maxBet, marketName } = item;
    //     index++;
    //     matchBettings.push({
    //       matchId: match.id,
    //       type: matchBettingType["tiedMatch" + index],
    //       name: marketName,
    //       minBet: minBet,
    //       maxBet: maxBet
    //     })
    //   })
    // }
    // // Prepare bookmakers for the new match
    // bookmakers?.map((item, index) => {
    //   const { maxBet, marketName } = item;
    //   index++;
    //   // Add the bookmaker
    //   matchBettings.push({
    //     type: matchBettingType["quickbookmaker" + index],
    //     matchId: match.id,
    //     name: marketName,
    //     minBet: minBet,
    //     maxBet: maxBet,
    //   });
    // });
    // // Attach bookmakers to the match
    // let insertedMatchBettings = await insertMatchBettings(matchBettings);
    // if (!insertedMatchBettings) {
    //   return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    // }
    // match["bookmaker"] = insertedMatchBettings.generatedMaps
    // broadcastEvent("newMatchAdded", match);

    // Send success response with the add match data
    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "Match",
          },
        },
        data: match,
      },
      req,
      res
    );
  } catch (err) {
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


    // Check if at least one bookmaker is provided
    if (bookmakers?.length == 0) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "match.atLeastOneBookmaker",
          },
        },
        req,
        res
      );
    }
    // Check if the match exists
    let match = await getMatchById(id, ["id", "betFairSessionMinBet", "betFairSessionMaxBet"]);

    if (!match) {
      return ErrorResponse(
        {
          statusCode: 404,
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
    let matchBatting = await getMatchBattingByMatchId(id, ["id", "minBet", "maxBet", "type"]);
    

    // // Handle bookmaker updates
    // let redisBookEventName = "manualBookmaker_" + id;
    // let redisBookData = await internalRedis.hgetall(redisBookEventName);
    // const bulkBookmaker = [];
    // // await Promise.all(
    // //   bookmakers?.map(async (item) => {
    // //     const { id: bookmakerId, maxBet } = item;

    // //     if (maxBet < minBet) {
    // //       throw {
    // //         statusCode: 400,
    // //         message: {
    // //           msg: "match.maxMustBeGreater",
    // //         },
    // //       };
    // //     }
    // //     if (!bookmakerId) {
    // //       throw {
    // //         statusCode: 404,
    // //         message: {
    // //           msg: "notFound",
    // //           keys: {
    // //             name: "Bookmaker",
    // //           },
    // //         },
    // //       };
    // //     }

    // //     // Check if the bookmaker exists
    // //     const isBookmaker = await getBookMakerById(bookmakerId, ["id"]);

    // //     if (!isBookmaker) {
    // //       throw {
    // //         statusCode: 404,
    // //         message: {
    // //           msg: "notFound",
    // //           keys: {
    // //             name: "Bookmaker",
    // //           },
    // //         },
    // //       };
    // //     }

    // //     // Update the bookmaker
    // //     await updateBookmaker(bookmakerId, {
    // //       minBet: minBet,
    // //       maxBet: maxBet,
    // //     });

    // //     // Retrieve and push the updated bookmaker
    // //     bulkBookmaker.push(await getBookMakerById(bookmakerId));

    // //     let keyName = "bookmaker_" + bookmakerId;
    // //     if (
    // //       redisBookData &&
    // //       Object.keys(redisBookData).length > 0 &&
    // //       redisBookData[keyName]
    // //     ) {
    // //       redisBookData[keyName] = JSON.parse(redisBookData[keyName]);
    // //       redisBookData[keyName]["minBet"] = minBet;
    // //       redisBookData[keyName]["maxBet"] = maxBet;
    // //       redisBookData[keyName] = JSON.stringify(redisBookData[keyName]);
    // //     }
    // //   }) || []
    // // );

    // // Update Redis data if needed
    // if (redisBookData && Object.keys(redisBookData).length > 0) {
    //   internalRedis.hmset(redisBookEventName, redisBookData);
    // }

    
    const updatePromises = [];

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
      await Promise.all[bookmakers.map(item => updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item.maxBet }))];
    }

    if (tiedMatch && tiedMatch.length) {
      await Promise.all[tiedMatch.map(item => updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item.maxBet }))];
    }

    // await Promise.all(updatePromises);

    match = await getMatchById(id, ["id", "betFairSessionMinBet", "betFairSessionMaxBet"]);
    matchBatting = await getMatchBattingByMatchId(id, ["id", "minBet", "maxBet", "type"]);

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
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};
