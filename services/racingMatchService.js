const { AppDataSource } = require("../config/postGresConnection");
const racingMatchSchema = require("../models/racingMatch.entity");
const ApiFeature = require("../utils/apiFeatures");
const RacingMatch = AppDataSource.getRepository(racingMatchSchema);


exports.getRaceByMarketId = async (condition, select) => {
  return await RacingMatch.findOne({
    where: condition,
    select: select,
  });
};

exports.raceAddMatch = async (body) => {
  let insertMatch = await RacingMatch.save(body);
  return insertMatch;
};

exports.deleteRace = async (where) => {
  await RacingMatch.delete(where);
  }
  
