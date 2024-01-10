const { AppDataSource } = require("../config/postGresConnection");
const resultSchema = require("../models/result.entity");
const resultRepo = AppDataSource.getRepository(resultSchema);


exports.getResult=async (where,select)=>{
    return await resultRepo.findOne({
        where:  where,
        select: select,
      })
}

exports.addResult = async (body)=>{
    let expertResult = await resultRepo.save(body);
    return expertResult;
}