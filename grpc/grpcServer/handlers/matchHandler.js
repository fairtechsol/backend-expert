const grpc = require("@grpc/grpc-js");
const { __mf } = require("i18n");
const lodash = require("lodash");
const { logger } = require("../../../config/logger");
const { getMatchCompetitions, getMatchDates, getMatchByCompetitionIdAndDates, getMatchSuperAdmin, getMatchById } = require("../../../services/matchService");
const { sendMessageToUser } = require("../../../sockets/socketManager");
const { socketData, marketBettingTypeByBettingType, resultStatus, matchBettingType, betStatusType, betStatus } = require("../../../config/contants");
const { commonGetMatchDetails, commonGetRaceDetails } = require("../../../services/commonService");
const { getCardMatch } = require("../../../services/cardMatchService");
const { IsNull } = require("typeorm");
const { getMatchFromCache, getExpertsRedisKeyData, getAllSessionRedis, settingAllSessionMatchRedis, updateMultipleMarketSessionIdRedis, getSessionFromRedis, addAllsessionInRedis, hasMatchInCache, getMultipleMatchKey } = require("../../../services/redis/commonfunction");
const { getTournamentBetting, getTournamentRunners, getTournamentBettings } = require("../../../services/tournamentBettingService");
const { getExpertResult } = require("../../../services/expertResultService");
const { getRacingMatchCountryList } = require("../../../services/racingMatchService");
const { getBlinkingTabs } = require("../../../services/blinkingTabsService");
const { getSessionBettings, getSessionBettingById } = require("../../../services/sessionBettingService");

exports.getMatchCompetitionsByType = async (call) => {
    try {
        const { type } = call.request;

        const competitions = await getMatchCompetitions(type);

        return { data: JSON.stringify(competitions) };

    } catch (err) {
        logger.error({
            error: `Error at list competition for the user.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.getMatchDatesByCompetitionId = async (call) => {
    try {
        const { type } = call.request;

        const dates = await getMatchDates(type);

        return { data: JSON.stringify(dates) }
    } catch (err) {
        logger.error({
            error: `Error at list date for the user.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.getMatchDatesByCompetitionIdAndDate = async (call) => {
    try {
        const { date, type } = call.request;

        const matches = await getMatchByCompetitionIdAndDates(type, date);

        return { data: JSON.stringify(matches) }
    } catch (err) {
        logger.error({
            error: `Error at list match for the user.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.sendUpdateDeleteReason = async (call) => {
    try {
        const { betIds, matchId, deleteReason } = call.request;

        sendMessageToUser(socketData.expertRoomSocket,
            socketData.updateDeleteReason, {
            betIds: betIds,
            deleteReason: deleteReason,
            matchId: matchId
        });
        return {}
    } catch (error) {
        logger.error({
            error: `Error at sending update delete reason.`,
            stack: error.stack,
            message: error.message,
        });
        throw {
            code: grpc.status.INTERNAL,
            message: error?.message || __mf("internalServerError"),
        };

    }
}

exports.matchDetailsHandler = async (call) => {
    try {
        const { matchId } = call.request;
        let match;

        // splitting match ids to check if user asking for multiple match or single
        const matchIds = matchId?.split(",");
        if (matchIds?.length > 1) {
            match = [];
            for (let i = 0; i < matchIds?.length; i++) {
                match.push(await commonGetMatchDetails(matchIds[i]));
            }
        } else {
            match = await commonGetMatchDetails(matchId);
        }

        return { data: JSON.stringify(match) }
    } catch (err) {
        logger.error({
            error: `Error while getting match detail for match: ${call.request.matchId}.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.raceDetails = async (call) => {
    try {
        const { matchId: raceId } = call.request;
        let race = [];

        const raceIds = raceId?.split(",");

        for (let i = 0; i < raceIds?.length; i++) {
            race.push(await commonGetRaceDetails(raceIds[i]));
        }

        return { data: JSON.stringify(raceIds.length == 1 ? race[0] : race) };
    } catch (err) {
        logger.error({
            error: `Error while getting match detail for match: ${call.request.matchId}.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.cardDetails = async (call) => {
    try {
        const { type } = call.request;

        let casinoDetails = await getCardMatch({ type: type });

        return { data: JSON.stringify(casinoDetails), }
    } catch (err) {
        logger.error({
            error: `Error while getting card detail for match: ${type}.`,
            stack: err.stack,
            message: err.message,
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.listMatchSuperAdmin = async (call) => {
    try {
        let { query } = call.request;
        query = JSON.parse(query || "{}");
        const { fields } = query;
        const filters = {};

        const match = await getMatchSuperAdmin(filters, fields?.split(",") || null, query);

        if (!match) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", {
                    name: "Match",
                }),
            };
        }

        return { data: JSON.stringify(match) }
    } catch (err) {
        logger.error({
            error: `Error at get match list for user or wallet.`,
            stack: err.stack,
            message: err.message
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.listRacingMatchSuperAdmin = async (call) => {
    try {
        let { query } = call.request;
        query = JSON.parse(query || "{}");
        const { fields } = query;

        const match = await getRacingMatch({ stopAt: IsNull() }, fields?.split(",") || null, query);
        if (!match) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", {
                    name: "Match",
                }),
            };
        }

        const matchData = match?.matches?.reduce((acc, item) => {
            const venue = item?.venue;
            acc[venue] = acc[venue] || [];
            acc[venue].push(item);
            return acc;
        }, {});

        return { data: JSON.stringify(matchData) }

    } catch (err) {
        logger.error({
            error: `Error at list match for the expert.`,
            stack: err.stack,
            message: err.message
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.getTournamentBettingDetails = async (call) => {
    try {
        const { matchId, type = matchBettingType.tournament, id, isRate } = call.request;
        let matchBetting, matchDetails, runners;
        matchDetails = await getMatchFromCache(matchId);
        if (!matchDetails) {
            matchDetails = await getMatchById(matchId);
        }
        if (!matchDetails || lodash.isEmpty(matchDetails)) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", {
                    name: "Match Betting",
                }),
            }
        }
        let match = {
            id: matchDetails.id,
            eventId: matchDetails.eventId,
            startAt: matchDetails.startAt,
            title: matchDetails.title,
            matchType: matchDetails.matchType,
            stopAt: matchDetails.stopAt,
            betPlaceStartBefore: matchDetails?.betPlaceStartBefore,
            rateThan100: matchDetails?.rateThan100
        };

        matchBetting = matchDetails[marketBettingTypeByBettingType[type]];
        // fetch third party api for market rate
        let response;
        if (id) {
            if (!matchBetting) {
                matchBetting = await getTournamentBetting({
                    id: id
                });
            }
            else {
                matchBetting = matchBetting?.find((item) => item?.id == id);
            }

            runners = matchBetting?.runners;

            if (!runners) {
                runners = await getTournamentRunners({
                    bettingId: matchBetting?.id
                });
            }


            response = {
                match: match,
                matchBetting: matchBetting,
                runners: runners?.sort((a, b) => a.sortPriority - b.sortPriority)
            };
            if (isRate) {
                response.teamRates = JSON.parse((await getExpertsRedisKeyData(`${matchBetting?.parentBetId || id}_profitLoss_${matchId}`)) || "{}")
            }

            if (matchBetting.activeStatus != betStatus.result) {
                let expertResults = await getExpertResult({ betId: id });

                if (expertResults?.length != 0) {
                    if (expertResults?.length == 1) {
                        matchBetting.resultStatus = resultStatus.pending;
                    } else {
                        matchBetting.resultStatus = resultStatus.missMatched;
                    }
                }
            }
        }
        else {
            if (!matchBetting) {
                matchBetting = await getTournamentBettings({
                    matchId: matchId
                });
            }

            response = {
                match: match,
                matchBetting: matchBetting
            };
        }
        return { data: JSON.stringify(response) }
    } catch (error) {
        logger.error({
            error: `Error at get list match betting.`,
            stack: error.stack,
            message: error.message,
        });
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.racingCountryCodeListSuperAdmin = async (call) => {
    try {
        const { matchType } = call.request;

        const match = await getRacingMatchCountryList({ stopAt: IsNull(), ...(matchType ? { matchType: matchType } : {}) });

        return { data: JSON.stringify(match) }
    } catch (err) {
        logger.error({
            error: `Error at list racing match for the expert.`,
            stack: err.stack,
            message: err.message
        });
        // Handle any errors and return an error response
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.getBlinkingTabsData = async () => {
    try {
        let blinkingTabs = await getBlinkingTabs();
        return { data: JSON.stringify(blinkingTabs) }
    } catch (error) {
        logger.error({
            error: `Error at the getting the blinking tabs.`,
            stack: error.stack,
            message: error.message
        });

        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
}

exports.getSessions = async (call) => {
    try {
        const { matchId, id: sessionId } = call.request;
        let session;

        if (!sessionId) {
            const redisMatchData = await getAllSessionRedis(matchId);

            if (redisMatchData) {
                session = Object.values(redisMatchData);
            } else {
                session = await getSessionBettings({ matchId, activeStatus: betStatusType.live });
                if (!session) {
                    throw {
                        code: grpc.status.NOT_FOUND,
                        message: __mf("notFound", { name: "Session" }),
                    };
                }
                let result = {};
                let apiSelectionIdObj = {};
                for (let index = 0; index < session?.length; index++) {
                    if (session[index]?.activeStatus == betStatusType.live) {
                        if (session?.[index]?.selectionId) {
                            apiSelectionIdObj[session?.[index]?.selectionId] = session?.[index]?.id;
                        }
                        result[session?.[index]?.id] = JSON.stringify(session?.[index]);
                    }
                    session[index] = JSON.stringify(session?.[index]);
                }
                settingAllSessionMatchRedis(matchId, result);
                updateMultipleMarketSessionIdRedis(matchId, apiSelectionIdObj);
            }
        } else {
            const redisMatchData = await getSessionFromRedis(matchId, sessionId);
            let expertResults = await getExpertResult({ betId: sessionId });

            if (redisMatchData) {
                session = redisMatchData;
            } else {
                session = await getSessionBettingById(sessionId);
                if (!session) {
                    throw {
                        code: grpc.status.NOT_FOUND,
                        message: __mf("notFound", { name: "Session" }),
                    };
                }
                addAllsessionInRedis(matchId, null);
            }

            const isMatch = await hasMatchInCache(matchId);
            let match;
            if (isMatch) {
                match = await getMultipleMatchKey(matchId);
                match = {
                    apiSessionActive: JSON.parse(match?.apiSessionActive),
                    manualSessionActive: JSON.parse(match?.manualSessionActive),
                    marketId: match?.marketId,
                    stopAt: match?.stopAt,
                };


            } else {
                match = await getMatchById(matchId, [
                    "apiSessionActive",
                    "manualSessionActive",
                    "marketId",
                    "stopAt",
                ]);
            }

            if (expertResults?.length != 0 && !(session.activeStatus == betStatus.result)) {
                if (expertResults?.length == 1) {
                    session.resultStatus = resultStatus.pending;
                }
                else {
                    session.resultStatus = resultStatus.missMatched;
                }

            }

            session = { ...session, ...match };
        }

        return { data: JSON.stringify(session) }
    } catch (error) {
        logger.error({
            error: `Error at get list session.`,
            stack: error.stack,
            message: error.message,
        });
        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};
