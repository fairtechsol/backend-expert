const Queue = require('bee-queue');
const { calculateExpertRate, calculateProfitLossSession, mergeProfitLoss } = require('../services/commonService');
const { logger } = require('../config/logger');
const { redisKeys, socketData } = require('../config/contants');
const { sendMessageToUser } = require('../sockets/socketManager');
const { setExpertsRedisData, getExpertsRedisData } = require('../services/redis/commonfunction');
const expertRedisOption = {
  removeOnSuccess: true,
  redis: {
    port: process.env.EXTERNAL_REDIS_PORT,
    host: process.env.EXTERNAL_REDIS_HOST
  }
}

const ExpertMatchBetQueue = new Queue('expertMatchBetQueue', expertRedisOption);
const ExpertSessionBetQueue = new Queue('expertSessionBetQueue', expertRedisOption);
const expertSessionBetDeleteQueue = new Queue('expertSessionBetDeleteQueue', expertRedisOption);
const expertMatchBetDeleteQueue = new Queue('expertMatchBetDeleteQueue', expertRedisOption);

ExpertMatchBetQueue.process(async function (job, done) {
  let jobData = job.data;
  let userId = jobData.userId;
  try {
    await calculateRateAmount(jobData, userId);
    return done(null, {});
  } catch (error) {
    logger.info({
      file: `error in bet Queue for User id : ${userId}`,
      error: error.message
    })
    return done(null, {});
  }
});

let calculateRateAmount = async (jobData, userId) => {
  let partnership = JSON.parse(jobData.partnerships);
  let teamRates = jobData.teamRates;
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
      logger.info({
        context: "Update User Exposure",
        process: `User ID : ${userId} expert`,
      });
      //send Data to socket
      jobData.myStake = Number(((jobData.stake / 100) * mPartenerShip).toFixed(2));
      sendMessageToUser(socketData.expertRoomSocket, socketData.MatchBetPlaced, { jobData, userRedisObj });
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
    logger.info({
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

      let redisData = await calculateProfitLossSession(
        redisBetData,
        placedBetObject,
        partnership
      );

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
    let partnershipObj = JSON.parse(jobData.partnership);

    // Extract relevant data from jobData
    const userDeleteProfitLoss = jobData.userDeleteProfitLoss;
    let exposureDiff = jobData.exposureDiff;
    let betId = jobData.betId;
    let matchId = jobData.matchId;
    let deleteReason = jobData.deleteReason;
    let domainUrl = jobData.domainUrl;
    let betPlacedId = jobData.betPlacedId;
    let redisName = `${betId}_profitLoss`;

    // Iterate through partnerships based on role and update exposure
    if (partnershipObj['fwPartnershipId']) {
      let partnershipId = partnershipObj['fwPartnershipId'];
      let partnership = partnershipObj[`fwPartnership`];
      try {
        // Get user data from Redis or balance data by userId
        let expertRedisData = await getExpertsRedisData();

        let oldProfitLossParent = JSON.parse(expertRedisData[redisName]);
        let parentPLbetPlaced = oldProfitLossParent?.betPlaced || [];
        await mergeProfitLoss(userDeleteProfitLoss.betData, parentPLbetPlaced);
        let newMaxLossParent = 0;
        userDeleteProfitLoss.betData.map((ob, index) => {
          let partnershipData = (ob.profitLoss * partnership) / 100;
          if (ob.odds == parentPLbetPlaced[index].odds) {
            parentPLbetPlaced[index].profitLoss = parseFloat(parentPLbetPlaced[index].profitLoss) + partnershipData;
            if (newMaxLossParent < Math.abs(parentPLbetPlaced[index].profitLoss) && parentPLbetPlaced[index].profitLoss < 0) {
              newMaxLossParent = Math.abs(parentPLbetPlaced[index].profitLoss);
            }
          }
        });
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
          domainUrl: domainUrl
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
    try{
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

module.exports.ExpertMatchQueue = { ExpertMatchBetQueue, ExpertSessionBetQueue, expertSessionBetDeleteQueue }