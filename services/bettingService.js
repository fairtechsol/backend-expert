const { AppDataSource } = require("../config/postGresConnection");

// betting
const bettingSchema = require("../models/betting.entity");
const betting = AppDataSource.getRepository(bettingSchema);

exports.addBetting = async (body) => {
  let insertBetting = await betting.save(body);
  return insertBetting;
};

exports.getBetting = async (where, select) => {
  return await betting.findOne({
    where:  where,
    select: select,
  });
};
