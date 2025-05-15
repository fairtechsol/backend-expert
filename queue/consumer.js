const Queue = require('bee-queue');
const { calculateProfitLossSession, mergeProfitLoss, parseRedisData, calculateRacingExpertRate, calculateProfitLossSessionOddEven, calculateProfitLossSessionCasinoCricket, calculateProfitLossSessionFancy1, calculateProfitLossKhado, calculateProfitLossMeter } = require('../services/commonService');
const { logger } = require('../config/logger');
const { redisKeys, socketData, sessionBettingType, jobQueueConcurrent } = require('../config/contants');
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

const ExpertSessionBetQueue = new Queue('expertSessionBetQueue', expertRedisOption);
// const ExpertCardMatchBetQueue = new Queue('expertCardMatchBetQueue', externalRedisOption);
const expertSessionBetDeleteQueue = new Queue('expertSessionBetDeleteQueue', expertRedisOption);
const expertTournamentMatchBetDeleteQueue = new Queue('expertTournamentMatchBetDeleteQueue', expertRedisOption);
const ExpertMatchTournamentBetQueue = new Queue('expertMatchTournamentBetQueue', expertRedisOption);

ExpertMatchTournamentBetQueue.process(jobQueueConcurrent, async function (job, done) {
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

ExpertSessionBetQueue.process(jobQueueConcurrent, async function (job, done) {
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

module.exports.ExpertMatchQueue = { ExpertSessionBetQueue, expertTournamentMatchBetDeleteQueue, expertSessionBetDeleteQueue, ExpertMatchTournamentBetQueue }