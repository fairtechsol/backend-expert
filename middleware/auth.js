const { verifyToken, getUserDataFromRedis } = require("../utils/authUtils");
const { ErrorResponse } = require("../utils/response");

exports.isAuthenticate = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return ErrorResponse(
        {
          statusCode: 401,
          message: {
            msg: "auth.unauthorize",
          },
        },
        req,
        res
      );
    }

    const token = authorization?.split(" ")[1];

    if (token) {
      const decodedUser = verifyToken(token);
      if (!decodedUser) {
        return ErrorResponse(
          {
            statusCode: 400,
            message: {
              msg: "notFound",
              keys: { name: "User" },
            },
          },
          req,
          res
        );
      }
      const {token:redisUserToken,...userData} = await getUserDataFromRedis(decodedUser.id);
      if (redisUserToken != token) {
        return ErrorResponse(
          {
            statusCode: 401,
            message: {
              msg: "auth.unauthorize",
            },
          },
          req,
          res
        );
      }

      const userPrivilegeData={}
      Object.keys(userData)?.map((item)=>userPrivilegeData[item]=JSON.parse(userData[item]))

      req.user = { ...decodedUser, ...userPrivilegeData };
      next();
    }
  } catch (err) {
    return ErrorResponse(
      {
        statusCode: 401,
        message: {
          msg: "auth.unauthorize",
        },
      },
      req,
      res
    );
  }
};
