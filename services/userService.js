const { AppDataSource } = require("../config/postGresConnection");
const userSchema = require("../models/user.entity");
const user = AppDataSource.getRepository(userSchema);
const { ILike } = require("typeorm");

// id is required and select is optional parameter is an type or array

exports.getUserById = async (id, select) => {
  return await user.findOne({
    where: { id },
    select: select,
  });
};

exports.addUser = async (body) => {
  let insertUser = await user.save(body);
  return insertUser;
};

exports.updateUser = async (id, body) => {
  let updateUser = await user.update(id, body);
  return updateUser;
};


exports.getUserByUserName = async (userName, select) => {
  return await user.findOne({
    where: { userName: ILike(userName) },
    select: select,
  });
};


exports.getUser = async (where = {}, select) => {
  //find list with filter and pagination
  return await user.findOne({
    where: where,
    select: select
  });

};


exports.getUsers = async (where, select, offset, limit, relations) => {
  //find list with filter and pagination
  
  return await user.findAndCount({
    where: where,
    select: select,
    skip: offset,
    take: limit,
    relations: relations
  });

};
