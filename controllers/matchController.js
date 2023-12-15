const { IsNull, In } = require("typeorm");
const { betStatus, userRoleConstant, matchBettingType,intialBookmaker, intialMatchBettingsName } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { insertMatchBettings } = require("../services/matchBettingService");
const {
  getMatchById,
  updateBookmaker,
  getBookMakerById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
  getMatch,
  getMatchDetails,
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
      betFairSessionMaxBet,
      betFairSessionMinBet: minBet,
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

    let matchBetting = {
      matchId: match.id,
      minBet: minBet
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
      }
    ]
    if (tiedMatch && tiedMatch.length) {
      tiedMatch.map((item, index) => {
        const { maxBet, marketName } = item;
        index++;
        matchBettings.push({
          matchId: match.id,
          type: matchBettingType["tiedMatch" + index],
          name: marketName,
          minBet: minBet,
          maxBet: maxBet
        })
      })
    }
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
      });
    });
    // Attach bookmakers to the match
    let insertedMatchBettings = await insertMatchBettings(matchBettings);
    if (!insertedMatchBettings) {
      return ErrorResponse({ statusCode: 400, message: { msg: "match.matchAddFail" } }, req, res);
    }
    match["bookmaker"] = insertedMatchBettings.generatedMaps
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
    const isMatchPresent = await getMatchById(id, ["id"]);

    if (!isMatchPresent) {
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

    // Handle bookmaker updates
    let redisBookEventName = "manualBookmaker_" + id;
    let redisBookData = await internalRedis.hgetall(redisBookEventName);
    const bulkBookmaker = [];
    await Promise.all(
      bookmakers?.map(async (item) => {
        const { id: bookmakerId, maxBet } = item;

        if (maxBet < minBet) {
          throw {
            statusCode: 400,
            message: {
              msg: "match.maxMustBeGreater",
            },
          };
        }
        if (!bookmakerId) {
          throw {
            statusCode: 404,
            message: {
              msg: "notFound",
              keys: {
                name: "Bookmaker",
              },
            },
          };
        }

        // Check if the bookmaker exists
        const isBookmaker = await getBookMakerById(bookmakerId, ["id"]);

        if (!isBookmaker) {
          throw {
            statusCode: 404,
            message: {
              msg: "notFound",
              keys: {
                name: "Bookmaker",
              },
            },
          };
        }

        // Update the bookmaker
        await updateBookmaker(bookmakerId, {
          minBet: minBet,
          maxBet: maxBet,
        });

        // Retrieve and push the updated bookmaker
        bulkBookmaker.push(await getBookMakerById(bookmakerId));

        let keyName = "bookmaker_" + bookmakerId;
        if (
          redisBookData &&
          Object.keys(redisBookData).length > 0 &&
          redisBookData[keyName]
        ) {
          redisBookData[keyName] = JSON.parse(redisBookData[keyName]);
          redisBookData[keyName]["minBet"] = minBet;
          redisBookData[keyName]["maxBet"] = maxBet;
          redisBookData[keyName] = JSON.stringify(redisBookData[keyName]);
        }
      }) || []
    );

    // Update Redis data if needed
    if (redisBookData && Object.keys(redisBookData).length > 0) {
      internalRedis.hmset(redisBookEventName, redisBookData);
    }

    // Update the existing match
    await updateMatch(id, {
      matchOddMinBet: minBet,
      matchOddMaxBet,
      betFairSessionMaxBet,
      betFairSessionMinBet: minBet,
      betFairBookmakerMaxBet,
      betFairBookmakerMinBet: minBet,
    });

    // Retrieve the updated match
    const match = await getMatchById(id);

    // Attach bookmakers to the match
    match.bookmaker = bulkBookmaker;

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
      },
      req,
      res
    );
  } catch (err) {
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};


exports.listMatch = async (req, res) => {
  try {
    const { roleName } = req.user;

    const { query } = req;
    const { isActive, fields } = query;
    const filters = {};

    if (isActive) {
      filters["stopAt"] = IsNull();
    }

    if (roleName != userRoleConstant.expert) {
      filters["matchBettings.type"] = matchBettingType.matchOdd;
    } else {
      filters["matchBettings.type"] = In([
        matchBettingType.quickbookmaker1,
        matchBettingType.quickbookmaker2,
        matchBettingType.quickbookmaker3,
      ]);
    }
    //   let userRedisData = await internalRedis.hgetall(user.userId);
    const match = await getMatch(filters, fields?.split(",") || [], query);
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
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.matchDetails = async (req, res) => {
  try {
    const { id: matchId } = req.params;

    const match = await getMatchDetails(matchId, []);
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
        // Add more cases if needed
      }
    });

    // Assign the categorized match bettings to the match object
    Object.assign(match, categorizedMatchBettings);
    match["sessionMatch"] = match?.sessionBettings;

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
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};