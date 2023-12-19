const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { sendMessageToUser } = require("../sockets/socketManager");

exports.forceLogoutIfLogin = async (userId) => {
  logger.info({ message: `Force logout user: ${userId} if already login.` });

  let token = await internalRedis.hget(userId, "token");

  if (token) {
    // function to force logout
    sendMessageToUser(userId, "logoutUserForce", null);
  }
};

  
  class ColumnNumericTransformer {
    to(data) {
        return data;
    }
    from(data) {
        if (data && data != 'NaN') return parseFloat(data).toFixed(2);
        return 0;
    }
}

exports.ColumnNumericTransformer = ColumnNumericTransformer;