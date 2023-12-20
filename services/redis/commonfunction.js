const internalRedis = require("../../config/internalRedisConnection");
const { getMatchById } = require("../matchService");

let expiry = 3600;
exports.addMatchInCache = async (matchId,data) =>{
    let matchKey =`${matchId}_match`;
    let payload = {
        id: JSON.stringify(data.id),
        matchType : JSON.stringify(data.matchType),
        competitionId : JSON.stringify(data.competitionId),
        competitionName : JSON.stringify(data.competitionName),
        title : JSON.stringify(data.title),
        marketId : JSON.stringify(data.marketId),
        eventId : JSON.stringify(data.eventId),
        teamA : JSON.stringify(data.teamA),
        teamB : JSON.stringify(data.teamB),
        teamC : JSON.stringify(data.teamC),
        betFairSessionMaxBet : JSON.stringify(data.betFairSessionMaxBet),
        betFairSessionMinBet : JSON.stringify(data.betFairSessionMinBet),
        startAt : JSON.stringify(data.startAt),
        stopAt : JSON.stringify(data.stopAt),
        apiSessionActive : JSON.stringify(data.apiSessionActive),
        manualSessionActive : JSON.stringify(data.manualSessionActive),
        matchOdd : JSON.stringify(data.matchOdd),
        marketBookmaker : JSON.stringify(data.marketBookmaker),
        marketTiedMatch : JSON.stringify(data.marketTiedMatch)
    }
    let res =  await internalRedis
    .pipeline()
    .hset(matchKey,payload)
    .expire(matchKey, expiry)
    .exec();
    return res;
}


exports.updateMatchInCache = async (matchId,data) =>{
    let matchKey =`${matchId}_match`;
    let match = await internalRedis.hgetall(matchKey);
    let payload = {
        id : JSON.stringify(match.id),
        matchType : data.matchType || match.matchType,
        competitionId : data.competitionId || match.competitionId,
        competitionName : data.competitionName || match.competitionName,
        title : data.title || match.title,
        marketId : data.marketId || match.marketId,
        eventId : data.eventId || match.eventId,
        teamA : data.teamA || match.teamA,
        teamB : data.teamB || match.teamB, 
        teamC : data.teamC || match.teamC,
        betFairSessionMaxBet : data.betFairSessionMaxBet || match.betFairSessionMaxBet,
        betFairSessionMinBet : data.betFairSessionMinBet || match.betFairSessionMinBet,
        startAt : data.startAt || match.startAt,
        stopAt : data.stopAt || match.stopAt,
        apiSessionActive : data.apiSessionActive ?? match.apiSessionActive,
        manualSessionActive : data.manualSessionActive ?? match.manualSessionActive,
        matchOdd : JSON.stringify(data.matchOdd) || match.matchOdd,
        marketBookmaker : JSON.stringify(data.marketBookmaker) || match.marketBookmaker,
        marketTiedMatch : JSON.stringify(data.marketTiedMatch) || match.marketTiedMatch
    }
    return await internalRedis
    .pipeline()
    .hset(matchKey,payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.updateMatchKeyInCache = async(matchId,key,data) =>{
    let matchKey =`${matchId}_match`;
    // let match = await internalRedis.hget(matchKey,key);
    let payload = {
        [key] : JSON.stringify(data)
    }
    return await internalRedis
    .pipeline()
    .hset(matchKey, payload)
    .expire(matchKey, expiry)
    .exec();
}

exports.hasMatchInCache = async(matchId) =>{
    let matchKey =`${matchId}_match`;
    return await internalRedis.exists(matchKey);
}

exports.updateMatchExpiry =async (matchId) =>{
    let matchKey =`${matchId}_match`;

    return await internalRedis
    .expire(matchKey, expiry);
}