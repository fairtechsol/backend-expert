const { AppDataSource } = require("../config/postGresConnection");
const racingBettingSchema = require("../models/racingBetting.entity");
const RunnerSchema = require("../models/matchRunner.entity");
const RacingBetting = AppDataSource.getRepository(racingBettingSchema);
const RacingRunner = AppDataSource.getRepository(RunnerSchema);
exports.addRunner = async (body) => {
  let runner = await RacingRunner.save(body);
  return runner;
};

exports.insertRunners = async (body) => {
  let runner = await RacingRunner.insert(body);
  return runner;
};

exports.insertRaceBettings = async (data) => {
  await RacingBetting.save(data)
  return data;
}


  
