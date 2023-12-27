const { socketData } = require("../config/contants");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { sendMessageToUser } = require("../sockets/socketManager");

exports.forceLogoutIfLogin = async (userId) => {
  logger.info({ message: `Force logout user: ${userId} if already login.` });

  let token = await internalRedis.hget(userId, "token");

  if (token) {
    // function to force logout
    sendMessageToUser(userId, socketData.logoutUserForceEvent, {});
  }
};

