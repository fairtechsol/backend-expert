const { matchBettingType, intialMatchBettingsName, } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { insertMatchBettings, getMatchBattingByMatchId, updateMatchBetting } = require("../services/matchBettingService");
const {
  getMatchById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
} = require("../services/matchService");
const { broadcastEvent } = require("../sockets/socketManager");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const {getUserById} = require("../services/userService")
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
      }
    ]
    if (tiedMatch && tiedMatch.length) {
      tiedMatch.map((item, index) => {
        const { maxBet, marketName } = item;
        index++;
        matchBettings.push({
          ...matchBetting,
          type: matchBettingType["tiedMatch" + index],
          name: marketName
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
      tiedMatch
    } = req.body;
    //get user data to check privilages
    const { id: loginId, role } = req.user;
    const user = await getUserById(loginId,["allPrivilege","addMatchPrivilege","betFairMatchPrivilege","bookmakerMatchPrivilege","sessionMatchPrivilege"]);
    if(!user){
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "User"}}},req,res);
    }

    // Check if the match exists
    let match = await getMatchById(id, ["id", "betFairSessionMinBet", "betFairSessionMaxBet"]);

    if (!match) {
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match"}}},req,res);
    }

    let matchBatting = await getMatchBattingByMatchId(id, ["id", "minBet", "maxBet", "type"]);
    if(!matchBatting || !matchBatting.length){
      return ErrorResponse({statusCode: 404,message: {msg: "notFound",keys: {name: "Match batting"}}},req,res)
    }

    if(loginId != match.createBy && !user.allPrivilege){
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

