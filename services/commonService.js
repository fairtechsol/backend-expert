const { socketData, betType, manualMatchBettingType, betStatusType, matchBettingType } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { sendMessageToUser } = require("../sockets/socketManager");
const { getMatchBattingByMatchId } = require("./matchBettingService");
const { getMatchDetails } = require("./matchService");
const { getMatchFromCache, getAllBettingRedis, settingAllBettingMatchRedis, getAllSessionRedis, settingAllSessionMatchRedis, addDataInRedis, addMatchInCache, getExpertsRedisMatchData } = require("./redis/commonfunction");
const { getSessionBattingByMatchId } = require("./sessionBettingService");

exports.forceLogoutIfLogin = async (userId) => {
  logger.info({ message: `Force logout user: ${userId} if already login.` });

  let token = await internalRedis.hget(userId, "token");

  if (token) {
    // function to force logout
    sendMessageToUser(userId, socketData.logoutUserForceEvent, {});
  }
};

exports.calculateExpertRate = async (teamRates, data, partnership = 100) => {
  let { teamA, teamB, teamC, winAmount, lossAmount, bettingType, betOnTeam } = data;
  let newTeamRates = {
    teamA: 0,
    teamB: 0,
    teamC: 0,
  }
  if (betOnTeam == teamA && bettingType == betType.BACK) {
    newTeamRates.teamA = teamRates.teamA - ((winAmount * partnership) / 100);
    newTeamRates.teamB = teamRates.teamB + ((lossAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC + (teamC ? ((lossAmount * partnership) / 100) : 0);
  }
  else if (betOnTeam == teamA && bettingType == betType.LAY) {
    newTeamRates.teamA = teamRates.teamA + ((lossAmount * partnership) / 100);
    newTeamRates.teamB = teamRates.teamB - ((winAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC - (teamC ? ((winAmount * partnership) / 100) : 0);
  }
  else if (betOnTeam == teamB && bettingType == betType.BACK) {
    newTeamRates.teamB = teamRates.teamB - ((winAmount * partnership) / 100);
    newTeamRates.teamA = teamRates.teamA + ((lossAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC + (teamC ? ((lossAmount * partnership) / 100) : 0);
  }
  else if (betOnTeam == teamB && bettingType == betType.LAY) {
    newTeamRates.teamB = teamRates.teamB + ((lossAmount * partnership) / 100);
    newTeamRates.teamA = teamRates.teamA - ((winAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC - (teamC ? ((winAmount * partnership) / 100) : 0);
  }
  else if (teamC && betOnTeam == teamC && bettingType == betType.BACK) {
    newTeamRates.teamA = teamRates.teamA + ((lossAmount * partnership) / 100);
    newTeamRates.teamB = teamRates.teamB + ((lossAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC - ((winAmount * partnership) / 100);
  }
  else if (teamC && betOnTeam == teamC && bettingType == betType.LAY) {
    newTeamRates.teamA = teamRates.teamA - ((winAmount * partnership) / 100);
    newTeamRates.teamB = teamRates.teamB - ((winAmount * partnership) / 100);
    newTeamRates.teamC = teamRates.teamC + ((lossAmount * partnership) / 100);
  }

  newTeamRates = {
    teamA: Number(newTeamRates.teamA.toFixed(2)),
    teamB: Number(newTeamRates.teamB.toFixed(2)),
    teamC: Number(newTeamRates.teamC.toFixed(2))
  }
  return newTeamRates;
}

const calculateProfitLoss = (betData, odds, partnership) => {
  if (
    (betData?.betPlacedData?.betType === betType.NO &&
      odds < betData?.betPlacedData?.odds) ||
    (betData?.betPlacedData?.betType === betType.YES &&
      odds >= betData?.betPlacedData?.odds)
  ) {
    return partnership != null || partnership != undefined
      ? -parseFloat(
        (parseFloat(betData?.winAmount) * partnership) / 100
      ).toFixed(2)
      : +parseFloat(parseFloat(betData?.winAmount).toFixed(2));
  } else if (
    (betData?.betPlacedData?.betType === betType.NO &&
      odds >= betData?.betPlacedData?.odds) ||
    (betData?.betPlacedData?.betType === betType.YES &&
      odds < betData?.betPlacedData?.odds)
  ) {
    return partnership != null || partnership != undefined
      ? +parseFloat(
        (parseFloat(betData?.loseAmount) * partnership) / 100
      ).toFixed(2)
      : -parseFloat(betData.loseAmount);
  }
  return 0;
};
/**
* Calculates the profit or loss for a betting session.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossSession = async (redisProfitLoss, betData, partnership) => {
  /**
   * Calculates the profit or loss for a specific bet at given odds.
   * @param {object} betData - Data for the current bet.
   * @param {number} odds - Odds for the current bet.
   * @returns {number} - Profit or loss amount.
   */
  let maxLoss = 0;


  /**
   * Gets the lower limit for the current bet data.
   * @param {object} betData - Data for the current bet.
   * @returns {number} - Lower limit for the odds.
   */
  const getLowerLimitBetData = (betData) =>
    Math.max(0, betData?.betPlacedData?.odds - 5);

  // Calculate lower and upper limits
  const lowerLimit = parseFloat(
    getLowerLimitBetData(betData) < (redisProfitLoss?.lowerLimitOdds ?? 0)
      ? getLowerLimitBetData(betData)
      : redisProfitLoss?.lowerLimitOdds ?? getLowerLimitBetData(betData)
  );

  const upperLimit = parseFloat(
    betData?.betPlacedData?.odds + 5 >
      (redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + 5)
      ? betData?.betPlacedData?.odds + 5
      : redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + 5
  );

  let betProfitloss = redisProfitLoss?.betPlaced ?? [];

  // Adjust betPlaced based on lower limit changes
  if (redisProfitLoss?.lowerLimitOdds > lowerLimit) {
    betProfitloss = [
      ...Array(Math.abs((redisProfitLoss?.lowerLimitOdds ?? 0) - lowerLimit))
        .fill(0)
        ?.map((_, index) => {
          return {
            odds: lowerLimit + index,
            profitLoss: parseFloat(betProfitloss[0]?.profitLoss),
          };
        }),
      ...betProfitloss,
    ];
  }

  // Adjust betPlaced based on upper limit changes
  if (upperLimit > redisProfitLoss?.upperLimitOdds) {
    betProfitloss = [
      ...betProfitloss,
      ...Array(Math.abs(upperLimit - (redisProfitLoss?.upperLimitOdds ?? 0)))
        .fill(0)
        ?.map((_, index) => {
          return {
            odds: (redisProfitLoss?.upperLimitOdds ?? 0) + index + 1,
            profitLoss: parseFloat(
              betProfitloss[betProfitloss?.length - 1]?.profitLoss
            ),
          };
        }),
    ];
  }

  // Initialize or update betPlaced if it's empty or not
  if (!betProfitloss?.length) {
    betProfitloss = Array(Math.abs(upperLimit - lowerLimit + 1))
      .fill(0)
      ?.map((_, index) => {
        let profitLoss = calculateProfitLoss(betData, lowerLimit + index, partnership);
        if (maxLoss < Math.abs(profitLoss) && profitLoss < 0) {
          maxLoss = Math.abs(profitLoss);
        }
        return {
          odds: lowerLimit + index,
          profitLoss: profitLoss,
        };
      });
  } else {
    betProfitloss = betProfitloss?.map((item) => {
      let profitLossVal = calculateProfitLoss(betData, item?.odds, partnership);
      profitLossVal = (parseFloat(item?.profitLoss) + parseFloat(profitLossVal)).toFixed(2)
      if (
        maxLoss <
        Math.abs(
          profitLossVal
        ) &&
        profitLossVal < 0
      ) {
        maxLoss = Math.abs(
          profitLossVal
        );
      }
      return {
        odds: item?.odds,
        profitLoss: profitLossVal,
      };
    });
  }
  maxLoss = Number(maxLoss.toFixed(2));
  // Return the result
  return {
    upperLimitOdds: parseFloat(upperLimit),
    lowerLimitOdds: parseFloat(lowerLimit),
    betPlaced: betProfitloss,
    maxLoss: parseFloat(maxLoss),
    totalBet: redisProfitLoss?.totalBet ? parseInt(redisProfitLoss?.totalBet) + 1 : 1
  };
};

exports.mergeProfitLoss = (newbetPlaced, oldbetPlaced) => {
  if (newbetPlaced[0].odds > oldbetPlaced[0].odds) {
    while (newbetPlaced[0].odds != oldbetPlaced[0].odds) {
      const newEntry = {
        odds: newbetPlaced[0].odds - 1,
        profitLoss: newbetPlaced[0].profitLoss,
      };
      newbetPlaced.unshift(newEntry);
    }
  }
  if (newbetPlaced[0].odds < oldbetPlaced[0].odds) {
    while (newbetPlaced[0].odds != oldbetPlaced[0].odds) {
      const newEntry = {
        odds: oldbetPlaced[0].odds - 1,
        profitLoss: oldbetPlaced[0].profitLoss,
      };
      oldbetPlaced.unshift(newEntry);
    }
  }

  if (newbetPlaced[newbetPlaced.length - 1].odds > oldbetPlaced[oldbetPlaced.length - 1].odds) {
    while (newbetPlaced[newbetPlaced.length - 1].odds != oldbetPlaced[oldbetPlaced.length - 1].odds) {
      const newEntry = {
        odds: oldbetPlaced[oldbetPlaced.length - 1].odds + 1,
        profitLoss: oldbetPlaced[oldbetPlaced.length - 1].profitLoss,
      };
      oldbetPlaced.push(newEntry);
    }
  }
  if (newbetPlaced[newbetPlaced.length - 1].odds < oldbetPlaced[oldbetPlaced.length - 1].odds) {
    while (newbetPlaced[newbetPlaced.length - 1].odds != oldbetPlaced[oldbetPlaced.length - 1].odds) {
      const newEntry = {
        odds: newbetPlaced[newbetPlaced.length - 1].odds + 1,
        profitLoss: newbetPlaced[newbetPlaced.length - 1].profitLoss,
      };
      newbetPlaced.push(newEntry);
    }
  }
};

exports.commonGetMatchDetails = async (matchId, userId) => {
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
          betting[item?.type] = JSON.stringify(item);
        }
      });

      // Update Redis with the manual betting data for the current match
      settingAllBettingMatchRedis(match.id, manualBettingRedisData);
    }

    // Retrieve all session data from Redis for the given match
    let sessions = await getAllSessionRedis(matchId);

    // If session data is found in Redis, update its expiry time
    if (!sessions) {

      // If no session data is found in Redis, fetch it from the database
      sessions = await getSessionBattingByMatchId(matchId, !userId ? { activeStatus: betStatusType.live } : {});

      let result = {};
      let apiSelectionIdObj = {};
      for (let index = 0; index < sessions?.length; index++) {
        if (sessions?.[index]?.activeStatus == betStatusType.live) {
          if (sessions?.[index]?.selectionId) {
            apiSelectionIdObj[sessions?.[index]?.selectionId] = sessions?.[index]?.id;
          }
          result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
        }
        sessions[index] = JSON.stringify(sessions?.[index]);
      }
      settingAllSessionMatchRedis(matchId, result);
      addDataInRedis(`${matchId}_selectionId`, apiSelectionIdObj);
    }
    else {
      if (userId) {
        sessions = await getSessionBattingByMatchId(matchId);
        sessions = sessions?.map((item) => JSON.stringify(item));
      }
      else {
        sessions = Object.values(sessions);
      }
    }
    const categorizedMatchBettings = {
      ...(match.matchOdd
        ? { [matchBettingType.matchOdd]: match.matchOdd }
        : {}),
      ...(match.marketBookmaker
        ? { [matchBettingType.bookmaker]: match.marketBookmaker }
        : {}),
      ...(match.marketCompleteMatch
        ? { "marketCompleteMatch": match.marketCompleteMatch }
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
    settingAllBettingMatchRedis(matchId, manualBettingRedisData);

    let sessions = match?.sessionBettings;
    let result = {};
    let apiSelectionIdObj = {};
    for (let index = 0; index < sessions?.length; index++) {
      if (sessions?.[index]?.activeStatus == betStatusType.live) {
        if (sessions?.[index]?.selectionId) {
          apiSelectionIdObj[sessions?.[index]?.selectionId] = sessions?.[index]?.id;
        }
        result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
      }
      sessions[index] = JSON.stringify(sessions?.[index]);
    }
    settingAllSessionMatchRedis(matchId, result);
    addDataInRedis(`${matchId}_selectionId`, apiSelectionIdObj);

    match.sessionBettings = sessions;
    // Assign the categorized match betting to the match object
    Object.assign(match, categorizedMatchBettings);

    delete match.matchBettings;
  }
  let teamRates = await getExpertsRedisMatchData(matchId);
  match.teamRates = teamRates;
  return match;
}
