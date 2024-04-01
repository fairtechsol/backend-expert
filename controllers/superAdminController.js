
const { gameType } = require("../config/contants");
const { logger } = require("../config/logger");
const { commonGetMatchDetails, commonGetMatchDetailsForFootball } = require("../services/commonService");
const { getMatchSuperAdmin } = require("../services/matchService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");

exports.listMatchSuperAdmin = async (req, res) => {
    try {
  
      const { query } = req;
      const { fields } = query;
      const filters = {};
  
      
      //   let userRedisData = await internalRedis.hgetall(user.userId);
      const match = await getMatchSuperAdmin(filters, fields?.split(",") || null, query);

      for (let i = 0; i < match?.matches?.length; i++) {
        match?.matches[i]?.matchType == gameType.cricket ? await commonGetMatchDetails(match.matches[i].id) : await commonGetMatchDetailsForFootball(match.matches[i].id);
      }

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