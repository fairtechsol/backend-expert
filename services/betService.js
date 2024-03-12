const { AppDataSource } = require("../config/postGresConnection");
const resultSchema = require("../models/result.entity");
const resultRepo = AppDataSource.getRepository(resultSchema);


exports.getResult=async (where,select)=>{
    return await resultRepo.findOne({
        where:  where,
        select: select,
      });
}

exports.getSpecificResultsSession = async (where, select) => {
    let data = await resultRepo.createQueryBuilder()
    .leftJoinAndMapOne("result.betId", "sessionBettings", "sessionBettings", "result.betId = sessionBettings.id")
    .where(where)
    .select(select)
    .getMany()
    return data;
}

exports.getAllProfitLossResults = async (matchId) => {
    let data = await resultRepo.createQueryBuilder()
        .where({
            matchId: matchId
        })
        .select([
            'SUM(ROUND(result."profitLoss"::numeric, 2)) AS "totalProfitLoss"',
            `SUM(
                CASE
                  WHEN "betType"='session' THEN ROUND(result."profitLoss"::numeric, 2)
                  ELSE 0 
                END
              ) AS "sessionTotalProfitLoss"`,
              'SUM(ROUND(result."commission"::numeric, 2)) AS "commission"'
        ]).addSelect('result."matchId"', "matchId")
        .groupBy('result."matchId"')
        .getRawMany();

    return data;
}

exports.addResult = async (body)=>{
    let expertResult = await resultRepo.save(body);
    return expertResult;
}


exports.deleteResult = async (betId)=>{
    await resultRepo.delete({betId:betId});
}