const internalRedis = require("../config/internalRedisConnection");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByUserName } = require("../services/userService");
const { userLoginAtUpdate } = require("../services/authService");
const { forceLogoutIfLogin } = require("../services/commonService");
const { logger } = require("../config/logger");
const { jwtSecret } = require("../config/contants");
const { setExpertsRedisData, getExpertsRedisData, setLoginVal } = require("../services/redis/commonfunction");
const { getBetsLoginData } = require("../grpc/grpcClient/handlers/wallet/betsHandler");

// Function to validate a user by username and password
const validateUser = async (userName, password) => {
  // Find user by username and select specific fields
  const user = await getUserByUserName(userName);

  // Check if the user is found
  if (user) {
    // Check if the provided password matches the hashed password in the database
    if (bcrypt.compareSync(password, user.password)) {
      // If the passwords match, create a result object without the password field
      const { password, ...result } = user;
      return result;
    }

    // If the passwords don't match, return an error object
    throw {
      error: true,
      message: { msg: "auth.invalidPass", keys: { type: "user" } },
      statusCode: 403,
    };
  }

  // If the user is not found, return null
  return null;
};

const setBetDataRedis = async () => {
  let data = await getExpertsRedisData();
  if (!data) {
    let result = await getBetsLoginData()
      .catch(async (err) => {
        logger.error({
          error: `Error at setting redis data at expert side`,
          stack: err.stack,
          message: err.message,
        });
        throw err;
      });
    await setExpertsRedisData({ isLogin: true });
    await setLoginVal(result);
  }
}

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const userName = req.body.userName;
    const user = await validateUser(userName, password);

    if (!user) {
      logger.error({
        error: `Error at the login for the expert. User not found for user: ${userName}.`,
      });
      return ErrorResponse(
        {
          statusCode: 404,
          message: {
            msg: "notFound",
            keys: { name: "User" },
          },
        },
        req,
        res
      );
    } else if (user.userBlock) {
      return ErrorResponse(
        {
          statusCode: 403,
          message: {
            msg: "user.blocked",
          },
        },
        req,
        res
      );
    }
    // force logout user if already login on another device
    await forceLogoutIfLogin(user.id);
    await setBetDataRedis();
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userName: user.userName },
      jwtSecret
    );

    // checking transition password
    const forceChangePassword = !Boolean(user.loginAt);

    if (!forceChangePassword) {
      userLoginAtUpdate(user.id);
    }

    // setting token in redis for checking if user already loggedin
    await internalRedis.hmset(user.id, {
      token: token,
      allPrivilege: user.allPrivilege,
      addMatchPrivilege: user.addMatchPrivilege,
      betFairMatchPrivilege: user.betFairMatchPrivilege,
      bookmakerMatchPrivilege: user.bookmakerMatchPrivilege,
      sessionMatchPrivilege: user.sessionMatchPrivilege,
    });

    // Return token and user information

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "auth.loginSuccess" },
        data: {
          token,
          forceChangePassword,
          allPrivilege: user.allPrivilege,
          addMatchPrivilege: user.addMatchPrivilege,
          betFairMatchPrivilege: user.betFairMatchPrivilege,
          bookmakerMatchPrivilege: user.bookmakerMatchPrivilege,
          sessionMatchPrivilege: user.sessionMatchPrivilege,
        },
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at the login for the expert.`,
      stack: error.stack,
      message: error.message
    });

    return ErrorResponse(
      {
        statusCode: error.statusCode || 500,
        message: error.message,
      },
      req,
      res
    );
  }
};

// Function to handle user logout
exports.logout = async (req, res) => {
  try {
    // Get the user from the request object
    const user = req.user;

    // Remove the user's token from Redis using their ID as the key
    await internalRedis.del(user.id);

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "auth.logoutSuccess" },
      },
      req,
      res
    );
  } catch (error) {
    logger.error({
      error: `Error at the logout for the expert.`,
      stack: error.stack,
      message: error.message
    });
    // If an error occurs during the logout process, return an error response
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
