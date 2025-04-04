const { Server } = require("./grpcServer");
const { createUser } = require("./handlers/userHandler");

const { GRPC_PORT = 60600 } = process.env;

const protoOptionsArray = [
    {
        path: `${__dirname}/proto/user.proto`, //path to proto file
        package: "userProvider",//package in proto name
        service: "UserService",//service name in proto file
    }
];

const server = new Server(`${GRPC_PORT}`, protoOptionsArray);
server
    .addService("UserService", "CreateExpert", createUser)

// gRPC methods implementation



module.exports = server;