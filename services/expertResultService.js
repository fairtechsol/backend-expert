const { AppDataSource } = require("../config/postGresConnection");
const expertResultSchema = require("../models/expertResult.entity");
const expertResultRepo = AppDataSource.getRepository(expertResultSchema);



exports.getExpertResult=async (where,select)=>{
    return await expertResultRepo.find({
        where:  where,
        select: select,
      })
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