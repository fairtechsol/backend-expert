const { redisKeys } = require("../config/contants");
const { logger } = require("../config/logger");
const { getNotification, addNotification, addBanner } = require("../services/generalService");
const { setExternalRedisKey, getExternalRedisKey } = require("../services/redis/commonfunction");
const { ErrorResponse, SuccessResponse } = require("../utils/response");

exports.addNotification = async (req, res) => {
    try {
        const { value } = req.body;
        const { id: userId } = req.user;
        const data = await addNotification(value, userId);
        await setExternalRedisKey(redisKeys.notification, value);
        return SuccessResponse(
            {
                statusCode: 200,
                message: { msg: "updated", keys: { name: "Notification" } },
                data
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the add the notification.`,
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

exports.getNotification = async (req, res) => {
    try {
        const type = req.query.type || "notification";

        let notification = await getExternalRedisKey(type);
        if (!notification) {
            notification = await getNotification(type);
            await setExternalRedisKey(type, notification?.value);
        }

        return SuccessResponse(
            {
                statusCode: 200,
                data: notification
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the getting the notification.`,
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

exports.addBannerData = async (req, res) => {
    try {
        const { value, type } = req.body;
        const { id: userId } = req.user;
        const data = await addBanner(value, userId, type);
        await setExternalRedisKey(redisKeys.banner + type, value);
        return SuccessResponse(
            {
                statusCode: 200,
                message: { msg: "updated", keys: { name: "Banner" } },
                data
            },
            req,
            res
        );
    } catch (error) {
        logger.error({
            error: `Error at the add the banner.`,
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