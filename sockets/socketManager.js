const socketIO = require("socket.io");
const { verifyToken, getUserTokenFromRedis } = require("../utils/authUtils");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { userRoleConstant, socketData } = require("../config/contants");
const { getSessionFromRedis, getBettingFromRedis, updateBettingMatchRedis, updateSessionMatchRedis,addAllsessionInRedis,addAllMatchBetting } = require("../services/redis/commonfunction");
const { updateMatchBettingById } = require("../services/matchBettingService");
const {  UpdateMatchBettingRateInSocket } = require("../validators/matchBettingValidator");
const { jsonValidator } = require("../middleware/joi.validator");
const { updateSessionBetting } = require("../services/sessionBettingService");
const { UpdateSessionRateInSocket } = require("../validators/sessionValidator");

let io;
/**
 * Handles a new socket connection.
 * @param {object} client - The socket client object representing the connection.
 */
const handleConnection = async (client) => {
  try {
    // Extract the token from the client's handshake headers or auth object
    const token =
      client.handshake.headers.authorization || client.handshake.auth.token;

    // If no token is provided, disconnect the client
    if (!token) {
      client.disconnect();
      return;
    }

    // Verify the token to get user information
    const decodedUser = verifyToken(token);

    // If the token is invalid, disconnect the client
    if (!decodedUser) {
      client.disconnect();
      return;
    }

    // Extract user ID and role from the decoded user object
    const { id: userId, roleName } = decodedUser;

    if (roleName == userRoleConstant.user) {
      const userCount = parseInt(await internalRedis.get("loginUserCount"));

      // If the user is a regular user, manage user login count
      const incrementCount = async () => {
        const count = await internalRedis.incr("loginUserCount");
        io.to("expertUserCountRoom").emit("loginUserCount", { count });
      };

      // Increment and emit the login user count if greater than 0; otherwise, set it to 1
      if (userCount > 0) {
        incrementCount();
      } else {
        internalRedis.set("loginUserCount", 1);
        io.to("expertUserCountRoom").emit("loginUserCount", { count: 1 });
      }
      return;
    }

    // Retrieve the user's token from Redis
    const userTokenRedis = await getUserTokenFromRedis(userId);

    // If the token doesn't match the one stored in Redis, disconnect the client
    if (userTokenRedis !== token) {
      client.disconnect();
      return;
    }

    // Join the room with the user's ID
    client.join(userId);

    // Handle additional logic based on the user's role
    // If the user is an expert, add their ID to the "expertLoginIds" set and join the room
    // internalRedis.sadd("expertLoginIds", userId);
    client.join(socketData.expertRoomSocket);

  } catch (err) {
    // Handle any errors by disconnecting the client
    logger.error({
      error: `Error at socket connection.`,
      stack: err.stack,
      message: err.message
    });
    client.disconnect();
  }
};

/**
 * Handles a disconnect socket connection.
 * @param {object} client - The socket client object representing the connection.
 */
const handleDisconnect = async (client) => {
  try {
    // Extract the token from the client's handshake headers or auth object
    const token =
      client.handshake.headers.authorization || client.handshake.auth.token;

    // If no token is provided, disconnect the client
    if (!token) {
      return;
    }

    // Verify the token to get user information
    const decodedUser = verifyToken(token);

    // If the token is invalid, disconnect the client
    if (!decodedUser) {
      return;
    }

    // Extract user ID and role from the decoded user object
    const { id: userId, roleName } = decodedUser;


    if (roleName == userRoleConstant.user) {
      const userCount = parseInt(await internalRedis.get("loginUserCount"));
      // If the user is a regular user, manage user login count
      const decrementCount = async () => {
        const userCount = await internalRedis.decr("loginUserCount");
        io.to("expertUserCountRoom").emit("loginUserCount", {
          count: userCount,
        });
      };

      // Decrement and emit the login user count if greater than 0; otherwise, set it to 0
      userCount > 0 ? decrementCount() : internalRedis.set("loginUserCount", 0);



      return;
    }

    // Leave the room with the user's ID
    client.leaveAll();

    // Handle additional logic based on the user's role
    // If the user is an expert, remove their ID from the "expertLoginIds" set
    // internalRedis.srem("expertLoginIds", userId);

  } catch (err) {
    // Handle any errors by disconnecting the client
    logger.error({
      error: `Error at socket disconnect.`,
      stack: err.stack,
      message: err.message
    });
    client.disconnect();
  }
};

/**
 * Initializes and manages socket connections.
 * @param {object} server - The HTTP server instance.
 */
exports.socketManager = (server) => {
  // Ensure server.app is initialized
  if (!server.app) server.app = {};
  // Create a storage for socket connections
  server.app.socketConnections = {};

  // Create a Socket.io instance attached to the server
  io = socketIO(server);

  // Event listener for a new socket connection
  io.on("connect", (client) => {
    // Delegate connection handling to a separate function
    handleConnection(client);

    client.on("init", (match) => {
      client.join(match.id);
    });

    client.on("leaveAll", () => {
      client.leaveAll();
    });

    client.on("leaveMatch", (match) => {
      client.leave(match.id);
    });

    client.on("updateMatchBettingRate", async (body) => {

      let { error, validated } = await jsonValidator(UpdateMatchBettingRateInSocket, body);
      if (error) {
        return;
      }
      let { matchId, id, type } = body;

      logger.info({
        message: `updating rate in redis for match betting id ${id} and type ${type} of match ${matchId}`,
        data: body
      });

      this.sendMessageToUser(socketData.expertRoomSocket, "updateMatchBettingRateClient", body);

      let matchBettingData = {};
      matchBettingData = await getBettingFromRedis(matchId, type);
      if (!matchBettingData) {
        await addAllMatchBetting(matchId);
        matchBettingData = await getBettingFromRedis(matchId, type);
      }
      matchBettingData['backTeamA'] = body.backTeamA ? body.backTeamA : 0;
      matchBettingData['backTeamB'] = body.backTeamB ? body.backTeamB : 0;
      matchBettingData['backTeamC'] = body.backTeamC ? body.backTeamC : 0;
      matchBettingData['layTeamA'] = body.layTeamA ? body.layTeamA : 0;
      matchBettingData['layTeamB'] = body.layTeamB ? body.layTeamB : 0;
      matchBettingData['layTeamC'] = body.layTeamC ? body.layTeamC : 0;
      matchBettingData['statusTeamA'] = body.statusTeamA ;
      matchBettingData['statusTeamB'] = body.statusTeamB ;
      matchBettingData['statusTeamC'] = body.statusTeamC ;

      updateMatchBettingById(id, matchBettingData);
      updateBettingMatchRedis(matchId, type, matchBettingData);
      return;
    })

    
    client.on("updateSessionRate", async (body) => {

      let { error, validated } = await jsonValidator(UpdateSessionRateInSocket, body);
      if (error) {
        return;
      }
      let { matchId, id } = body;

      logger.info({
        message: `updating rate in redis for session id ${id} and match ${matchId}`,
        data: body
      });

      this.sendMessageToUser(socketData.expertRoomSocket, "updateSessionRateClient", body);

      let sessionData = {};
      sessionData = await getSessionFromRedis(matchId, id);
      if (!sessionData) {
        await addAllsessionInRedis(matchId);
        sessionData = await getSessionFromRedis(matchId, id);
      }
      if(!sessionData)
      return;
      sessionData['yesRate'] = body.yesRate ? body.yesRate : 0;
      sessionData['noRate'] = body.noRate ? body.noRate : 0;
      sessionData['yesPercent'] = body.yesPercent ? body.yesPercent : 0;
      sessionData['noPercent'] = body.noPercent ? body.noPercent : 0;
      sessionData['status'] = body.status;
      updateSessionBetting({id}, sessionData);
      updateSessionMatchRedis(matchId, id, sessionData);
      return;
    })

    // Event listener for socket disconnection
    client.on("disconnect", () => {
      // Delegate disconnection handling to a separate function
      handleDisconnect(client);
    });
  });
};
/**
 * Sends a message to a specific user or room.
 *
 * @param {string} roomId - The ID of the user or room to send the message to.
 * @param {string} event - The name of the event to emit.
 * @param {any} data - The data to send with the message.
 *
 * @throws {Error} Throws an error if the Socket.IO instance (io) is not initialized.
 *
 * @example
 * // Sending a message to a user with ID '123'
 * sendMessageToUser('123', 'customEvent', { message: 'Hello, user!' });
 */
exports.sendMessageToUser = (roomId, event, data) => {
  io.to(roomId).emit(event, data);
};
/**
 * Broadcasts an event to all connected clients.
 * @param {string} event - The event name to broadcast.
 * @param {any} data - The data to send with the broadcast.
 */
exports.broadcastEvent = (event, data) => {
  io.sockets.emit(event, data);
};
