const { AppDataSource } = require("../config/postGresConnection");
const ApiFeature = require("../utils/apiFeatures");
const { IsNull } = require("typeorm");
const matchSchema = require("../models/match.entity");
const RaceSchema = require("../models/racingMatch.entity");
const { matchBettingType, betStatusType, manualMatchBettingType, gameType } = require("../config/contants");
const match = AppDataSource.getRepository(matchSchema);
const race = AppDataSource.getRepository(RaceSchema);

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

exports.getOneMatchByCondition = (where, select) => {
  return match.findOne({ where, select });
}

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
        .leftJoinAndSelect(
          "match.matchBettings",
          "matchBetting"
        )
        .where(filters)
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
  sessionMatchPrivilege,
  matchType
) => {
  try {
    // Start building the query
    let matchQuery = match
      .createQueryBuilder().where({ stopAt: IsNull(), ...(matchType ? { matchType: matchType } : { matchType: gameType.cricket }) });
    if (bookmakerMatchPrivilege || allPrivilege || addMatchPrivilege) {
      matchQuery = matchQuery
        .leftJoinAndMapMany(
          "match.bookmakers",
          "match.matchBettings",
          "bookmakers",
          "bookmakers.type IN (:...types)",
          {
            types: manualMatchBettingType,
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

    matchQuery = matchQuery.select(["match.id", "match.title", "match.teamA", "match.teamB", "match.teamC", "match.betFairSessionMaxBet", "match.betFairSessionMinBet", "match.matchType"]);

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
    where: { id: id },
    select: select,
    relations: {
      matchBettings: true,
      sessionBettings: true,
      tournamentBettings: {
        runners:true
      }
    }
  });
};

exports.getRaceDetails = async (where) => {
  try {
    // Start building the query
    let matchQuery =await race
      .createQueryBuilder("race")
      .leftJoinAndMapOne("race.matchOdd", "racingBetting","matchOdd","race.id = matchOdd.matchId")
      .leftJoinAndMapMany("race.runners", "racingRunner", "runners", "race.id = runners.matchId")
      .where(where ).getOne();
    return  matchQuery;
  } catch (error) {
    throw error;
  }
};



exports.getMatchCompetitions = async (type) => {
  return await match.query(
    'SELECT DISTINCT "competitionId", "competitionName" FROM matchs WHERE "matchType" = $1 AND "stopAt" IS NULL order By "competitionName" ASC',
    [type]
  );
};

exports.getMatchDates = async (competitionId) => {
  return await match.query(
    'SELECT DISTINCT DATE_TRUNC(\'day\', "startAt") as startDate FROM matchs WHERE "competitionId" = $1 AND "stopAt" IS NULL order by startDate',
    [competitionId]
  );
};

exports.getMatchByCompetitionIdAndDates = async (competitionId, date) => {
  return await match.createQueryBuilder()
    .leftJoinAndMapMany('match.matchBetting', 'matchBetting', 'matchBetting', 'match.id = matchBetting.matchId AND matchBetting.isActive = true AND matchBetting.type not in (:...type)')
    .select(["match.id", "match.title", "matchBetting.id", "matchBetting.name", "matchBetting.type"])
    .where({ competitionId: competitionId, stopAt: IsNull() })
    .andWhere('DATE_TRUNC(\'day\',match."startAt") = :date')
    .setParameters({ "date": new Date(date), type: [...manualMatchBettingType, ...[matchBettingType.bookmaker, matchBettingType.completeMatch]] })
    .getMany();
};