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
        .select(select)
        .where(where)
        .leftJoinAndMapOne("result.betId", "result.betId", "sessionBettings", "result.betId = sessionBettings.id").getMany();
    return data;
}

exports.addResult = async (body)=>{
    let expertResult = await resultRepo.save(body);
    return expertResult;
}


exports.deleteResult = async (betId)=>{
    await resultRepo.delete({betId:betId});
}