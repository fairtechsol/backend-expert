const grpc = require("@grpc/grpc-js");
const { __mf } = require("i18n");
const { logger } = require("../../../config/logger");
const { getUserByUserName, addUser } = require("../../../services/userService");
const bcrypt = require("bcryptjs");

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