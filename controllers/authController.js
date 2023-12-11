const internalRedis = require("../config/internalRedisConnection");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserByUserName } = require("../services/userService");
const { userLoginAtUpdate } = require("../services/authService");
const { forceLogoutIfLogin } = require("../services/commonService");

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

exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const userName = req.body.userName.trim();
    const user = await validateUser(userName, password);

    if (!user) {
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
    }

    // force logout user if already login on another device
    await forceLogoutIfLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userName: user.userName },
      process.env.JWT_SECRET || "secret"
    );

    // checking transition password
    const forceChangePassword = !Boolean(user.loginAt);

    if (!forceChangePassword) {
      userLoginAtUpdate(user.id);
    }
    // setting token in redis for checking if user already loggedin
    await internalRedis.hmset(user.id, { token: token });

    // Return token and user information

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "auth.loginSuccess" },
        data: {
          token,
          forceChangePassword,
        },
      },
      req,
      res
    );
  } catch (error) {
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

    // If the user is an expert, remove their ID from the "expertLoginIds" set in Redis
    await internalRedis.srem("expertLoginIds", user.id);

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
