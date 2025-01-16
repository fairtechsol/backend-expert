const Queue = require('bee-queue');
const { calculateExpertRate, calculateProfitLossSession, mergeProfitLoss, parseRedisData, calculateRacingExpertRate, calculateProfitLossSessionOddEven, calculateProfitLossSessionCasinoCricket, calculateProfitLossSessionFancy1, calculateProfitLossKhado, calculateProfitLossMeter } = require('../services/commonService');
const { logger } = require('../config/logger');
const { redisKeys, socketData, sessionBettingType } = require('../config/contants');
const { sendMessageToUser } = require('../sockets/socketManager');
const { setExpertsRedisData, getExpertsRedisData } = require('../services/redis/commonfunction');
const { CardProfitLoss } = require('../services/cardService/cardProfitLossCalc');
const expertRedisOption = {
  removeOnSuccess: true,
  redis: {
    port: process.env.EXTERNAL_REDIS_PORT,
    host: process.env.EXTERNAL_REDIS_HOST
  }
}

const ExpertMatchBetQueue = new Queue('expertMatchBetQueue', expertRedisOption);
const ExpertSessionBetQueue = new Queue('expertSessionBetQueue', expertRedisOption);
const ExpertMatchRacingBetQueue = new Queue('expertMatchRacingBetQueue', expertRedisOption);
// const ExpertCardMatchBetQueue = new Queue('expertCardMatchBetQueue', externalRedisOption);
const expertSessionBetDeleteQueue = new Queue('expertSessionBetDeleteQueue', expertRedisOption);
const expertMatchBetDeleteQueue = new Queue('expertMatchBetDeleteQueue', expertRedisOption);
const expertRaceMatchBetDeleteQueue = new Queue('expertRaceMatchBetDeleteQueue', expertRedisOption);
const expertTournamentMatchBetDeleteQueue = new Queue('expertTournamentMatchBetDeleteQueue', expertRedisOption);
const ExpertMatchTournamentBetQueue = new Queue('expertMatchTournamentBetQueue', expertRedisOption);

ExpertMatchBetQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    await calculateRateAmount(jobData, userId);
    return done(null, {});
  } catch (error) {
    logger.error({
      file: `error in bet Queue for User id : ${userId}`,
      error: error.message
    })
    return done(null, {});
  }
});

let calculateRateAmount = async (jobData, userId) => {
  let partnership = JSON.parse(jobData.partnerships);
  let obj = {
    teamA: jobData.teamA,
    teamB: jobData.teamB,
    teamC: jobData.teamC,
    winAmount: jobData.winAmount,
    lossAmount: jobData.lossAmount,
    bettingType: jobData.bettingType,
    betOnTeam: jobData.betOnTeam
  }

  if (partnership['fwPartnershipId']) {
    let mPartenerShipId = partnership['fwPartnershipId'];
    let mPartenerShip = partnership['fwPartnership'];
    try {
      let masterRedisData = (await getExpertsRedisData()) || {};
      let teamRates = {
        teamA: parseFloat(masterRedisData[jobData.teamArateRedisKey]) || 0.0,
        teamB: parseFloat(masterRedisData[jobData.teamBrateRedisKey]) || 0.0,
        teamC: jobData.teamCrateRedisKey ? parseFloat(masterRedisData[jobData.teamCrateRedisKey]) || 0.0 : 0.0
      }
      let teamData = await calculateExpertRate(teamRates, obj, mPartenerShip);
      let userRedisObj = {
        [jobData.teamArateRedisKey]: teamData.teamA,
        [jobData.teamBrateRedisKey]: teamData.teamB,
        ...(jobData.teamCrateRedisKey ? { [jobData.teamCrateRedisKey]: teamData.teamC } : {})
      }
      await setExpertsRedisData(userRedisObj);
      //send Data to socket
      jobData.myStake = Number(((jobData.stake / 100) * mPartenerShip).toFixed(2));
      sendMessageToUser(socketData.expertRoomSocket, socketData.MatchBetPlaced, { jobData, userRedisObj });
      logger.info({
        context: "User team rates",
        process: `User ID : ${userId} id  ${jobData?.newBet?.matchId}`,
        data: { teamData, jobData, oldTeamRates: teamRates }
      });
    }
    catch (error) {
      logger.error({
        context: "error in super master exposure update",
        process: `User ID : ${userId} and super master id ${mPartenerShipId}`,
        error: error.message,
        stake: error.stack
      })
    }
  }
}

ExpertMatchRacingBetQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    await calculateRacingRateAmount(jobData, userId);
    return done(null, {});
  } catch (error) {
    logger.error({
      file: `error in bet Queue for User id : ${userId}`,
      error: error.message
    })
    return done(null, {});
  }
});

let calculateRacingRateAmount = async (jobData, userId) => {
  let partnership = JSON.parse(jobData.partnerships);
  let obj = {
    runners: jobData.runners,
    winAmount: jobData.winAmount,
    lossAmount: jobData.lossAmount,
    bettingType: jobData.bettingType,
    runnerId: jobData.runnerId
  }

  if (partnership['fwPartnershipId']) {
    let mPartenerShipId = partnership['fwPartnershipId'];
    let mPartenerShip = partnership['fwPartnership'];
    try {
      let masterRedisData = (await getExpertsRedisData()) || {};
      let teamRates = masterRedisData?.[`${jobData?.matchId}${redisKeys.profitLoss}`];

      if (teamRates) {
        teamRates = JSON.parse(teamRates);
      }

      if (!teamRates) {
        teamRates = jobData?.runners?.reduce((acc, key) => {
          acc[key?.id] = 0;
          return acc;
        }, {});
      }

      teamRates = Object.keys(teamRates).reduce((acc, key) => {
        acc[key] = parseRedisData(key, teamRates);
        return acc;
      }, {});

      let teamData = await calculateRacingExpertRate(teamRates, obj, mPartenerShip);
      let userRedisObj = {
        [`${jobData?.matchId}${redisKeys.profitLoss}`]: JSON.stringify(teamData)
      }
      await setExpertsRedisData(userRedisObj);

      //send Data to socket
      jobData.myStake = Number(((jobData.stake / 100) * mPartenerShip).toFixed(2));
      sendMessageToUser(socketData.expertRoomSocket, socketData.MatchBetPlaced, { jobData, userRedisObj: teamData });
    }
    catch (error) {
      logger.error({
        context: "error in super master exposure update",
        process: `User ID : ${userId} and super master id ${mPartenerShipId}`,
        error: error.message,
        stake: error.stack
      })
    }
  }
}

ExpertMatchTournamentBetQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    await calculateTournamentRateAmount(jobData, userId);
    return done(null, {});
  } catch (error) {
    logger.error({
      file: `error in bet Queue for User id : ${userId}`,
      error: error.message
    })
    return done(null, {});
  }
});

let calculateTournamentRateAmount = async (jobData, userId) => {
  let partnership = JSON.parse(jobData.partnerships);
  let obj = {
    runners: jobData.runners,
    winAmount: jobData.winAmount,
    lossAmount: jobData.lossAmount,
    bettingType: jobData.bettingType,
    runnerId: jobData.runnerId
  }

  if (partnership['fwPartnershipId']) {
    let mPartenerShipId = partnership['fwPartnershipId'];
    let mPartenerShip = partnership['fwPartnership'];
    try {
      let masterRedisData = (await getExpertsRedisData()) || {};
      let teamRates = masterRedisData?.[`${jobData?.betId}${redisKeys.profitLoss}_${jobData?.matchId}`];

      if (teamRates) {
        teamRates = JSON.parse(teamRates);
      }

      if (!teamRates) {
        teamRates = jobData?.runners?.reduce((acc, key) => {
          acc[key?.id] = 0;
          return acc;
        }, {});
      }

      teamRates = Object.keys(teamRates).reduce((acc, key) => {
        acc[key] = parseRedisData(key, teamRates);
        return acc;
      }, {});

      let teamData = await calculateRacingExpertRate(teamRates, obj, mPartenerShip);
      let userRedisObj = {
        [`${jobData?.betId}${redisKeys.profitLoss}_${jobData?.matchId}`]: JSON.stringify(teamData)
      }
      await setExpertsRedisData(userRedisObj);

      //send Data to socket
      jobData.myStake = Number(((jobData.stake / 100) * mPartenerShip).toFixed(2));
      sendMessageToUser(socketData.expertRoomSocket, socketData.MatchBetPlaced, { jobData, userRedisObj: teamData });
    }
    catch (error) {
      logger.error({
        context: "error in super master exposure update",
        process: `User ID : ${userId} and super master id ${mPartenerShipId}`,
        error: error.message,
        stake: error.stack
      })
    }
  }
}

ExpertSessionBetQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    await calculateSessionRateAmount(jobData, userId);
    return done(null, {});
  } catch (error) {
    logger.error({
      file: "error in session bet Queue",
      info: `process job for user id ${userId}`,

      jobData,
    });
    return done(null, {});
  }
});

const calculateSessionRateAmount = async (jobData, userId) => {
  // Parse partnerships from userRedisData
  let partnershipObj = JSON.parse(jobData.partnership);

  // Extract relevant data from jobData
  const placedBetObject = jobData.betPlaceObject;
  let partnerSessionExposure = placedBetObject.diffSessionExp;
  let stake = placedBetObject?.betPlacedData?.stake;

  // Iterate through partnerships based on role and update exposure
  if (partnershipObj['fwPartnershipId']) {
    let partnershipId = partnershipObj['fwPartnershipId'];
    let partnership = partnershipObj[`fwPartnership`];
    try {
      // Get user data from Redis or balance data by userId
      let expertRedisData = (await getExpertsRedisData()) || {};
      // Calculate profit loss session and update Redis data
      const redisBetData = expertRedisData[`${placedBetObject?.betPlacedData?.betId}_profitLoss`]
        ? JSON.parse(expertRedisData[`${placedBetObject?.betPlacedData?.betId}_profitLoss`])
        : null;
      let redisData;

      switch (jobData?.placedBet?.marketType) {
        case sessionBettingType.session:
        case sessionBettingType.overByOver:
        case sessionBettingType.ballByBall:
          redisData = await calculateProfitLossSession(
            redisBetData,
            placedBetObject,
            partnership
          );
          break;
        case sessionBettingType.khado:
          redisData = await calculateProfitLossKhado(
            redisBetData,
            placedBetObject,
            partnership
          );
          break;
        case sessionBettingType.meter:
          redisData = await calculateProfitLossMeter(
            redisBetData,
            placedBetObject,
            partnership
          );
          break;
        case sessionBettingType.oddEven:
          redisData = await calculateProfitLossSessionOddEven(redisBetData,
            { ...placedBetObject, winAmount: -placedBetObject?.winAmount, lossAmount: -placedBetObject?.lossAmount }, partnership);
          break;
        case sessionBettingType.cricketCasino:
          redisData = await calculateProfitLossSessionCasinoCricket(redisBetData,
            { ...placedBetObject, winAmount: -placedBetObject?.winAmount, lossAmount: -placedBetObject?.lossAmount }, partnership);
          break;
        case sessionBettingType.fancy1:
          redisData = await calculateProfitLossSessionFancy1(redisBetData,
            { ...placedBetObject, winAmount: -placedBetObject?.winAmount, lossAmount: -placedBetObject?.lossAmount }, partnership);
          break;
        default:
          break;
      }

      await setExpertsRedisData({
        [`${placedBetObject?.betPlacedData?.betId}_profitLoss`]: JSON.stringify(redisData),

      });

      // Update jobData with calculated stake
      jobData.betPlaceObject.myStack = (
        (stake * parseFloat(partnership)) /
        100
      ).toFixed(2);

      // Send data to socket for session bet placement
      sendMessageToUser(socketData.expertRoomSocket, socketData.SessionBetPlaced, {
        jobData,
        redisData
      });


    } catch (error) {
      // Log error if any during exposure update
      logger.error({
        context: `error in expert exposure update`,
        process: `User ID : ${userId} and expert id ${partnershipId}`,
        error: error.message,
        stake: error.stack,
      });
    }
  }
};

expertSessionBetDeleteQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    // Parse partnerships from userRedisData
    let partnershipObj = {};
    try {
      partnershipObj = JSON.parse(jobData.partnership);
    } catch {
      partnershipObj = jobData.partnership;
    }

    // Extract relevant data from jobData
    const userDeleteProfitLoss = jobData.userDeleteProfitLoss;
    let exposureDiff = jobData.exposureDiff;
    let betId = jobData.betId;
    let matchId = jobData.matchId;
    let deleteReason = jobData.deleteReason;
    let domainUrl = jobData.domainUrl;
    let betPlacedId = jobData.betPlacedId;
    let redisName = `${betId}_profitLoss`;
    let sessionType = jobData.sessionType;

    // Iterate through partnerships based on role and update exposure
    if (partnershipObj['fwPartnershipId']) {
      let partnershipId = partnershipObj['fwPartnershipId'];
      let partnership = partnershipObj[`fwPartnership`];
      try {
        // Get user data from Redis or balance data by userId
        let expertRedisData = await getExpertsRedisData();

        let oldProfitLossParent = JSON.parse(expertRedisData[redisName]);
        let parentPLbetPlaced = oldProfitLossParent?.betPlaced || [];
        if (![sessionBettingType.oddEven, sessionBettingType.fancy1, sessionBettingType.cricketCasino].includes(sessionType)) {
          await mergeProfitLoss(userDeleteProfitLoss.betData, parentPLbetPlaced);
        }
        let newMaxLossParent = 0;


        if ([sessionBettingType.oddEven, sessionBettingType.fancy1, sessionBettingType.cricketCasino].includes(sessionType)) {
          Object.keys(userDeleteProfitLoss.betData).forEach((ob) => {
            let partnershipData = (userDeleteProfitLoss.betData[ob] * partnership) / 100;
            parentPLbetPlaced[ob] = parentPLbetPlaced[ob] + partnershipData;
            if (newMaxLossParent < Math.abs(parentPLbetPlaced[ob]) && parentPLbetPlaced[ob] < 0) {
              newMaxLossParent = Math.abs(parentPLbetPlaced[ob]);
            }
          });
        }
        else {
          userDeleteProfitLoss.betData.map((ob, index) => {
            let partnershipData = (ob.profitLoss * partnership) / 100;
            if (ob.odds == parentPLbetPlaced[index].odds) {
              parentPLbetPlaced[index].profitLoss = parseFloat((parseFloat(parentPLbetPlaced[index].profitLoss) + partnershipData).toFixed(2));
              if (newMaxLossParent < Math.abs(parentPLbetPlaced[index].profitLoss) && parentPLbetPlaced[index].profitLoss < 0) {
                newMaxLossParent = Math.abs(parentPLbetPlaced[index].profitLoss);
              }
            }
          });
        }

        oldProfitLossParent.betPlaced = parentPLbetPlaced;
        oldProfitLossParent.maxLoss = newMaxLossParent;
        oldProfitLossParent.totalBet = oldProfitLossParent.totalBet - userDeleteProfitLoss.total_bet;

        let redisObj = {
          [redisName]: JSON.stringify(oldProfitLossParent)
        };

        await setExpertsRedisData(redisObj);

        // Send data to socket for session bet placement
        sendMessageToUser(socketData.expertRoomSocket, socketData.sessionDeleteBet, {
          profitLoss: oldProfitLossParent,
          matchId: matchId,
          betPlacedId: betPlacedId,
          deleteReason: deleteReason,
          domainUrl: domainUrl,
          isPermanentDelete: jobData.isPermanentDelete,
          betId: betId
        });
      } catch (error) {
        // Log error if any during exposure update
        logger.error({
          context: `error in exposure update at delete session bet expert`,
          process: `User ID : ${userId} and expert id ${partnershipId}`,
          error: error.message,
          stake: error.stack,
        });
      }
    }

    return done(null, {});
  } catch (error) {
    logger.error({
      context: "error in session bet delete Queue",
      process: `process job for user id ${userId}`,
      error: error.message,
      stake: error.stack,
    });
    return done(null, {});
  }
});

expertMatchBetDeleteQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    // Parse partnerships from userRedisData
    let partnershipObj = {};
    try {
      partnershipObj = JSON.parse(jobData.partnership);
    } catch {
      partnershipObj = jobData.partnership;
    }

    // Extract relevant data from jobData
    let exposureDiff = jobData.exposureDiff;
    let betId = jobData.betId;
    let matchId = jobData.matchId;
    let deleteReason = jobData.deleteReason;
    let domainUrl = jobData.domainUrl;
    let betPlacedId = jobData.betPlacedId;
    let matchBetType = jobData.matchBetType;
    let newTeamRate = jobData.newTeamRate;
    let teamArateRedisKey = jobData.teamArateRedisKey;
    let teamBrateRedisKey = jobData.teamBrateRedisKey;
    let teamCrateRedisKey = jobData.teamCrateRedisKey;

    // Iterate through partnerships based on role and update exposure
    if (partnershipObj['fwPartnershipId']) {
      let partnershipId = partnershipObj['fwPartnershipId'];
      let partnership = partnershipObj[`fwPartnership`];
      try {
        // Get user data from Redis or balance data by userId
        let expertRedisData = await getExpertsRedisData();
        let masterTeamRates = {
          teamA: Number(expertRedisData[teamArateRedisKey]) || 0,
          teamB: Number(expertRedisData[teamBrateRedisKey]) || 0,
          teamC: teamCrateRedisKey ? Number(expertRedisData[teamCrateRedisKey]) || 0 : 0
        };
        masterTeamRates.teamA = masterTeamRates.teamA + ((newTeamRate.teamA * partnership) / 100);
        masterTeamRates.teamB = masterTeamRates.teamB + ((newTeamRate.teamB * partnership) / 100);
        masterTeamRates.teamC = masterTeamRates.teamC + ((newTeamRate.teamC * partnership) / 100);

        masterTeamRates.teamA = parseFloat((masterTeamRates.teamA).toFixed(2));
        masterTeamRates.teamB = parseFloat((masterTeamRates.teamB).toFixed(2));
        masterTeamRates.teamC = parseFloat((masterTeamRates.teamC).toFixed(2));

        let redisObj = {
          [teamArateRedisKey]: masterTeamRates.teamA,
          [teamBrateRedisKey]: masterTeamRates.teamB,
          ...(teamCrateRedisKey ? { [teamCrateRedisKey]: masterTeamRates.teamC } : {})
        }

        await setExpertsRedisData(redisObj);

        // Send data to socket for session bet placement
        sendMessageToUser(socketData.expertRoomSocket, socketData.matchDeleteBet, {
          ...masterTeamRates,
          betId: betId,
          matchId: matchId,
          betPlacedId: betPlacedId,
          deleteReason: deleteReason,
          domainUrl: domainUrl,
          matchBetType,
          teamArateRedisKey: teamArateRedisKey,
          teamBrateRedisKey: teamBrateRedisKey,
          teamCrateRedisKey: teamCrateRedisKey,
          isPermanentDelete: jobData.isPermanentDelete,
          redisObject: redisObj
        });
      } catch (error) {
        // Log error if any during exposure update
        logger.error({
          context: `error in exposure update at delete match bet expert`,
          process: `User ID : ${userId} and expert id ${partnershipId}`,
          error: error.message,
          stake: error.stack,
        });
      }
    }

    return done(null, {});
  } catch (error) {
    logger.error({
      context: "error in match bet delete Queue",
      process: `process job for user id ${userId}`,
      error: error.message,
      stake: error.stack,
    });
    return done(null, {});
  }
});

expertRaceMatchBetDeleteQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    // Parse partnerships from userRedisData
    let partnershipObj = {};
    try {
      partnershipObj = JSON.parse(jobData.partnership);
    } catch {
      partnershipObj = jobData.partnership;
    }

    // Extract relevant data from jobData
    let betId = jobData.betId;
    let matchId = jobData.matchId;
    let deleteReason = jobData.deleteReason;
    let domainUrl = jobData.domainUrl;
    let betPlacedId = jobData.betPlacedId;
    let matchBetType = jobData.matchBetType;
    let newTeamRate = jobData.newTeamRate;

    // Iterate through partnerships based on role and update exposure
    if (partnershipObj['fwPartnershipId']) {
      let partnershipId = partnershipObj['fwPartnershipId'];
      let partnership = partnershipObj[`fwPartnership`];
      try {
        // Get user data from Redis or balance data by userId
        let expertRedisData = await getExpertsRedisData();

        let masterTeamRates = JSON.parse(expertRedisData[`${matchId}${redisKeys.profitLoss}`]);

        masterTeamRates = Object.keys(masterTeamRates).reduce((acc, key) => {
          acc[key] = parseFloat((parseRedisData(key, masterTeamRates) + ((newTeamRate[key] * partnership) / 100)).toFixed(2));
          return acc;
        }, {});

        let redisObj = {
          [`${matchId}${redisKeys.profitLoss}`]: JSON.stringify(masterTeamRates)
        }

        await setExpertsRedisData(redisObj);

        // Send data to socket for session bet placement
        sendMessageToUser(socketData.expertRoomSocket, socketData.matchDeleteBet, {
          teamRate: masterTeamRates,
          betId: betId,
          matchId: matchId,
          betPlacedId: betPlacedId,
          deleteReason: deleteReason,
          domainUrl: domainUrl,
          isPermanentDelete: jobData.isPermanentDelete,
          matchBetType
        });
      } catch (error) {
        // Log error if any during exposure update
        logger.error({
          context: `error in exposure update at delete match bet expert`,
          process: `User ID : ${userId} and expert id ${partnershipId}`,
          error: error.message,
          stake: error.stack,
        });
      }
    }

    return done(null, {});
  } catch (error) {
    logger.error({
      context: "error in match bet delete Queue",
      process: `process job for user id ${userId}`,
      error: error.message,
      stake: error.stack,
    });
    return done(null, {});
  }
});

expertTournamentMatchBetDeleteQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    // Parse partnerships from userRedisData
    let partnershipObj = {};
    try {
      partnershipObj = JSON.parse(jobData.partnership);
    } catch {
      partnershipObj = jobData.partnership;
    }

    // Extract relevant data from jobData
    let betId = jobData.betId;
    let matchId = jobData.matchId;
    let deleteReason = jobData.deleteReason;
    let domainUrl = jobData.domainUrl;
    let betPlacedId = jobData.betPlacedId;
    let matchBetType = jobData.matchBetType;
    let newTeamRate = jobData.newTeamRate;

    // Iterate through partnerships based on role and update exposure
    if (partnershipObj['fwPartnershipId']) {
      let partnershipId = partnershipObj['fwPartnershipId'];
      let partnership = partnershipObj[`fwPartnership`];
      try {
        // Get user data from Redis or balance data by userId
        let expertRedisData = await getExpertsRedisData();

        let masterTeamRates = JSON.parse(expertRedisData[`${betId}${redisKeys.profitLoss}_${matchId}`]);

        masterTeamRates = Object.keys(masterTeamRates).reduce((acc, key) => {
          acc[key] = parseFloat((parseRedisData(key, masterTeamRates) + ((newTeamRate[key] * partnership) / 100)).toFixed(2));
          return acc;
        }, {});

        let redisObj = {
          [`${betId}${redisKeys.profitLoss}_${matchId}`]: JSON.stringify(masterTeamRates)
        }

        await setExpertsRedisData(redisObj);

        // Send data to socket for session bet placement
        sendMessageToUser(socketData.expertRoomSocket, socketData.matchDeleteBet, {
          teamRate: masterTeamRates,
          betId: betId,
          matchId: matchId,
          betPlacedId: betPlacedId,
          deleteReason: deleteReason,
          domainUrl: domainUrl,
          isPermanentDelete: jobData.isPermanentDelete,
          matchBetType
        });
      } catch (error) {
        // Log error if any during exposure update
        logger.error({
          context: `error in exposure update at delete match bet expert`,
          process: `User ID : ${userId} and expert id ${partnershipId}`,
          error: error.message,
          stake: error.stack,
        });
      }
    }

    return done(null, {});
  } catch (error) {
    logger.error({
      context: "error in match bet delete Queue",
      process: `process job for user id ${userId}`,
      error: error.message,
      stake: error.stack,
    });
    return done(null, {});
  }
});

module.exports.ExpertMatchQueue = { ExpertMatchBetQueue, ExpertSessionBetQueue, ExpertMatchRacingBetQueue, expertTournamentMatchBetDeleteQueue, expertSessionBetDeleteQueue, expertMatchBetDeleteQueue, ExpertMatchTournamentBetQueue }