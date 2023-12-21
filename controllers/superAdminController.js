
const { logger } = require("../config/logger");
const { getMatchSuperAdmin } = require("../services/matchService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");

exports.listMatchSuperAdmin = async (req, res) => {
    try {
  
      const { query } = req;
      const { fields } = query;
      const filters = {};
  
      
      //   let userRedisData = await internalRedis.hgetall(user.userId);
      const match = await getMatchSuperAdmin(filters, fields?.split(",") || null, query);
      if (!match) {
        return ErrorResponse(
          {
            statusCode: 400,
            message: {
              msg: "notFound",
              keys: {
                name: "Match",
              },
            },
          },
          req,
          res
        );
      }
  
      return SuccessResponse(
        {
          statusCode: 200,
          message: { msg: "fetched", keys: { name: "Match list" } },
          data: match,
        },
        req,
        res
      );
    } catch (err) {
      logger.error({
        error: `Error at get match list for user or wallet.`,
        stack: err.stack,
        message: err.message
      });
      // Handle any errors and return an error response
      return ErrorResponse(err, req, res);
    }
  };