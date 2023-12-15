const { AppDataSource } = require("../config/postGresConnection");
const matchSchema = require("../models/match.entity");
const match = AppDataSource.getRepository(matchSchema);

// bookmaker
const bookmakerSchema = require("../models/matchBetting.entity");
const bookmaker = AppDataSource.getRepository(bookmakerSchema);

exports.getMatchById = async (id, select) => {
  return await match.findOne({
    where: { id },
    select: select,
  });
};

exports.updateMatch = async (id, body) => {
  let updateMatch = await match.update(id, body);
  return updateMatch;
};

exports.getMatchByMarketId = async (marketId, select) => {
  return await match.findOne({
    where: { marketId },
    select: select,
  });
};

exports.addMatch = async (body) => {
  let insertMatch = await match.save(body);
  return insertMatch;
};

