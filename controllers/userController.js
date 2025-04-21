const {
  getUserById,
  updateUser,
} = require("../services/userService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const lodash = require("lodash");
const { forceLogoutIfLogin } = require("../services/commonService");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { loginCount } = require('../services/redis/commonfunction');

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
    req, res);
};


// Check old password against the stored password
const checkOldPassword = async (userId, oldPassword) => {
  // Retrieve user's password from the database
  const user = await getUserById(userId, ["password"]);
  if (!user) {
    // User not found, return error response
    throw { msg: "notFound", keys: { name: "User" } };
  }
  // Compare old password with the stored password
  return bcrypt.compareSync(oldPassword, user.password);
};

const forceLogoutUser = async (userId, stopForceLogout) => {
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
      return ErrorResponse({
        statusCode: 403,
        message: { msg: "auth.invalidPass", keys: { type: "old" } },
      }, req, res);
    }

    // Update only the password if conditions are not met
    await updateUser(userId, { loginAt: new Date(), password });
    await forceLogoutUser(userId);

    return SuccessResponse({
      statusCode: 200,
      message: { msg: "auth.passwordChanged" },
    }, req, res);
  } catch (error) {
    logger.error({
      error: `Error at change password for self.`,
      stack: error.stack,
      message: error.message
    });
    // Log any errors that occur
    return ErrorResponse({
      statusCode: 500,
      message: error.message,
    }, req, res);
  }
};




exports.totalLoginCount = async (req, res) => {
  try {
    let totalCount = await loginCount("loginUserCount");

    return SuccessResponse({
      statusCode: 200,
      message: { msg: "fetched", keys: { name: "Total login count" } },
      data: totalCount,
    }, req, res);
  } catch (error) {
    logger.error({
      error: `Error at get login count.`,
      stack: error.stack,
      message: error.message
    });
    return ErrorResponse(error, req, res);
  }
}


exports.checkOldPasswordData = async (req, res) => {
  try {
    const { id } = req.user;
    const { oldPassword } = req.body;
    let isOldPassword = await checkOldPassword(id, oldPassword);

    return SuccessResponse({ statusCode: 200, data: { isPasswordMatch: isOldPassword } }, req, res);

  } catch (error) {
    logger.error({ message: "Error in checking old password.", stack: error?.stack, context: error?.message });
    return ErrorResponse(error, req, res);
  }
}
