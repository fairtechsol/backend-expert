const { AppDataSource } = require("../config/postGresConnection");
const racingMatchSchema = require("../models/racingMatch.entity");
const ApiFeature = require("../utils/apiFeatures");
const racingMatch = AppDataSource.getRepository(racingMatchSchema);


exports.getRaceByMarketId = async (marketId, select) => {
  return await racingMatch.findOne({
    where: { marketId },
    select: select,
  });
};

exports.raceAddMatch = async (body) => {
  let insertMatch = await racingMatch.save(body);
  return insertMatch;
};

exports.deleteRace = async (where) => {
  await race.delete(where);
  }
  
