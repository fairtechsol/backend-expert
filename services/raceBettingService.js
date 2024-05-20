const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const { IsNull } = require("typeorm");
const matchSchema = require("../models/racingBetting.entity");
// const { matchBettingType, betStatusType, manualMatchBettingType, gameType } = require("../config/contants");
const raceBetting = AppDataSource.getRepository(matchSchema);


exports.insertRaceBettings = async (data) => {
    await raceBetting.save(data)
    return data;
}

exports.getRaceBattingByMatchId = async (id, select) => {
    return await raceBetting.find({
      where:  {matchId : id},
      select: select,
    });
  };
  