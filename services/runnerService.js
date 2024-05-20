const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const { IsNull } = require("typeorm");
const matchSchema = require("../models/matchRunner.entity");
// const { matchBettingType, betStatusType, manualMatchBettingType, gameType } = require("../config/contants");
const race = AppDataSource.getRepository(matchSchema);


exports.addRunner = async (body) => {
    let runner = await race.save(body);
    return runner;
  };
