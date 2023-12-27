const { logger } = require("../config/logger");
const { getMatchBetting, getMatchAllBettings } = require("../services/matchBettingService");
const { getAllBettingRedis, getBettingFromRedis, addAllMatchBetting } = require("../services/redis/commonfunction");
const { ErrorResponse, SuccessResponse } = require("../utils/response");


exports.getMatchBetting = async (req, res) => {
    try {
        const { matchId } = req.params;
        const { id: matchBetId, type } = req.query;
        let matchBetting;

        if (!matchBetId && !type) {
            const redisMatchData = await getAllBettingRedis(matchId);

            if (redisMatchData) {
                matchBetting = Object.values(redisMatchData).map(item => JSON.parse(item));
            } else {
                matchBetting = await getMatchAllBettings({ matchId });
                if (!matchBetting) {
                    return ErrorResponse(
                        {
                            statusCode: 404,
                            message: { msg: "notFound", keys: { name: "Match Betting" } },
                        },
                        req,
                        res
                    );
                }
                addAllMatchBetting(matchId, matchBetting);
            }
        } else {
            if (!matchBetId || !type) {
                return ErrorResponse({ statusCode: 404, message: { msg: "required", keys: { name: "Match Betting id and type" } } }, req, res);
            }
            const redisMatchData = await getBettingFromRedis(matchId, type);

            if (redisMatchData) {
                matchBetting = redisMatchData;
            } else {
                matchBetting = await getMatchBetting({ id: matchBetId });
                if (!matchBetting) {
                    return ErrorResponse(

                        {
                            statusCode: 404,
                            message: { msg: "notFound", keys: { name: "Match betting" } },
                        },
                        req,
                        res
                    );
                }
                addAllMatchBetting(matchId,null);
            }
        }

        return SuccessResponse(
            {
                statusCode: 200,
                message: {
                    msg: "success",
                    keys: {
                        name: "Session",
                    },
                },
                data: matchBetting,
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at get list match betting.`,
            stack: error.stack,
            message: error.message,
        });
        return ErrorResponse(error, req, res);
    }
}
