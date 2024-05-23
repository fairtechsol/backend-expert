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