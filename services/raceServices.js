const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const { IsNull } = require("typeorm");
const matchSchema = require("../models/racingMatch.entity");
// const { matchBettingType, betStatusType, manualMatchBettingType, gameType } = require("../config/contants");
const race = AppDataSource.getRepository(matchSchema);


exports.getRaceByMarketId = async (marketId, select) => {
    return await race.findOne({
      where: { marketId },
      select: select,
    });
  };


  exports.raceAddMatch = async (body) => {
    let insertMatch = await race.save(body);
    return insertMatch;
  };
  