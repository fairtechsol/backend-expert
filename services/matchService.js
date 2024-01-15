const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const { IsNull } = require("typeorm");
const matchSchema = require("../models/match.entity");
const { matchBettingType, betStatusType } = require("../config/contants");
const match = AppDataSource.getRepository(matchSchema);


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


exports.getMatch = async (filters, select, query) => {
  try {
    // Start building the query
    let matchQuery = new ApiFeature(
      match
        .createQueryBuilder()
        .select(select)
        .where(filters)
        .leftJoinAndSelect(
          "match.matchBettings",
          "matchBetting"
        )
        .orderBy("match.startAt", "DESC"),
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
          stopAt: IsNull(),
        })
        .leftJoinAndMapMany(
          "match.matchOdds",
          "match.matchBettings",
          "matchOdds",
          "matchOdds.type = :type",
          {
            type: matchBettingType.matchOdd,
          }
        )
        .leftJoinAndMapMany(
          "match.isBookmaker",
          "match.matchBettings",
          "isBookmaker",
          "isBookmaker.isActive = true AND isBookmaker.type IN (:...types)",
          {
            types: [
              matchBettingType.bookmaker,
              matchBettingType.quickbookmaker1,
              matchBettingType.quickbookmaker2,
              matchBettingType.quickbookmaker3,
            ]
          }
        )
        .select(select)
        .orderBy("match.startAt", "DESC"),
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
    throw error;
  }
};

exports.getMatchWithBettingAndSession = async (
  allPrivilege,
  addMatchPrivilege,
  bookmakerMatchPrivilege,
  sessionMatchPrivilege
) => {
  try {
    // Start building the query
    let matchQuery = match
      .createQueryBuilder()
      ;
    if (bookmakerMatchPrivilege || allPrivilege || addMatchPrivilege) {
      matchQuery = matchQuery
        .leftJoinAndMapMany(
          "match.bookmakers",
          "match.matchBettings",
          "bookmakers",
          "bookmakers.type IN (:...types)",
          {
            types: [
              matchBettingType.quickbookmaker1,
              matchBettingType.quickbookmaker2,
              matchBettingType.quickbookmaker3,
              matchBettingType.tiedMatch2,
            ],
          }
        );
    }
    if (sessionMatchPrivilege || allPrivilege || addMatchPrivilege) {
      matchQuery = matchQuery
        .leftJoinAndMapMany(
          "match.sessions",
          "match.sessionBettings",
          "sessions",
          `sessions.isManual = true AND sessions.activeStatus <> '${betStatusType.result}'`
        );
    }

    matchQuery = matchQuery.select(["match.id", "match.title","match.teamA","match.teamB","match.teamC",]);

    if (sessionMatchPrivilege || allPrivilege || addMatchPrivilege) {
      matchQuery = matchQuery.addSelect(["sessions.id", "sessions.name"]);
    }
    if (bookmakerMatchPrivilege || allPrivilege || addMatchPrivilege) {
      matchQuery = matchQuery.addSelect(["bookmakers.id", "bookmakers.name", "bookmakers.type"]);
    }
    matchQuery = matchQuery.orderBy("match.startAt", "DESC").getManyAndCount();

    // Execute the query and get the result along with count
    const [matches, count] = await matchQuery;

    return { matches, count };
  } catch (error) {
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


  exports.getMatchCompetitions = async (type) => {
    return await match.query(
      'SELECT DISTINCT "competitionId", "competitionName" FROM matchs WHERE "matchType" = $1 AND "stopAt" IS NULL',
      [type]
    );
  };

  exports.getMatchDates = async (competitionId) => {
    return await match.query(
      'SELECT DISTINCT DATE_TRUNC(\'day\', "startAt") as startDate FROM matchs WHERE "competitionId" = $1 AND "stopAt" IS NULL',
      [competitionId]
    );
  };

  exports.getMatchByCompetitionIdAndDates = async (competitionId,date) => {
    return await match.query(
      `SELECT matchs.id, matchs.title, COUNT("matchOdds".id) > 0 AS "isTiedMatch" FROM matchs LEFT JOIN "matchBettings" "matchOdds" ON "matchOdds"."matchId"="matchs"."id" AND ( "matchOdds"."type" IN ('${matchBettingType.tiedMatch1}','${matchBettingType.tiedMatch2}') AND "matchOdds"."isActive"=true) WHERE matchs."competitionId" = $1 AND DATE_TRUNC(\'day\',matchs."startAt") = $2 AND matchs."stopAt" IS NULL Group by matchs.id`,
      [competitionId, new Date(date)]
    );
  };