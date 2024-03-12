const { betStatusType } = require("../config/contants");
const { AppDataSource } = require("../config/postGresConnection");

// betting
const sessionBettingSchema = require("../models/sessionBetting.entity");
const SessionBetting = AppDataSource.getRepository(sessionBettingSchema);

exports.addSessionBetting = async (body) => {
  let addSessionBetting = await SessionBetting.save(body);
  return addSessionBetting;
};

exports.getSessionBettingById = async (id, select) => {
    return await SessionBetting.findOne({
      where:  {id : id},
      select: select,
    });
  };

exports.getSessionBetting = async (where, select) => {
  return await SessionBetting.findOne({
    where:  where,
    select: select,
  });
};

exports.getSessionBettings = async (where, select) => {
  return await SessionBetting.find({
    where:  where,
    select: select,
  });
};

exports.getSessionBattingByMatchId = async (id, where = {}, select) => {
  return await SessionBetting.createQueryBuilder()
  .leftJoinAndMapOne("sessionBetting.resultData", "result", "resultData", "resultData.betId = sessionBetting.id")
  .where({
    matchId: id,
    ...where
  })
  .select(select)
  .getMany();
};

exports.insertSessionBettings = async (data) =>{
  let insertSessionBettings  = await SessionBetting.insert(data)
  return insertSessionBettings;
}

exports.updateSessionBetting = async (where, body) => {
  let updateSessionBetting = await SessionBetting.update(where, body);
  return updateSessionBetting;
};