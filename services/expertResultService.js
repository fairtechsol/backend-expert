const { AppDataSource } = require("../config/postGresConnection");
const expertResultSchema = require("../models/expertResult.entity");
const expertResultRepo = AppDataSource.getRepository(expertResultSchema);



exports.getExpertResult=async (where,select)=>{
    return await expertResultRepo.findOne({
        where:  where,
        select: select,
      })
}

exports.addExpertResult = async (body)=>{
    let expertResult = await expertResultRepo.save(body);
    return expertResult;
}