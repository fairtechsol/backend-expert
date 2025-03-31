const { Server } = require("./grpcServer");

const { GRPC_PORT = 60600 } = process.env;

const protoOptionsArray = [
  
];

const server = new Server(`${GRPC_PORT}`, protoOptionsArray);

// gRPC methods implementation
    


module.exports = server;