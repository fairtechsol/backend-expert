const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const matchSchema = require("../models/match.entity");
const match = AppDataSource.getRepository(matchSchema);

// bookmaker
const bookmakerSchema = require("../models/matchBetting.entity");
const { userRoleConstant, matchBettingType } = require("../config/contants");
const { IsNull } = require("typeorm");
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

exports.getBookMakerById = async (id, select) => {
  return await bookmaker.findOne({
    where: { id },
    select: select,
  });
};

exports.updateBookmaker = async (id, body) => {
  let updateBookmaker = await bookmaker.update(id, body);
  return updateBookmaker;
};
exports.addBookmaker = async (body) => {
  let insertBookmaker = await bookmaker.save(body);
  return insertBookmaker;
};

exports.getMatch = async (filters, select, query) => {
  try {
    // Start building the query
    let matchQuery = new ApiFeature(
      match
        .createQueryBuilder()
        .where(filters)
        .orderBy("match.startAt", "DESC")
        .leftJoinAndSelect(
          "match.matchBettings",
          "matchBetting"
        )
        .select(select),
      query
    )
      .search()
      .filter()
      .sort()
      .paginate()
      .getResult();
    // Execute the query and get the result along with count
    const [matches, count] = await matchQuery;

    return { matches, count };
  } catch (error) {
    console.log(error);
    throw error;
  }
};


exports.getMatchSuperAdmin = async (filters, select, query) => {
  try {
    // Start building the query
    let matchQuery = new ApiFeature(
      match
        .createQueryBuilder()
        .where(filters)
        .andWhere({
            stopAt:IsNull()
        })
        .orderBy("match.startAt", "DESC")
        .leftJoinAndSelect(
          "match.matchBettings",
          "matchBetting",
          "matchBetting.type = :type",
          {
            type: matchBettingType.matchOdd,
          }
        )
        .select(select),
      query
    )
      .search()
      .filter()
      .sort()
      .paginate()
      .getResult();
    // Execute the query and get the result along with count
    const [matches, count] = await matchQuery;

    return { matches, count };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
exports.getMatchDetails = async (id, select) => {
    return await match.findOne({
      where: { id:id },
      select: select,
      relations: {
        matchBettings: true,
        sessionBettings: true
      }
    });
  };

exports.getMatchDetails
