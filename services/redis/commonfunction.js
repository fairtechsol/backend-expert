const internalRedis = require("../../config/internalRedisConnection");
const { getMatchById } = require("../matchService");

let expiry = 3600;
exports.addMatchInCache = async (matchId,data) =>{
    let matchKey =`${matchId}_match`;
    let payload = {
        id: data.id,
        matchType : data.matchType,
        competitionId : data.competitionId,
        competitionName : data.competitionName,
        title : data.title,
        marketId : data.marketId,
        eventId : data.eventId,
        teamA : data.teamA,
        teamB : data.teamB,
        betFairSessionMaxBet : data.betFairSessionMaxBet,
        betFairSessionMinBet : data.betFairSessionMinBet,
        startAt : data.startAt,
        apiSessionActive : data.apiSessionActive,
        manualSessionActive : data.manualSessionActive,
        matchOdd : JSON.stringify(data.matchOdd),
        marketBookmaker : JSON.stringify(data.marketBookmaker),
        marketTiedMatch : JSON.stringify(data.marketTiedMatch)
    }
    if(data.teamC){
        payload.teamC = data.teamC;
    }
    if(data.stopAt){
        payload.stopAt = stopAt;
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
        id : match.id,
        matchType : data.matchType || match.matchType,
        competitionId : data.competitionId || match.competitionId,
        competitionName : data.competitionName || match.competitionName,
        title : data.title || match.title,
        marketId : data.marketId || match.marketId,
        eventId : data.eventId || match.eventId,
        teamA : data.teamA || match.teamA,
        teamB : data.teamB || match.teamB,
        betFairSessionMaxBet : data.betFairSessionMaxBet || match.betFairSessionMaxBet,
        betFairSessionMinBet : data.betFairSessionMinBet || match.betFairSessionMinBet,
        startAt : data.startAt || match.startAt,
        apiSessionActive : data.apiSessionActive ?? match.apiSessionActive,
        manualSessionActive : data.manualSessionActive ?? match.manualSessionActive,
        matchOdd : JSON.stringify(data.matchOdd) || match.matchOdd,
        marketBookmaker : JSON.stringify(data.marketBookmaker) || match.marketBookmaker,
        marketTiedMatch : JSON.stringify(data.marketTiedMatch) || match.marketTiedMatch
    }
    if(data.teamC || match.teamC){
        payload.teamC = data.teamC || match.teamC;
    }
    if(data.stopAt || match.stopAt){
        payload.stopAt = data.stopAt || match.stopAt;
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
        [key] : data
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

exports.getMatchFromCache = async(matchId) =>{
    let matchKey =`${matchId}_match`;
    return await internalRedis.hgetall(matchKey);
}