const grpcReq = require("../../index");

exports.declareMatchHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "declareMatchProvider",
      "DeclareTournament",
      requestData
    );

    return response;
  } catch (error) {
    throw error;
  }
};

exports.unDeclareMatchHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "declareMatchProvider",
      "UnDeclareTournament",
      requestData
    );

    return {
      data: {
        profitLoss: response?.data?.profitLoss, profitLossWallet: JSON.parse(response?.data?.profitLossWallet),
      }
    };
  } catch (error) {
    throw error;
  }
};