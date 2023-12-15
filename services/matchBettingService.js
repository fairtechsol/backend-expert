const { AppDataSource } = require("../config/postGresConnection");

// betting
const matchBettingSchema = require("../models/matchBetting.entity");
const MatchBetting = AppDataSource.getRepository(matchBettingSchema);

exports.addMatchBetting = async (body) => {
  let addMatchBetting = await MatchBetting.save(body);
  return addMatchBetting;
};

exports.getMatchBetting = async (where, select) => {
  return await MatchBetting.findOne({
    where:  where,
    select: select,
  });
};

exports.insertMatchBettings = async (data) =>{
  let insertMatchBettings  = await MatchBetting.insert(data)
  return insertMatchBettings;
}