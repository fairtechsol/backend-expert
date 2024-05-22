
const { IsNull } = require("typeorm");
const { gameType } = require("../config/contants");
const { logger } = require("../config/logger");
const { commonGetMatchDetails, commonGetMatchDetailsForFootball } = require("../services/commonService");
const { getMatchSuperAdmin } = require("../services/matchService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");
const { getRacingMatchCountryList, getRacingMatch } = require("../services/racingMatchService");

exports.listMatchSuperAdmin = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;
    const filters = {};

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

exports.racingCountryCodeListSuperAdmin = async (req, res) => {
  try {
   
    const match = await getRacingMatchCountryList({ stopAt: IsNull() });
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
      error: `Error at list racing match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};

exports.listRacingMatchSuperAdmin = async (req, res) => {
  try {
    const { query } = req;
    const { fields } = query;

    const match = await getRacingMatch({ stopAt: IsNull() }, fields?.split(",") || null, query);
    if (!match) {
      return ErrorResponse({ statusCode: 400, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
    }
    
    const matchData = match?.matches?.reduce((acc, item) => {
      const venue = item?.venue;
      acc[venue] = acc[venue] || [];
      acc[venue].push(item);
      return acc;
    }, {});    

    return SuccessResponse(
      {
        statusCode: 200,
        message: { msg: "fetched", keys: { name: "Match list" } },
        data: matchData,
      },
      req,
      res
    );
  } catch (err) {
    logger.error({
      error: `Error at list match for the expert.`,
      stack: err.stack,
      message: err.message
    });
    // Handle any errors and return an error response
    return ErrorResponse(err, req, res);
  }
};