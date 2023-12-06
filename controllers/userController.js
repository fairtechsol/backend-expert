const {
  getUserById,
  addUser,
  getUserByUserName,
  updateUser,
} = require("../services/userService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const lodash = require("lodash");
const { forceLogoutIfLogin } = require("../services/commonService");
const internalRedis = require("../config/internalRedisConnection");
const { verifyToken } = require("../utils/authUtils");

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
      createBy,
      id,
    } = req.body;

    const isUserPresent=await getUserById(id,["id"]);

    if(!isUserPresent){
      return ErrorResponse(
        { statusCode: 404, message: { msg: "notFound",keys:{
          name:"User"
        } } },
        req,
        res
      );
    }

    // If user ID is provided, update the existing user
    if (id) {
     await updateUser(id, {
        fullName,
        phoneNumber,
        city,
        allPrivilege,
        addMatchPrivilege,
        betFairMatchPrivilege,
        bookmakerMatchPrivilege,
        sessionMatchPrivilege,
      });
      // Send success response with the updated user data
      return SuccessResponse(
        {
          statusCode: 200,
          message: {
            msg: "updated",
            keys: {
              name: "User",
            },
          }
        },
        req,
        res
      );
    }

    // Verify the token and get the user ID
    const userId = verifyToken(createBy);

    // If token is invalid, return an error response
    if (!userId) {
      return ErrorResponse(
        { statusCode: 403, message: { msg: "invalidData" } },
        req,
        res
      );
    }

    // Check if a user with the same username already exists
    let userExist = await getUserByUserName(userName);
    if (userExist){
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
      createBy: userId?.id,
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
  if (!stopForceLogout) {
    await forceLogoutIfLogin(userId);
  }
  await internalRedis.hdel(userId, "token");
};

// API endpoint for changing password
exports.changePassword = async (req, res, next) => {
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
