const { AppDataSource } = require("../config/postGresConnection");
const tournamentBettingSchema = require("../models/tournamentBetting.entity");
const runnerSchema = require("../models/tournamentRunner.entity");
const TournamentBetting = AppDataSource.getRepository(tournamentBettingSchema);
const TournamentRunner = AppDataSource.getRepository(runnerSchema);

exports.insertTournamentRunners = async (body) => {
  let runner = await TournamentRunner.insert(body);
  return runner;
};

exports.insertTournamentBettings = async (data) => {
    let result = await TournamentBetting.save(data)
    return result;
}

exports.getTournamentBettingWithRunners = async (where, select) => {
  return await TournamentBetting.createQueryBuilder()
    .leftJoinAndMapMany("tournamentBetting.runners",
      "tournamentRunner",
      "tournamentRunner",
      "tournamentRunner.bettingId = tournamentBetting.id",)
    .where(where)
    .select(select)
    .getMany();
};

exports.updateTournamentBetting = async (where, data) => {
  await TournamentBetting.update(where, data);
};

exports.getTournamentBetting = async (where, select) => {
  return await TournamentBetting.findOne({
      where: where,
      select: select,
  });
};

exports.getTournamentBettings = async (where, select) => {
  return await TournamentBetting.find({
      where: where,
      select: select,
      relations: {
          runners: true
      }
  });
};

exports.getTournamentBettingById = async (id, select) => {
  return await TournamentBetting.findOne({
    where: { id: id },
    select: select,
  });
};

exports.addTournamentBetting= async (body)=>{
  let addTournamentBetting = await TournamentBetting.save(body);
  return addTournamentBetting;
};

exports.getTournamentRunners = async (where, select) => {
  return await TournamentRunner.find({
      where: where,
      select: select,
  });
};