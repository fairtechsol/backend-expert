const socketIO = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");
const { verifyToken, getUserTokenFromRedis } = require("../utils/authUtils");
const internalRedis = require("../config/internalRedisConnection");
const { logger } = require("../config/logger");
const { userRoleConstant, socketData } = require("../config/contants");
const {
  getSessionFromRedis,
  getBettingFromRedis,
  updateBettingMatchRedis,
  updateSessionMatchRedis,
  addAllsessionInRedis,
  addAllMatchBetting,
  getMatchTournamentFromCache,
  updateMatchKeyInCache,
} = require("../services/redis/commonfunction");
const { updateMatchBettingById } = require("../services/matchBettingService");
const { UpdateMatchBettingRateInSocket } = require("../validators/matchBettingValidator");
const { jsonValidator } = require("../middleware/joi.validator");
const { updateSessionBetting } = require("../services/sessionBettingService");
const { UpdateSessionRateInSocket } = require("../validators/sessionValidator");
const { getTournamentBetting, getSingleTournamentBetting, addTournamentRunners } = require("../services/tournamentBettingService");
require("dotenv").config();

let io;

/**
 * Handles a new socket connection.
 * @param {object} client - The socket client object representing the connection.
 */
const handleConnection = async (client) => {
  try {
    // Extract token from handshake headers or auth object
    const token = client.handshake.headers.authorization || client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }

    // Verify token and get user details
    const decodedUser = verifyToken(token);
    if (!decodedUser) {
      client.disconnect();
      return;
    }

    // Extract user ID, role, and demo flag from the decoded user object
    const { id: userId, roleName, isDemo } = decodedUser;

    // For regular (non-demo) users, manage login count
    if (roleName == userRoleConstant.user && !isDemo) {
      const userCount = parseInt(await internalRedis.get("loginUserCount"));
      const incrementCount = async () => {
        const count = await internalRedis.incr("loginUserCount");
        io.to(socketData.expertRoomSocket).emit("loginUserCount", { count });
      };

      if (userCount > 0) {
        await incrementCount();
      } else {
        await internalRedis.set("loginUserCount", 1);
        io.to(socketData.expertRoomSocket).emit("loginUserCount", { count: 1 });
      }
      return;
    }

    // Retrieve and verify the token stored in Redis
    const userTokenRedis = await getUserTokenFromRedis(userId);
    if (userTokenRedis !== token) {
      client.disconnect();
      return;
    }

    // Join the room for the user and the expert room
    client.join(userId);
    client.join(socketData.expertRoomSocket);
  } catch (err) {
    logger.error({
      error: "Error at socket connection.",
      stack: err.stack,
      message: err.message,
    });
    client.disconnect();
  }
};

/**
 * Handles socket disconnection.
 * @param {object} client - The socket client object.
 */
const handleDisconnect = async (client) => {
  try {
    // Extract token from handshake headers or auth object
    const token = client.handshake.headers.authorization || client.handshake.auth.token;
    if (!token) {
      return;
    }

    // Verify the token to retrieve user details
    const decodedUser = verifyToken(token);
    if (!decodedUser) {
      return;
    }

    const { id: userId, roleName, isDemo } = decodedUser;

    // For regular (non-demo) users, decrement the login count
    if (roleName == userRoleConstant.user && !isDemo) {
      const userCount = parseInt(await internalRedis.get("loginUserCount"));
      const decrementCount = async () => {
        const count = await internalRedis.decr("loginUserCount");
        io.to(socketData.expertRoomSocket).emit("loginUserCount", { count });
      };

      userCount > 0 ? await decrementCount() : await internalRedis.set("loginUserCount", 0);
      return;
    }

    // Leave all rooms associated with the client
    client.leaveAll();
  } catch (err) {
    logger.error({
      error: "Error at socket disconnect.",
      stack: err.stack,
      message: err.message,
    });
    client.disconnect();
  }
};

/**
 * Initializes and manages socket connections.
 * @param {object} server - The HTTP server instance.
 */
exports.socketManager = (server) => {
  if (!server.app) server.app = {};
  server.app.socketConnections = {};

  io = socketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"], // Enable both WebSocket and polling
    perMessageDeflate: {
      threshold: 1024,  // Only compress messages larger than 1024 bytes
      zlibDeflateOptions: { level: 6 }, // Maximum compression
      zlibInflateOptions: { chunkSize: 64 * 1024 }, // Efficient decompression
      clientNoContextTakeover: true, // Reduce memory usage
      serverNoContextTakeover: true, // Reduce memory usage
      serverMaxWindowBits: 10, // Low memory usage
    }
  });

  // Create Redis clients using ioredis
  const pubClient = new Redis({
    host: process.env.INTERNAL_REDIS_HOST || "localhost",
    port: process.env.INTERNAL_REDIS_PORT || 6379,
    password: process.env.INTERNAL_REDIS_PASSWORD,
  });
  const subClient = pubClient.duplicate();

  // Use the Redis adapter with the ioredis clients
  io.adapter(createAdapter(pubClient, subClient));

  // Set up socket event listeners
  io.on("connect", (client) => {
    handleConnection(client);

    client.on("matchRoom", (match) => {
      client.join(match.id);
    });

    client.on("leaveAll", () => {
      client.leaveAll();
    });

    client.on("leaveMatch", (match) => {
      client.leave(match.id);
    });

    client.on("updateMatchBettingRate", async (body) => {
      const { error, validated } = await jsonValidator(UpdateMatchBettingRateInSocket, body);
      if (error) {
        return;
      }
      const { matchId, id, teams } = body;
      exports.sendMessageToUser(socketData.expertRoomSocket, "updateMatchBettingRateClient", body);

      const redisMatchTournament = await getMatchTournamentFromCache(matchId);
      let matchBettingData = redisMatchTournament.find((item) => item.id == id);
      if (!matchBettingData) {
        matchBettingData = await getSingleTournamentBetting({ id: id });
      }
      teams.forEach((items) => {
        matchBettingData.runners.find((item) => item.id == items.id).backRate = items.back;
        matchBettingData.runners.find((item) => item.id == items.id).layRate = items.lay;
        matchBettingData.runners.find((item) => item.id == items.id).status = items.status;
      });
      matchBettingData.runners = matchBettingData?.runners?.sort((a, b) => a.sortPriority - b.sortPriority);
      if (redisMatchTournament) {
        const currRunnerIndex = redisMatchTournament.findIndex((item) => item.id == id);
        redisMatchTournament[currRunnerIndex] = matchBettingData;
        updateMatchKeyInCache(matchId, "tournament", JSON.stringify(redisMatchTournament));
      }
      addTournamentRunners(matchBettingData.runners);
    });

    client.on("updateSessionRate", async (body) => {
      const { error, validated } = await jsonValidator(UpdateSessionRateInSocket, body);
      if (error) {
        return;
      }
      const { matchId, id } = body;
      exports.sendMessageToUser(socketData.expertRoomSocket, "updateSessionRateClient", body);

      let sessionData = await getSessionFromRedis(matchId, id);
      if (!sessionData) {
        await addAllsessionInRedis(matchId);
        sessionData = await getSessionFromRedis(matchId, id);
      }
      if (!sessionData) return;
      sessionData["yesRate"] = body.yesRate ? body.yesRate : 0;
      sessionData["noRate"] = body.noRate ? body.noRate : 0;
      sessionData["yesPercent"] = body.yesPercent ? body.yesPercent : 0;
      sessionData["noPercent"] = body.noPercent ? body.noPercent : 0;
      sessionData["status"] = body.status;
      updateSessionBetting({ id }, sessionData);
      updateSessionMatchRedis(matchId, id, sessionData);
    });

    client.on("disconnect", () => {
      handleDisconnect(client);
    });
  });
};

/**
 * Sends a message to a specific user or room.
 * @param {string} roomId - The ID of the user or room to send the message to.
 * @param {string} event - The event name to emit.
 * @param {any} data - The data to send with the message.
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
