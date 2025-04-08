const grpc = require("@grpc/grpc-js");
const { __mf } = require("i18n");
const { logger } = require("../../../config/logger");
const { getUserByUserName, addUser, getUser, updateUser, getUsers, getUserById } = require("../../../services/userService");
const bcrypt = require("bcryptjs");
const { addDataInRedis } = require("../../../services/redis/commonfunction");
const { forceLogoutIfLogin } = require("../../../services/commonService");
const internalRedis = require("../../../config/internalRedisConnection");
const { ILike } = require("typeorm");
const { getNotification } = require("../../../services/generalService");

exports.createUser = async (call) => {
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
            remark
        } = call.request;

        userName = userName.toUpperCase();
        // Check if a user with the same username already exists
        let userExist = await getUserByUserName(userName);
        if (userExist) {
            logger.error({
                error: `user exist for user id ${userExist?.id}`
            });
            throw {
                code: grpc.status.ALREADY_EXISTS,
                message: __mf("user.userExist"),
            };

        }

        // Hash the password using bcrypt
        password = await bcrypt.hash(password, 10);

        // Prepare user data for insertion
        let userData = {
            userName,
            fullName,
            password,
            phoneNumber,
            city,
            createBy,
            allPrivilege,
            addMatchPrivilege,
            betFairMatchPrivilege,
            bookmakerMatchPrivilege,
            sessionMatchPrivilege,
            remark
        };

        await addUser(userData);

        // Send success response with the created user data
        return {};
    } catch (err) {
        logger.error({
            error: `Error at add user for the expert.`,
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

exports.updateUserHandler = async (call) => {
    try {
        // Destructuring request body for relevant user information
        let {
            fullName,
            phoneNumber,
            city,
            createBy,
            allPrivilege,
            addMatchPrivilege,
            betFairMatchPrivilege,
            bookmakerMatchPrivilege,
            sessionMatchPrivilege,
            id,
            remark
        } = call.request;

        const isUserPresent = await getUser({ id: id, createBy: createBy });

        if (!isUserPresent) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", { name: "User" }),
            };

        }
        let updateData = {
            fullName: fullName || isUserPresent.fullName,
            phoneNumber: phoneNumber || isUserPresent.phoneNumber,
            city: city || isUserPresent.city,
            allPrivilege: allPrivilege ?? isUserPresent.allPrivilege,
            addMatchPrivilege: addMatchPrivilege ?? isUserPresent.addMatchPrivilege,
            betFairMatchPrivilege: betFairMatchPrivilege ?? isUserPresent.betFairMatchPrivilege,
            bookmakerMatchPrivilege: bookmakerMatchPrivilege ?? isUserPresent.bookmakerMatchPrivilege,
            sessionMatchPrivilege: sessionMatchPrivilege ?? isUserPresent.sessionMatchPrivilege,
            remark: remark ?? isUserPresent.remark
        }
        await updateUser(id, updateData);
        updateData["id"] = id
        const privilegeObject = {
            allPrivilege: updateData.allPrivilege,
            addMatchPrivilege: updateData.addMatchPrivilege,
            betFairMatchPrivilege: updateData.betFairMatchPrivilege,
            bookmakerMatchPrivilege: updateData.bookmakerMatchPrivilege,
            sessionMatchPrivilege: updateData.sessionMatchPrivilege,
        }
        await addDataInRedis(id, privilegeObject)


        // Send success response with the updated user data
        return {}

    } catch (err) {
        logger.error({
            error: `Error at update user for the expert.`,
            stack: err.stack,
            message: err.message
        });

        throw {
            code: grpc.status.INTERNAL,
            message: err?.message || __mf("internalServerError"),
        };
    }
};

exports.changePassword = async (call) => {
    try {
        // Destructure request body
        let { password, id, createBy } = call.request;

        let user = await getUser({ id: id, createBy: createBy }, ["id"]);
        if (!user) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", { name: "User" }),
            };

        }
        // Hash the new password
        password = bcrypt.hashSync(password, 10);

        // Update only the password if conditions are not met
        await updateUser(id, { loginAt: null, password });
        await forceLogoutIfLogin(id);
        await internalRedis.hdel(id, "token");

        return {}
    } catch (error) {
        logger.error({
            error: `Error at change password for expert.`,
            stack: error.stack,
            message: error.message
        });
        // Log any errors that occur
        throw {
            code: grpc.status.INTERNAL,
            message: error?.message || __mf("internalServerError"),
        };
    }
};

exports.expertList = async (call) => {
    try {
        let { searchBy, keyword, loginId, offset, limit } = call.request;

        if (!loginId) {
            throw {
                code: grpc.status.UNAUTHENTICATED,
                message: __mf("auth.unauthorize"),
            };

        }

        let where = { createBy: loginId }
        if (searchBy) where[searchBy] = ILike(`%${keyword}%`);
        let users = await getUsers(
            where,
            ["id",
                "createBy",
                "createdAt",
                "userName",
                "fullName",
                "phoneNumber",
                "city",
                "allPrivilege",
                "addMatchPrivilege",
                "betFairMatchPrivilege",
                "bookmakerMatchPrivilege",
                "sessionMatchPrivilege",
                "userBlock"
            ],
            offset - 1,
            limit
        );

        let response = {
            count: 0,
            list: []
        }
        if (!users[1]) {
            return { data: JSON.stringify(response) };
        }
        response.count = users[1];

        response.list = users[0];
        return { data: JSON.stringify(response) };

    } catch (error) {
        logger.error({
            error: `Error at get expert list.`,
            stack: error.stack,
            message: error.message
        });
        throw {
            code: grpc.status.INTERNAL,
            message: error?.message || __mf("internalServerError"),
        };
    }
}


exports.lockUnlockUser = async (call) => {
    try {
        const { userId, userBlock, blockBy } = call.request;

        const user = await getUserById(userId)

        if (!user) {
            throw {
                code: grpc.status.NOT_FOUND,
                message: __mf("notFound", { name: "User" }),
            };
        } else {
            if (user.userBlock == userBlock) {
                throw {
                    code: grpc.status.ALREADY_EXISTS,
                    message: __mf("user.cannotUpdate"),
                }
            }
            if (userBlock == true) {
                await updateUser(user.id, { userBlock, blockBy })
                await forceLogoutIfLogin(id);
                await internalRedis.hdel(id, "token");
            } else {
                if (user?.blockBy != blockBy) {
                    throw {
                        code: grpc.status.PERMISSION_DENIED,
                        message: __mf("user.blockCantAccess"),
                    };

                }
                await updateUser(user.id, { userBlock, blockBy })
            }
        }

        return {};
    } catch (error) {
        throw {
            code: grpc.status.INTERNAL,
            message: error?.message || __mf("internalServerError"),
        };
    }
}

exports.getNotificationHandler = async (call) => {
    try {
        let notification = await getNotification(JSON.parse(call?.request?.query || "{}")?.type);
        return { data: JSON.stringify(notification) };
    } catch (error) {
        logger.error({
            error: `Error at the getting the notification.`,
            stack: error.stack,
            message: error.message
        });

        throw {
            code: grpc.status.INTERNAL,
            message: error?.message || __mf("internalServerError"),
        };
    }
}


exports.isUserExist = async (call) => {
    let { userName } = call.request;

    const isUserExist = await getUserByUserName(userName);

    return { isUserExist: Boolean(isUserExist) };
}