const { logger } = require("../config/logger");
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

exports.getMatchAllBettings = async (where, select) => {
  return await MatchBetting.find({
    where:  where,
    select: select,
  });
};

exports.getMatchBattingByMatchId = async (id, select) => {
  return await MatchBetting.find({
    where:  {matchId : id},
    select: select,
  });
};


exports.insertMatchBettings = async (data) =>{
  let insertMatchBettings  = await MatchBetting.insert(data)
  return insertMatchBettings;
}

exports.updateMatchBetting = async (where, body) => {
  let updateMatchBetting = await MatchBetting.update(where, body);
  return updateMatchBetting;
};

exports.updateMatchBettingById = async (id, body) => {
  let updateMatchBetting = await MatchBetting.update(id, body);
  return updateMatchBetting;
};

exports.getMatchBettingWithMatchDetails = async (where) => {
  console.log(where);
  return await MatchBetting.findOne({
    where:  where,
    relations: ["match"]
  });
}

exports.getMatchBettingById = async (id) => {
  let MatchBettings = await MatchBetting.findOne({
    where:  {id : id}
  });
  return MatchBettings;
};