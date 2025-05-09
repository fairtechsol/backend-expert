const { resultStatus } = require("../config/contants");
const { AppDataSource } = require("../config/postGresConnection");
const expertResultSchema = require("../models/expertResult.entity");
const expertResultRepo = AppDataSource.getRepository(expertResultSchema);

exports.getExpertResult=async (where,select)=>{
    return await expertResultRepo.find({
        where:  where,
        select: select,
      });
}

exports.getExpertResultSessionBetWise = async (where, select) => {
    return await expertResultRepo.createQueryBuilder().innerJoinAndMapOne("expertResult.betId", "sessionBetting", "sessionBetting", "sessionBetting.id = expertResult.betId")
    .where(where)
    .select(['expertResult.betId as "betId"','Count(expertResult.betId) as "totalResult"'])
    .addSelect(`CASE WHEN COUNT(expertResult.betId) = 1 THEN '${resultStatus.pending}' ELSE '${resultStatus.missMatched}' END`, "status")
    .groupBy("expertResult.betId")
    .getRawMany();
}
exports.getExpertResultTournamentBetWise = async (where, select) => {
    return await expertResultRepo.createQueryBuilder().innerJoinAndMapOne("expertResult.betId", "tournamentBetting", "tournamentBetting", "tournamentBetting.id = expertResult.betId")
    .where(where)
    .select(['expertResult.betId as "betId"','tournamentBetting.type as "type"','Count(expertResult.betId) as "totalResult"'])
    .addSelect(`CASE WHEN COUNT(expertResult.betId) = 1 THEN '${resultStatus.pending}' ELSE '${resultStatus.missMatched}' END`, "status")
    .groupBy("expertResult.betId")
    .addGroupBy("tournamentBetting.type")
    .getRawMany();
}

exports.addExpertResult = async (body)=>{
    let expertResult = await expertResultRepo.save(body);
    return expertResult;
}

exports.updateExpertResult = async (where,body)=>{
    let expertResult = await expertResultRepo.update(where,body);
    return expertResult;
}

exports.deleteExpertResult = async (betId,userId)=>{
    let expertResult = await expertResultRepo.delete({
        betId:betId,
        userId:userId
    });
    return expertResult;
}

exports.deleteAllExpertResult = async (betId)=>{
    let expertResult = await expertResultRepo.delete({
        betId:betId
    });
    return expertResult;
}

exports.deleteOldExpertResult = async (where) => {
    await expertResultRepo.delete(where);
  }