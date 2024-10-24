const { logger } = require("../config/logger");
const { getBlinkingTabs, getBlinkingTab, addBlinkingTabs, removeBlinkingTabs, updateBlinkingTabs } = require("../services/blinkingTabsService");
const { getMatchById } = require("../services/matchService");
const { ErrorResponse, SuccessResponse } = require("../utils/response");

exports.addBlinkingTabsData = async (req, res) => {
    try {
        const { matchId, matchName, matchType, order, id } = req.body;
        const { id: userId } = req.user;
        const match = await getMatchById(matchId);
        if (!match) {
            logger.error({ message: `Match not found by id ${matchId}` });
            return ErrorResponse({ statusCode: 400, message: { msg: "notFound", keys: { name: "Match" } } }, req, res);
        }

        if (id) {
            const blinkingTab = await getBlinkingTab({ id: id }, ["id"]);
            if (!blinkingTab) {
                logger.error({ message: `Blinking tab not found by id ${matchId}` });
                return ErrorResponse({ statusCode: 400, message: { msg: "notFound", keys: { name: "Blinking tabs" } } }, req, res);
            }
            await updateBlinkingTabs({ id: id }, { order: order })
        }
        else{

        const blinkingTab = await getBlinkingTab({ matchId: matchId }, ["id"]);

        if (blinkingTab) {
            logger.error({ message: `Match already exist ${matchId}` });
            return ErrorResponse({ statusCode: 400, message: { msg: "alreadyExist", keys: { name: "Match" } } }, req, res);

        }
        await addBlinkingTabs({ createBy: userId, matchId: matchId, matchName: matchName, matchType: matchType, order: order });}
        return SuccessResponse(
            {
                statusCode: 200,
                message: { msg: id ? "updated" : "created", keys: { name: "Match blinking tab" } }
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the add blinking tabs.`,
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

exports.getBlinkingTabsData = async (req, res) => {
    try {
        let blinkingTabs = await getBlinkingTabs();
        return SuccessResponse(
            {
                statusCode: 200,
                data: blinkingTabs
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the getting the blinking tabs.`,
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
}

exports.removeBlinkingTabsData = async (req, res) => {
    try {
        const { id } = req.params;
        await removeBlinkingTabs({ id: id });
        return SuccessResponse(
            {
                statusCode: 200,
                message: { msg: "delete", keys: { name: "Match blinking tab" } },
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the deleting the blinking tabs.`,
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
}