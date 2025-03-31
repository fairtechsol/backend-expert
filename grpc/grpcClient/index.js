const GrpcClient = require("./grpcClient");

const walletProtoOptionsArray = [
  {
    path: `${__dirname}/proto/declare.proto`, //path to proto file
    package: "declareProvider",//package in proto name
    service: "DeclareProvider",//service name in proto file
}
];


const walletServerAddress = "localhost:50500";

const grpcReq = {
  wallet: new GrpcClient(walletProtoOptionsArray, walletServerAddress),
  
};

module.exports = grpcReq;