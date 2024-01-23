const {
  getUserById,
  addUser,
  getUserByUserName,
  updateUser,
  getUser,
  getUsers,
} = require("../services/userService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const lodash = require("lodash");
const { forceLogoutIfLogin } = require("../services/commonService");
const internalRedis = require("../config/internalRedisConnection");
const { verifyToken } = require("../utils/authUtils");
const { logger } = require("../config/logger");
const { ILike } = require("typeorm");
const { loginCount} = require('../services/redis/commonfunction')

/**
 * Creates or updates a user based on the provided request data.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} - A Promise representing the asynchronous operation.
 */
exports.createUser = async (req, res) => {
  try {
    // Destructuring request body for relevant user information
    let {
      userName,
      fullName,
      password,
      phoneNumber,
      city,
      allPrivilege,
      addMatchPrivilege,
      betFairMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
      createBy
    } = req.body;
    
    userName = userName.toUpperCase();
    // Check if a user with the same username already exists
    let userExist = await getUserByUserName(userName);
    if (userExist){
      logger.error({
        error: `user exist for user id ${userExist?.id}`
      });
      return ErrorResponse(
        { statusCode: 400, message: { msg: "user.userExist" } },
        req,
        res
      );}

    // Hash the password using bcrypt
    password = await bcrypt.hash(password, 10);

    // Prepare user data for insertion
    let userData = {
      userName,
      fullName,
      password,
      phoneNumber,
      city,
      createBy,
      allPrivilege,
      addMatchPrivilege,
      betFairMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
    };

    // Add the user to the database
    let insertUser = await addUser(userData);

    // Omit the password field from the response
    let response = lodash.omit(insertUser, ["password"]);

    // Send success response with the created user data
    return SuccessResponse(
      {
        statusCode: 200,
        message: {
          msg: "created",
          keys: {
            name: "User",
          },
        },
        data: response,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at add user for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};


exports.getProfile = async (req, res) => {
  let reqUser = req.user || {};
  let userId = reqUser?.id;
  if (req.query?.userId) {
    userId = req.query.userId;
  }

  let user = await getUserById(userId);
  let response = lodash.omit(user, ["password"]);
  return SuccessResponse(
    { statusCode: 200, message: { msg: "user.profile" }, data: response },
    req,
    res
  );
};


exports.updateUser = async (req, res) => {
  try {
    // Destructuring request body for relevant user information
    let {
      fullName,
      phoneNumber,
      city,
      createBy,
      allPrivilege,
      addMatchPrivilege,
      betFairMatchPrivilege,
      bookmakerMatchPrivilege,
      sessionMatchPrivilege,
      id,
    } = req.body;

      const isUserPresent=await getUser({id : id,createBy:createBy},["id"]);

      if(!isUserPresent){
        return ErrorResponse(
          { statusCode: 404, message: { msg: "notFound",keys:{
            name:"User"
          } } },
          req,
          res
        );
      }
      let updateData =  {
        fullName  : fullName || isUserPresent.fullName,
        phoneNumber : phoneNumber || isUserPresent.phoneNumber,
        city : city || isUserPresent.city,
        allPrivilege : allPrivilege ?? isUserPresent.allPrivilege,
        addMatchPrivilege : addMatchPrivilege ?? isUserPresent.addMatchPrivilege,
        betFairMatchPrivilege : betFairMatchPrivilege ?? isUserPresent.betFairMatchPrivilege,
        bookmakerMatchPrivilege : bookmakerMatchPrivilege ?? isUserPresent.bookmakerMatchPrivilege,
        sessionMatchPrivilege : sessionMatchPrivilege ?? isUserPresent.sessionMatchPrivilege,
      }
     await updateUser(id, updateData);
     updateData["id"] = id
      // Send success response with the updated user data
      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "updated",
            keys: {
              name: "User",
            },
          },
          data : updateData
        },
        req,
        res
      );
    
  } catch (err) {
    logger.error({
      error: `Error at update user for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

// Check old password against the stored password
const checkOldPassword = async (userId, oldPassword) => {
  // Retrieve user's password from the database
  const user = await getUserById(userId, ["password"]);
  if (!user) {
    // User not found, return error response
    throw {
      msg: "notFound",
      keys: { name: "User" },
    };
  }
  // Compare old password with the stored password
  return bcrypt.compareSync(oldPassword, user.password);
};

const forceLogoutUser = async (userId, stopForceLogout) => {
  logger.info({ message: `logging out user ${userId}` });
  if (!stopForceLogout) {
    await forceLogoutIfLogin(userId);
  }
  await internalRedis.hdel(userId, "token");
};

// API endpoint for changing password
exports.changeSelfPassword = async (req, res, next) => {
  try {
    // Destructure request body
    const { oldPassword, newPassword } = req.body;

    // Hash the new password
    const password = bcrypt.hashSync(newPassword, 10);

    // Check if the old password is correct
    const userId = req.user.id;
    const isPasswordMatch = await checkOldPassword(userId, oldPassword);

    if (!isPasswordMatch) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: { msg: "auth.invalidPass", keys: { type: "old" } },
        },
        req,
        res
      );
    }

    // Update only the password if conditions are not met
    await updateUser(userId, { loginAt: new Date(), password });
    await forceLogoutUser(userId);

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "auth.passwordChanged" },
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at change password for self.`,
      stack: error.stack,
      message: error.message
    });
    // Log any errors that occur
    return ErrorResponse(
      {
        statusCode: 500,
        message: error.message,
      },
      req,
      res
    );
  }
};


exports.changePassword = async (req, res, next) => {
  try {
    // Destructure request body
    let { password,id,createBy} = req.body;

    let user = await getUser({id : id,createBy:createBy},["id"]);
    if(!user){
      return ErrorResponse(
        { statusCode: 404, message: { msg: "notFound",keys:{
          name:"User"
        } } },
        req,
        res
      );
    }
    // Hash the new password
    password = bcrypt.hashSync(password, 10);

    // Update only the password if conditions are not met
    await updateUser(id, { loginAt:null, password });
    await forceLogoutUser(id);

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "auth.passwordChanged" },
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at change password for expert.`,
      stack: error.stack,
      message: error.message
    });
    // Log any errors that occur
    return ErrorResponse(
      {
        statusCode: 500,
        message: error.message,
      },
      req,
      res
    );
  }
};


exports.expertList = async (req, res, next) => {
  try {
    let { searchBy,keyword, loginId, offset, limit } = req.query
    
if(!loginId){
  return ErrorResponse(
    {
      statusCode: 403,
      message: {msg:"auth.unauthorize"},
    },
    req,
    res
  );
}


    let where = {
      createBy: loginId
    }
    if (searchBy) where[searchBy] = ILike(`%${keyword}%`);

    
    let users = await getUsers(
      where,
      [
        "id",
        "createBy",
        "createdAt",
        "userName",
        "fullName",
        "phoneNumber",
        "city",
        "allPrivilege",
        "addMatchPrivilege",
        "betFairMatchPrivilege",
        "bookmakerMatchPrivilege",
        "sessionMatchPrivilege",
        "userBlock"
      ],
      offset,
      limit
    );

    let response = {
      count: 0,
      list: []
    }
    if (!users[1]) {
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "fetched" , keys : { name : "User list"} },
          data: response,
        },
        req,
        res
      );
    }
    response.count = users[1]


    

    response.list = users[0];
    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched" , keys : { name : "Expert list"}},
        data: response,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at get expert list.`,
      stack: error.stack,
      message: error.message
    });
    return ErrorResponse(error, req, res);
  }
}

exports.totalLoginCount = async (req, res) => {
  try {
    let totalCount = await loginCount("loginUserCount");

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Total login count" } },
        data: totalCount,
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at get login count.`,
      stack: error.stack,
      message: error.message
    });
    return ErrorResponse(error, req, res);
  }

}

exports.lockUnlockUser = async (req, res) => {
  try {
    const { userId, userBlock, blockBy } = req.body;

    const user = await getUserById(userId)

    if (!user) {
      throw {
        msg: "notFound",
        keys: { name: "User" },
      };
    } else {
      if (user.userBlock == userBlock) {
        throw new Error("user.cannotUpdate");
      }
      if (userBlock == true) {
        await updateUser(user.id, { userBlock, blockBy })
        await forceLogoutUser(user.id);
      } else {
        if (user?.blockBy != blockBy) {
          return ErrorResponse(
            {
              statusCode: 403,
              message: { msg: "user.blockCantAccess" },
            },
            req,
            res
          );
        }
        await updateUser(user.id, { userBlock, blockBy })
      }
    }

    return SuccessResponse(
      { statusCode: 200, message: { msg: "user.lock/unlockSuccessfully" } },
      req,
      res
    );
  } catch (error) {
    return ErrorResponse(error, req, res);

  }
}