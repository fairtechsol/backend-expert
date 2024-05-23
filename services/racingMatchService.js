const { AppDataSource } = require("../config/postGresConnection");
const racingMatchSchema = require("../models/racingMatch.entity");
const ApiFeature = require("../utils/apiFeatures");
const RacingMatch = AppDataSource.getRepository(racingMatchSchema);

exports.getRacingMatchCountryList = async (where, date) => {
    let matchQuery = RacingMatch
        .createQueryBuilder()
        .where(where)
        .select([`racingMatch.countryCode as "countryCode"`])
        .groupBy("racingMatch.countryCode")
        .addOrderBy("racingMatch.countryCode")
    if (date) {
        matchQuery.andWhere(`DATE_TRUNC('day',"racingMatch"."startAt") = :date`)
            .setParameters({ date: new Date(date) })
            .addGroupBy(`DATE_TRUNC('day',"racingMatch"."startAt")`)
    }
    return matchQuery.getRawMany()
};

exports.getRacingMatchDateList = async (where, page, limit) => {
    let matchQuery = RacingMatch
        .createQueryBuilder()
        .where(where)
        .select([`DATE_TRUNC('day', "racingMatch"."startAt") as date`])
        .orderBy(`DATE_TRUNC('day', "racingMatch"."startAt")`, "DESC")
        .groupBy(`DATE_TRUNC('day', "racingMatch"."startAt")`)

    if (page) {
        matchQuery.offset((parseInt(page) - 1) * parseInt(limit || 10)).limit(parseInt(limit || 10))
    }
    return matchQuery.getRawMany()
};

exports.getRacingMatch = async (filters, select, query) => {
    // Start building the query
    let matchQuery = new ApiFeature(
        RacingMatch
            .createQueryBuilder()
            .where(filters)
            .select(select),
        query
    )
        .search()
        .filter()
        .sort()
        // .paginate()
        .getResult();
    // Execute the query and get the result along with count
    const [matches, count] = await matchQuery;

    return { matches, count };
};

exports.getRaceByMarketId = async (condition, select) => {
    return await RacingMatch.findOne({
        where: condition,
        select: select,
    });
};

exports.raceAddMatch = async (body) => {
    let insertMatch = await RacingMatch.save(body);
    return insertMatch;
};

exports.deleteRace = async (where) => {
    await RacingMatch.delete(where);
}

exports.getRacingMatchById = async (id, select) => {
    return await RacingMatch.findOne({
        where: { id },
        select: select,
    });
};


