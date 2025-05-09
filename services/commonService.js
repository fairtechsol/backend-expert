const { socketData, betType, betStatusType, matchBettingType, redisKeys, resultStatus, betStatus} = require("../config/contants");
const { __mf } = require("i18n");
const internalRedis = require("../config/internalRedisConnection");
const { sendMessageToUser } = require("../sockets/socketManager");
const { getMatchDetails, getRaceDetails } = require("./matchService");
const { getRaceFromCache, getMatchFromCache, getAllSessionRedis, settingAllSessionMatchRedis, addMatchInCache, addRaceInCache, getExpertsRedisMatchData, getExpertsRedisSessionDataByKeys, getExpertsRedisKeyData, updateMultipleMarketSessionIdRedis } = require("./redis/commonfunction");
const { getSessionBattingByMatchId } = require("./sessionBettingService");
const { getExpertResult, getExpertResultTournamentBetWise, getExpertResultSessionBetWise, deleteOldExpertResult } = require("./expertResultService");
const { LessThanOrEqual } = require("typeorm");

exports.forceLogoutIfLogin = async (userId) => {

  let token = await internalRedis.hget(userId, "token");

  if (token) {
    // function to force logout
    sendMessageToUser(userId, socketData.logoutUserForceEvent, { message: __mf("auth.forceLogout") })
  }
};

exports.calculateRacingExpertRate = async (teamRates, data, partnership = 100) => {
  let { runners, winAmount, lossAmount, bettingType, runnerId } = data;
  let newTeamRates = { ...teamRates };

  runners.forEach((item) => {
    if (!newTeamRates[item?.id]) {
      newTeamRates[item?.id] = 0;
    }

    if ((item?.id == runnerId && bettingType == betType.BACK) || (item?.id != runnerId && bettingType == betType.LAY)) {
      newTeamRates[item?.id] -= ((winAmount * partnership) / 100);
    }
    else if ((item?.id != runnerId && bettingType == betType.BACK) || (item?.id == runnerId && bettingType == betType.LAY)) {
      newTeamRates[item?.id] += ((lossAmount * partnership) / 100);
    }

    newTeamRates[item?.id] = this.parseRedisData(item?.id, newTeamRates);
  });
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
        (parseFloat(betData?.lossAmount) * partnership) / 100
      ).toFixed(2)
      : -parseFloat(betData.lossAmount);
  }
  return 0;
};

const calculateProfitLossDataKhado = (betData, odds, partnership) => {
  if (
    (betData?.betPlacedData?.betType === betType.BACK &&
      ((odds < betData?.betPlacedData?.odds) || (odds > (betData?.betPlacedData?.odds + parseInt(betData?.betPlacedData?.eventName?.split("-").pop()) - 1))))
  ) {
    return partnership != null || partnership != undefined
      ? parseFloat(
        (parseFloat(betData?.lossAmount) * partnership) / 100
      ).toFixed(2)
      : -parseFloat(parseFloat(betData?.lossAmount).toFixed(2));
  }
  return partnership != null || partnership != undefined
    ? -parseFloat(
      (parseFloat(betData?.winAmount) * partnership) / 100
    ).toFixed(2)
    : parseFloat(betData.winAmount);

};

const calculateProfitLossDataMeter = (betData, odds, partnership) => {
  if (
    (betData?.betPlacedData?.betType === betType.NO &&
      odds < betData?.betPlacedData?.odds) ||
    (betData?.betPlacedData?.betType === betType.YES &&
      odds >= betData?.betPlacedData?.odds)
  ) {
    return partnership != null || partnership != undefined
      ? -parseFloat(
        (parseFloat((betData?.betPlacedData?.stake * betData?.betPlacedData?.rate / 100) * Math.abs(odds - betData?.betPlacedData?.odds)) * partnership) / 100
      ).toFixed(2)
      : +parseFloat(parseFloat((betData?.betPlacedData?.stake * betData?.betPlacedData?.rate / 100) * Math.abs(odds - betData?.betPlacedData?.odds)).toFixed(2));
  } else if (
    (betData?.betPlacedData?.betType === betType.NO &&
      odds >= betData?.betPlacedData?.odds) ||
    (betData?.betPlacedData?.betType === betType.YES &&
      odds < betData?.betPlacedData?.odds)
  ) {
    return partnership != null || partnership != undefined
      ? +parseFloat(
        (parseFloat((betData?.betPlacedData?.stake) * Math.abs(odds - betData?.betPlacedData?.odds)) * partnership) / 100
      ).toFixed(2)
      : -parseFloat((betData?.betPlacedData?.stake) * Math.abs(odds - betData?.betPlacedData?.odds));
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

/**
* Calculates the profit or loss for a betting khado.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossKhado = async (redisProfitLoss, betData, partnership) => {
  /**
   * Calculates the profit or loss for a specific bet at given odds.
   * @param {object} betData - Data for the current bet.
   * @param {number} odds - Odds for the current bet.
   * @returns {number} - Profit or loss amount.
   */
  let maxLoss = 0;


  // Calculate lower and upper limits
  const lowerLimit = 1;

  const upperLimit = parseFloat(
    betData?.betPlacedData?.odds + parseInt(betData?.betPlacedData?.eventName?.split("-").pop()) + 9 >
      (redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + parseInt(betData?.betPlacedData?.eventName?.split("-").pop()) + 9)
      ? betData?.betPlacedData?.odds + parseInt(betData?.betPlacedData?.eventName?.split("-").pop()) + 9
      : redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + parseInt(betData?.betPlacedData?.eventName?.split("-").pop()) + 9
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
        let profitLoss = calculateProfitLossDataKhado(betData, lowerLimit + index, partnership);
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
      let profitLossVal = calculateProfitLossDataKhado(betData, item?.odds, partnership);
      profitLossVal = +(parseFloat(item?.profitLoss) + parseFloat(profitLossVal)).toFixed(2)
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

/**
* Calculates the profit or loss for a betting meter.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossMeter = async (redisProfitLoss, betData, partnership) => {
  /**
   * Calculates the profit or loss for a specific bet at given odds.
   * @param {object} betData - Data for the current bet.
   * @param {number} odds - Odds for the current bet.
   * @returns {number} - Profit or loss amount.
   */
  let maxLoss = 0;


  // Calculate lower and upper limits
  const lowerLimit = 0;

  const upperLimit = parseFloat(
    betData?.betPlacedData?.odds + (betData?.betPlacedData?.isTeamC ? 200 : 100) >
      (redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + (betData?.betPlacedData?.isTeamC ? 200 : 100))
      ? betData?.betPlacedData?.odds + (betData?.betPlacedData?.isTeamC ? 200 : 100)
      : redisProfitLoss?.upperLimitOdds ?? betData?.betPlacedData?.odds + (betData?.betPlacedData?.isTeamC ? 200 : 100)
  );

  let betProfitloss = redisProfitLoss?.betPlaced ?? [];

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
              (betProfitloss[betProfitloss?.length - 1]?.profitLoss) + ((parseFloat(betProfitloss[betProfitloss?.length - 1]?.profitLoss) - parseFloat(betProfitloss[betProfitloss?.length - 2]?.profitLoss)) * (index + 1))
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
        let profitLoss = calculateProfitLossDataMeter(betData, lowerLimit + index, partnership);
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
      let profitLossVal = calculateProfitLossDataMeter(betData, item?.odds, partnership);
      profitLossVal = +(parseFloat(item?.profitLoss) + parseFloat(profitLossVal)).toFixed(2)
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

/**
* Calculates the profit or loss for a betting session.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossSessionOddEven = async (redisProfitLoss, betData, partnership = 100) => {
  let maxLoss = 0;

  let betProfitloss = redisProfitLoss?.betPlaced ?? {};

  if (betData?.betPlacedData?.teamName?.toLowerCase() == "odd") {
    betProfitloss.odd = (betProfitloss.odd || 0) + (betData?.winAmount * partnership / 100);
    betProfitloss.even = (betProfitloss.even || 0) - (betData?.lossAmount * partnership / 100);
  }
  else if (betData?.betPlacedData?.teamName?.toLowerCase() == "even") {
    betProfitloss.odd = (betProfitloss.odd || 0) - (betData?.lossAmount * partnership / 100);
    betProfitloss.even = (betProfitloss.even || 0) + (betData?.winAmount * partnership / 100);
  }

  maxLoss = Number(Math.min(...Object.values(betProfitloss), 0).toFixed(2));
  // Return the result
  return {
    betPlaced: betProfitloss,
    maxLoss: parseFloat(Math.abs(maxLoss)),
    totalBet: redisProfitLoss?.totalBet ? parseInt(redisProfitLoss?.totalBet) + 1 : 1
  };
};

/**
* Calculates the profit or loss for a betting session.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossSessionFancy1 = async (redisProfitLoss, betData, partnership = 100) => {
  let maxLoss = 0;

  let betProfitloss = redisProfitLoss?.betPlaced ?? {};

  if (betData?.betPlacedData?.betType == betType.BACK) {
    betProfitloss.yes = (betProfitloss.yes || 0) + (betData?.winAmount * partnership / 100);
    betProfitloss.no = (betProfitloss.no || 0) - (betData?.lossAmount * partnership / 100);
  }
  else if (betData?.betPlacedData?.betType == betType.LAY) {
    betProfitloss.yes = (betProfitloss.yes || 0) - (betData?.lossAmount * partnership / 100);
    betProfitloss.no = (betProfitloss.no || 0) + (betData?.winAmount * partnership / 100);
  }

  maxLoss = Number(Math.min(...Object.values(betProfitloss), 0).toFixed(2));
  // Return the result
  return {
    betPlaced: betProfitloss,
    maxLoss: parseFloat(Math.abs(maxLoss)),
    totalBet: redisProfitLoss?.totalBet ? parseInt(redisProfitLoss?.totalBet) + 1 : 1
  };
};

/**
* Calculates the profit or loss for a betting session.
* @param {object} redisProfitLoss - Redis data for profit and loss.
* @param {object} betData - Data for the current bet.
* @returns {object} - Object containing upper and lower limit odds, and the updated bet placed data.
*/
exports.calculateProfitLossSessionCasinoCricket = async (redisProfitLoss, betData, partnership = 100) => {
  let maxLoss = 0;

  let betProfitloss = redisProfitLoss?.betPlaced ?? {};

  Array.from({ length: 10 }, (_, index) => index)?.forEach((item) => {
    if (betData?.betPlacedData?.teamName?.split(" ")?.[0] == item) {
      betProfitloss[item] = (betProfitloss[item] || 0) + (betData?.winAmount * partnership / 100);
    }
    else {
      betProfitloss[item] = (betProfitloss[item] || 0) - (betData?.lossAmount * partnership / 100);
    }
  });

  maxLoss = Number(Math.min(...Object.values(betProfitloss), 0).toFixed(2));
  // Return the result
  return {
    betPlaced: betProfitloss,
    maxLoss: parseFloat(Math.abs(maxLoss)),
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

exports.commonGetMatchDetails = async (matchId, userId, isSessionAllowed = true, isMarketAllowed = true) => {
  let match = await getMatchFromCache(matchId);
  let expertResults = [...(await getExpertResultTournamentBetWise({ matchId: matchId })), ...(await getExpertResultSessionBetWise({ matchId: matchId }))]
  const sessionExpertResult = await getExpertResult({ matchId: matchId },["betId","userId","id"]);

  // Check if the match exists
  if (match) {
      // Retrieve all session data from Redis for the given match
    let sessions = await getAllSessionRedis(matchId);

    // If session data is found in Redis, update its expiry time
    if (!sessions) {

      // If no session data is found in Redis, fetch it from the database
      sessions = await getSessionBattingByMatchId(matchId, !userId ? { activeStatus: betStatusType.live } : {});

      let result = {};
      let apiSelectionIdObj = {};
      for (let index = 0; index < sessions?.length; index++) {
        // if (sessions?.[index]?.activeStatus == betStatusType.live) {
        if (sessions?.[index]?.selectionId) {
          apiSelectionIdObj[sessions?.[index]?.selectionId] = sessions?.[index]?.id;
        }
        result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
        // }
        sessions[index] = JSON.stringify(sessions?.[index]);
      }
      settingAllSessionMatchRedis(matchId, result);
      updateMultipleMarketSessionIdRedis(matchId, apiSelectionIdObj);
    }
    else {
      if (isSessionAllowed) {
        if (userId) {
          sessions = await getSessionBattingByMatchId(matchId);
          sessions = sessions?.map((item) => JSON.stringify(item));
        }
        else {
          sessions = Object.values(sessions);
        }
      }
    }

    if (isSessionAllowed) {
      match.sessionBettings = sessions;
    }

    if (isMarketAllowed) {
      const categorizedMatchBettings = {
       
        ...(match.tournament
          ? { [matchBettingType.tournament]: match.tournament }
          : {}),
      };
      // Iterate through matchBettings and categorize them
      
      // Assign the categorized match betting to the match object
      Object.assign(match, categorizedMatchBettings);
    }
    else{
      delete match.tournament;
    }
  } else {
    match = await getMatchDetails(matchId, null);
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
    // sort the runner by the sort priority
    match.tournamentBettings?.forEach(item => {
      item.runners.sort((a, b) => a.sortPriority - b.sortPriority);
    })

    const categorizedMatchBettings = {
      tournament: null,
    };

    
    let payload = {
      ...match,
      tournament: [...match?.tournamentBettings?.sort((a, b) => a.sNo - b.sNo) || []],
    };
    delete match.tournamentBettings;
    await addMatchInCache(match.id, payload);

    let sessions = match?.sessionBettings;
    let result = {};
    let apiSelectionIdObj = {};
    for (let index = 0; index < sessions?.length; index++) {
      // if (sessions?.[index]?.activeStatus == betStatusType.live) {
      if (sessions?.[index]?.selectionId) {
        apiSelectionIdObj[sessions?.[index]?.selectionId] = sessions?.[index]?.id;
      }
      result[sessions?.[index]?.id] = JSON.stringify(sessions?.[index]);
      // }
      sessions[index] = JSON.stringify(sessions?.[index]);
    }
    settingAllSessionMatchRedis(matchId, result);
    updateMultipleMarketSessionIdRedis(matchId, apiSelectionIdObj);
    if (isSessionAllowed) {
      match.sessionBettings = sessions;
    }

    if (isMarketAllowed) {
      // Assign the categorized match betting to the match object
      Object.assign(match, categorizedMatchBettings);
      match.tournament = payload.tournament;
    }
    delete match.matchBettings;
  }
  let teamRates = await getExpertsRedisMatchData(matchId);

  if (isMarketAllowed) {
    match.teamRates = teamRates;
  }
  if (userId) {
    if (isSessionAllowed) {

      const redisIds = match.sessionBettings?.map((item, index) => {
        const sessionBettingData = JSON.parse(item);
        const currSessionExpertResult = expertResults.find((result) => result.betId == sessionBettingData?.id);
        const sessionResultExpert = sessionExpertResult.filter((result) => result.betId == sessionBettingData?.id)
        if (currSessionExpertResult && !(sessionBettingData.activeStatus == betStatus.result)) {
          if (sessionResultExpert?.length == 1) {
            sessionBettingData.selfDeclare = sessionResultExpert?.[0]?.userId == userId ? true : false;
            sessionBettingData.resultStatus = currSessionExpertResult?.status;
            match.sessionBettings[index] = JSON.stringify(sessionBettingData);
          }
          else {
            sessionBettingData.resultStatus = currSessionExpertResult?.status;
            match.sessionBettings[index] = JSON.stringify(sessionBettingData);
          }
        }

        return (sessionBettingData?.id + redisKeys.profitLoss)
      });
      if (redisIds?.length > 0) {
        let sessionData = await getExpertsRedisSessionDataByKeys(redisIds);
        match.sessionProfitLoss = sessionData;
      }
    }
    if (!(match.stopAt) && isMarketAllowed) {
    
      for (let items of (match?.tournament || [])) {
        let matchResult = expertResults.find((result) => result.betId == items?.id);
        if (matchResult) {
          match.otherBettings = match.otherBettings || {};
          match.otherBettings[items?.id] = matchResult.status;
        }
      }

    }
  }
  return match;
}

exports.commonGetRaceDetails = async (raceId, userId) => {
  let race = await getRaceFromCache(raceId);
  let expertResults = await getExpertResult({ matchId: raceId });
  if (race) {
    const { runners, matchOdd, ...updatedRace } = race;
    updatedRace.matchOdd = JSON.parse(matchOdd);
    updatedRace.runners = JSON.parse(runners);
    race = updatedRace;
  } else {
    race = await getRaceDetails({ id: raceId });
    if (!race) {
      throw {
        statusCode: 400,
        message: {
          msg: "notFound",
          keys: {
            name: "Race",
          },
        },
      }
    }
    let { runners, matchOdd, ...cacheData } = race
    cacheData.runners = JSON.stringify(runners)
    cacheData.matchOdd = JSON.stringify(matchOdd)
    await addRaceInCache(race.id, cacheData);
  }

  if (userId && race?.matchOdd?.id) {
    let matchProfitLoss = await getExpertsRedisKeyData(`${race?.id}${redisKeys.profitLoss}`)
    if (matchProfitLoss) {
      matchProfitLoss = JSON.parse(matchProfitLoss);
    }
    race.profitLossDataMatch = matchProfitLoss;

    if (!(race.stopAt)) {
      let raceResult = expertResults.filter((result) => result.betId == race?.matchOdd?.id);
      if (raceResult?.length != 0) {
        if (raceResult?.length == 1) {
          race.resultStatus = resultStatus.pending;
        } else {
          race.resultStatus = resultStatus.missMatched;
        }
      }
    }
  }
  return race
}

exports.extractNumbersFromString = (str) => {
  const matches = str.match(/\d+(\.\d+)?/);
  return matches ? parseFloat(matches[0]) : null;
}

exports.parseRedisData = (redisKey, userRedisData) => {
  return parseFloat((Number(userRedisData[redisKey]) || 0.0).toFixed(2));
};

exports.deleteOldData = async () => {
  const deleteTime = new Date();
  deleteTime.setMonth(deleteTime.getMonth() - 3);
  await deleteOldExpertResult({ createdAt: LessThanOrEqual(deleteTime) });
}