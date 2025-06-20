const { walletDomain } = require("../../config/contants");
const GrpcClient = require("./grpcClient");

const walletProtoOptionsArray = [
  {
    path: `${__dirname}/proto/declareSession.proto`, //path to proto file
    package: "grpc.declareSessionProvider",//package in proto name
    service: "DeclareSessionProvider",//service name in proto file
  },
  {
    path: `${__dirname}/proto/declareMatch.proto`, //path to proto file
    package: "grpc.declareMatchProvider",//package in proto name
    service: "DeclareMatchProvider",//service name in proto file
  },
  {
    path: `${__dirname}/proto/bets.proto`, //path to proto file
    package: "grpc.betsProvider",//package in proto name
    service: "BetsProvider",//service name in proto file
  },
  {
    path: `${__dirname}/proto/match.proto`, //path to proto file
    package: "grpc.matchProvider",//package in proto name
    service: "MatchProvider",//service name in proto file
  }
];

const userProtoOptionsArray = [
  {
    path: `${__dirname}/proto/bets.proto`, //path to proto file
    package: "grpc.betsProvider",//package in proto name
    service: "BetsProvider",//service name in proto file
  }
]


const walletServerAddress = walletDomain;

const grpcReq = {
  wallet: new GrpcClient(walletProtoOptionsArray, walletServerAddress),
  user: (address) => new GrpcClient(userProtoOptionsArray, address),

};

module.exports = grpcReq;