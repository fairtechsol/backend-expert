const { matchBettingType, intialMatchBettingsName, bettingType, manualMatchBettingType, initialMatchNames, marketBettingTypeByBettingType,socketData, betStatusType } = require("../config/contants");
const { logger } = require("../config/logger");
const { insertMatchBettings, getMatchBattingByMatchId, updateMatchBetting,  addMatchBetting, updateMatchBettingById, getMatchBetting } = require("../services/matchBettingService");
const {
  getMatchById,
  getMatchByMarketId,
  addMatch,
  updateMatch,
  getMatch,
  getMatchDetails,
  getMatchCompetitions,
  getMatchDates,
  getMatchByCompetitionIdAndDates,
  getMatchWithBettingAndSession,
} = require("../services/matchService");
const { addMatchInCache, updateMatchInCache, settingAllBettingMatchRedis, getMatchFromCache, getAllBettingRedis, getAllSessionRedis, settingAllSessionMatchRedis, updateMatchKeyInCache,  updateBettingMatchRedis, getKeyFromMatchRedis, hasBettingInCache } = require("../services/redis/commonfunction");
const { getSessionBattingByMatchId } = require("../services/sessionBettingService");
const { getUserById } = require("../services/userService");
const { broadcastEvent, sendMessageToUser } = require("../sockets/socketManager");
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
      manualTiedMatchMaxBet,
      completeMatchMaxBet,
      matchOddMarketId,
      tiedMatchMarketId,
      marketBookmakerId,
      completeMatchMarketId
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
        marketId : matchOddMarketId
      },
      {
        ...matchBetting,
        type: matchBettingType.bookmaker,
        name: intialMatchBettingsName.initialBookmaker,
        maxBet: betFairBookmakerMaxBet,
        marketId : marketBookmakerId
      },
      ...(bookmakers?.map((item, index) => {
        const { maxBet, marketName } = item;
        index++;
        return{
          type: matchBettingType["quickbookmaker" + index],
          matchId: match.id,
          name: marketName,
          minBet: minBet,
          maxBet: maxBet,
          createBy:loginId
        };
      })),
      {
        ...matchBetting,
        type: matchBettingType.tiedMatch2,
        name: initialMatchNames.manual,
        maxBet:manualTiedMatchMaxBet,
      }
      
    ];

   if(completeMatchMarketId && completeMatchMarketId != ''){
    matchBettings.push({
      ...matchBetting,
      type: matchBettingType.completeMatch,
      name: initialMatchNames.completeMatch,
      maxBet:completeMatchMaxBet,
      marketId : completeMatchMarketId
    })
   }else{
    matchBettings.push({
      ...matchBetting,
      type: matchBettingType.completeMatch,
      name: initialMatchNames.completeMatch,
      maxBet:completeMatchMaxBet,
      marketId : addIncrement(matchOddMarketId,2)
    })
   }

   if(tiedMatchMarketId && tiedMatchMarketId != ''){
    matchBettings.push(
      {
        ...matchBetting,
        type: matchBettingType.tiedMatch1,
        name: initialMatchNames.market,
        maxBet:marketTiedMatchMaxBet,
        marketId : tiedMatchMarketId
      })
   }else{
    matchBettings.push(
      {
        ...matchBetting,
        type: matchBettingType.tiedMatch1,
        name: initialMatchNames.market,
        maxBet:marketTiedMatchMaxBet,
        marketId : addIncrement(matchOddMarketId,1)
      })
   }
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
      const key = item.type; 
      result[key] = item;
      return result;
    }, {});

    let payload = {
      ...match,
      matchOdd: convertedData[matchBettingType.matchOdd],
      marketBookmaker: convertedData[matchBettingType.bookmaker],
      marketTiedMatch: convertedData[matchBettingType.tiedMatch2],
      marketCompleteMatch : convertedData[matchBettingType.completeMatch]
    };
    await addMatchInCache(match.id, payload);
    const manualBettingRedisData ={};
     manualMatchBettingType?.forEach((item) => {
      if(convertedData[item]){
        manualBettingRedisData[item]= JSON.stringify(convertedData[item]);
      }
    });

    await settingAllBettingMatchRedis(match.id, manualBettingRedisData);
    broadcastEvent(socketData.addMatchEvent);
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
      marketTiedMatchMaxBet,
      manualTiedMatchMaxBet,
      completeMatchMaxBet
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

    await updateMatch(id, { betFairSessionMaxBet, betFairSessionMinBet: minBet });
    await updateMatchBetting({ matchId: id, type: matchBettingType.matchOdd }, { maxBet: matchOddMaxBet, minBet: minBet });
    await updateMatchBetting({ matchId: id, type: matchBettingType.bookmaker }, { maxBet: betFairBookmakerMaxBet, minBet: minBet });
    await updateMatchBetting({ matchId: id, type: matchBettingType.tiedMatch1 }, { maxBet: marketTiedMatchMaxBet, minBet: minBet });
    await updateMatchBetting({ matchId: id, type: matchBettingType.tiedMatch2 }, { maxBet: manualTiedMatchMaxBet, minBet: minBet });
    await updateMatchBetting({ matchId: id, type: matchBettingType.completeMatch }, { maxBet: completeMatchMaxBet, minBet: minBet });

    if (bookmakers && bookmakers.length) {
      
      await Promise.all[bookmakers.map(item => updateMatchBetting({ matchId: id, type: item.type }, { maxBet: item.maxBet, minBet:minBet }))];
    }


    // await Promise.all(updatePromises);

    updateMatchDataAndBettingInRedis(id);

    
    // Attach bookmaker data to the match object
    match["bookmaker"] = matchBatting;
    sendMessageToUser(socketData.expertRoomSocket, socketData.updateMatchEvent,match);
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


const updateMatchDataAndBettingInRedis=async (id)=>{
 const match = await getMatchById(id);
 const matchBatting = await getMatchBattingByMatchId(id);
  const convertedData = matchBatting.reduce((result, item) => {
    const key = item.type;  
    result[key] = item;
    return result;
  }, {});

  let payload = {
    ...match,
    matchOdd: convertedData[matchBettingType.matchOdd],
    marketBookmaker: convertedData[matchBettingType.bookmaker],
    marketTiedMatch: convertedData[matchBettingType.tiedMatch2],      
    marketCompleteMatch : convertedData[matchBettingType.completeMatch],
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
}


exports.listMatch = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;
    const {
      id: loginId,
      allPrivilege,
      addMatchPrivilege,
      betFairMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
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


const commonGetMatchDetails=async (matchId)=>{
  let match = await getMatchFromCache(matchId);

  // Check if the match exists
  if (match) {
    // Retrieve all betting data from Redis for the given match
    let betting = await getAllBettingRedis(matchId);

    // If betting data is found in Redis, update its expiry time
    if (!betting) {
      
      // If no betting data is found in Redis, fetch it from the database
      const matchBetting = await getMatchBattingByMatchId(matchId);

      // Create an empty object to store manual betting Redis data
      const manualBettingRedisData = {};
      betting = {};
      // Iterate through each item in manualMatchBettingType
      matchBetting?.forEach((item) => {
        // Check if the item exists in the convertedData object
        if (manualMatchBettingType.includes(item?.type)) {
          // If the item exists, add it to the manualBettingRedisData object
          // with its value stringified using JSON.stringify
          manualBettingRedisData[item?.type] = JSON.stringify(item);
          betting[item?.type]=JSON.stringify(item);
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
        if(sessions?.[index]?.activeStatus== betStatusType.live){

        result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
      }
        sessions[index] = JSON.stringify(sessions?.[index]);
      }
      await settingAllSessionMatchRedis(matchId, result);
    }
    else{
      sessions=Object.values(sessions);
    }
const categorizedMatchBettings = {
  ...(match.matchOdd
    ? { [matchBettingType.matchOdd]: match.matchOdd }
    : {}),
    ...(match.marketBookmaker
      ? { [matchBettingType.bookmaker]:match.marketBookmaker }
      : {}),
      ...(match.marketCompleteMatch
        ? { "marketCompleteMatch":match.marketCompleteMatch }
        : {}),
        quickBookmaker: [],
        ...(match.marketTiedMatch
          ? { "apiTideMatch": match.marketTiedMatch }
          : {}),
          manualTiedMatch: null,
        };
    // Iterate through matchBettings and categorize them
    (Object.values(betting) || []).forEach(
      (item) => {
        item = JSON.parse(item);
        switch (item?.type) {
          case matchBettingType.quickbookmaker1:
          case matchBettingType.quickbookmaker2:
          case matchBettingType.quickbookmaker3:
            categorizedMatchBettings.quickBookmaker.push(item);
            break;
          case matchBettingType.tiedMatch2:
            categorizedMatchBettings.manualTiedMatch = item;

            break;
        }
      }
    );
    // Assign the categorized match betting to the match object
    Object.assign(match, categorizedMatchBettings);

    delete match.marketBookmaker;
    delete match.marketTiedMatch;

    match.sessionBettings = sessions;
  } else {
    match = await getMatchDetails(matchId, []);
    if (!match) {
      throw {
          statusCode: 400,
          message: {
            msg: "notFound",
            keys: {
              name: "Match",
            },
          },
        }
    }

    const categorizedMatchBettings = {
      [matchBettingType.matchOdd]: null,
      [matchBettingType.bookmaker]: null,
      marketCompleteMatch: null,
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
        case matchBettingType.completeMatch:
          categorizedMatchBettings.marketCompleteMatch = item;
          break;
      }
    });

      let payload = {
        ...match,
        matchOdd: categorizedMatchBettings[matchBettingType.matchOdd],
        marketBookmaker: categorizedMatchBettings[matchBettingType.bookmaker],
        marketTiedMatch: categorizedMatchBettings.apiTideMatch,
        marketCompleteMatch: categorizedMatchBettings.marketCompleteMatch,
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
      if(session[index]?.activeStatus== betStatusType.live){

      result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
      }
      sessions[index] = JSON.stringify(sessions?.[index]);
    }
    await settingAllSessionMatchRedis(matchId, result);

    match.sessionBettings=sessions;
    // Assign the categorized match betting to the match object
    Object.assign(match, categorizedMatchBettings);

    delete match.matchBettings;
  }
  return match;
}

exports.matchDetails = async (req, res) => {
  try {
    const { id: matchId } = req.params;


    let match;

    // splitting match ids to check if user asking for multiple match or single
    const matchIds = matchId?.split(",");
    if (matchIds?.length > 1) {
      match = [];
      for (let i = 0; i < matchIds?.length; i++) {
        match.push(await commonGetMatchDetails(matchIds[i]));
      }
    } else {
      match = await commonGetMatchDetails(matchId);
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
    const { matchId, bettingId, type, isManualBet, isActive } =
      req.body;


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
      
      if(!match){
        match=await getMatchById(matchId);
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
      await updateMatch(matchId,sessionBetType);

      const isMatchBetting = await hasBettingInCache(matchId);
      if(!isMatchBetting){
        const matchBatting = await getMatchBattingByMatchId(matchId);

        const convertedData = matchBatting.reduce((result, item) => {
          const key = item.type;
          result[key] = item;
          return result;
        }, {});
        let payload = {
          ...match,
          ...sessionBetType,
          matchOdd: convertedData[matchBettingType.matchOdd],
          marketBookmaker: convertedData[matchBettingType.bookmaker],
          marketTiedMatch: convertedData[matchBettingType.tiedMatch2],
          marketCompleteMatch: convertedData[matchBettingType.completeMatch],
        };
       await updateMatchInCache(match.id, payload);
      }
      else{
        await updateMatchKeyInCache(match.id,isManualBet?"manualSessionActive":"apiSessionActive",isActive);
      }

    } else {
      // If it's not a session betting type, update the active status for the specific betting ID
      await updateMatchBettingById(bettingId, {
        isActive: isActive,
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
      else{
        const redisMatch=await getKeyFromMatchRedis(matchBetting?.matchId,marketBettingTypeByBettingType[matchBetting?.type]);

        if(!redisMatch){

          const matchBatting = await getMatchBattingByMatchId(match.id);
          const convertedData = matchBatting.reduce((result, item) => {
            const key = item.type;
            result[key] = item;
            return result;
          }, {});
          let payload = {
            ...match,
            matchOdd: convertedData[matchBettingType.matchOdd],
            marketBookmaker: convertedData[matchBettingType.bookmaker],
            marketTiedMatch: convertedData[matchBettingType.tiedMatch2],
            marketCompleteMatch: convertedData[matchBettingType.completeMatch],
          };
          await updateMatchInCache(match.id, payload);
        }
        else{
          await updateMatchKeyInCache(matchBetting?.matchId,marketBettingTypeByBettingType[matchBetting?.type],
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

    const dates = await getMatchDates(competitionId);

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
    const { competitionId,date } = req.params;

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

    const {
      allPrivilege,
      addMatchPrivilege,
      betFairMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
    } = req.user;

    
    
    const match = await getMatchWithBettingAndSession(
      allPrivilege,
      addMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege
    );
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
      error: `Error at list match for the manual betting and session.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};


function addIncrement(number, increment) {
  // Convert the number to a string to manipulate the decimal part
  const numberStr = number.toString();
  
  // Find the position of the decimal point
  const decimalPosition = numberStr.indexOf('.');
  
  // If there is a decimal point
  if (decimalPosition !== -1) {
      // Extract the integer and decimal parts
      const integerPart = numberStr.slice(0, decimalPosition);
      const decimalPart = numberStr.slice(decimalPosition + 1);
      
      // Convert the decimal part to an integer and add the increment
      const newDecimalPart = parseInt(decimalPart) + increment;
      
      // Combine the integer and updated decimal parts
      const updatedNumberStr = `${integerPart}.${newDecimalPart.toString().padStart(5, '0')}`;
      
      // Convert the updated string back to a float
      const updatedNumber = parseFloat(updatedNumberStr);
      
      return updatedNumber;
  } else {
      // If there is no decimal point, just return the original number
      return number;
  }
}