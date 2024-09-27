const { AppDataSource } = require("../config/postGresConnection");
const racingBettingSchema = require("../models/racingBetting.entity");
const runnerSchema = require("../models/matchRunner.entity");
const RacingBetting = AppDataSource.getRepository(racingBettingSchema);
const RacingRunner = AppDataSource.getRepository(runnerSchema);

exports.insertRunners = async (body) => {
  let runner = await RacingRunner.save(body);
  return runner;
};

exports.insertRaceBettings = async (data) => {
  await RacingBetting.save(data)
  return data;
}

exports.getRaceBettingWithRunners = async (where, select) => {
  return await RacingBetting.createQueryBuilder()
    .leftJoinAndMapMany("racingBetting.runners",
      "racingRunner",
      "racingRunner",
      "racingRunner.bettingId = racingBetting.id",)
    .where(where)
    .select(select)
    .getMany();
};

exports.updateRaceBetting = async (where, data) => {
  await RacingBetting.update(where, data);
};

exports.getRacingBetting = async (where, select) => {
  return await RacingBetting.findOne({
      where: where,
      select: select,
  });
};

exports.getRacingBettings = async (where, select) => {
  return await RacingBetting.find({
      where: where,
      select: select,
  });
};

exports.getRacingBettingById = async (id, select) => {
  return await RacingBetting.findOne({
    where: { id: id },
    select: select,
  });
};

exports.addRaceBetting= async (body)=>{
  let addRaceBetting = await RacingBetting.save(body);
  return addRaceBetting;
};

exports.getRunners = async (where, select) => {
  return await RacingRunner.find({
      where: where,
      select: select,
  });
};