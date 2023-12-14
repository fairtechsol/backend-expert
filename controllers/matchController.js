const { betStatus } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { addBetting, getBetting } = require("../services/bettingService");
const {
  getMatchById,
  updateBookmaker,
  getBookMakerById,
  getMatchByMarketId,
  addMatch,
  addBookmaker,
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
      matchOddMinBet: minBet,
      matchOddMaxBet,
      betFairSessionMaxBet,
      betFairSessionMinBet: minBet,
      betFairBookmakerMaxBet,
      betFairBookmakerMinBet: minBet,
      createBy: loginId,
    };

    // Add the new match
    const match = await addMatch(matchData);

    // Check if betting exists for the new match
    const isBettingExist = await getBetting(
      {
        matchId: match.id,
        sessionBet: false,
      },
      ["id"]
    );

    if (isBettingExist) {
      return ErrorResponse(
        {
          statusCode: 400,
          message: {
            msg: "match.betAlreadyExistForMatch",
          },
        },
        req,
        res
      );
    }

    // Prepare betting object
    const betObj = {
      matchId: match.id,
      sessionBet: false,
      createBy: loginId,
      matchType: matchType,
      betStatus: betStatus.live,
    };

    // Add the new betting entry
    const betting = await addBetting(betObj);

    // broadcastEvent("newBetAdded", betting);

    // Prepare bookmakers for the new match
    const bulkBookmaker = [];
    await Promise.all(
      bookmakers?.map((item, index) => {
        const { maxBet, marketName } = item;

        if (maxBet < minBet) {
          throw {
            statusCode: 400,
            message: {
              msg: "match.maxMustBeGreater",
            },
          };
        }

        // Add the bookmaker
        bulkBookmaker.push({
          marketType: "QuickBookmaker" + index,
          matchId: match.id,
          matchType: matchType,
          betId: betting.id,
          createBy: loginId,
          marketName: marketName,
          minBet: minBet,
          maxBet: maxBet,
        });
      }) || []
    );

    // Attach bookmakers to the match
    match["bookmaker"] = await addBookmaker(bulkBookmaker);

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
        data :match,
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
