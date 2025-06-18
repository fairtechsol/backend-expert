const grpcReq = require("../../index");

exports.declareMatchHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "DeclareMatchProvider",
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
      "DeclareMatchProvider",
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

exports.declareFinalMatchHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    await grpcReq.wallet.callMethod(
      "DeclareMatchProvider",
      "DeclareFinalMatch",
      requestData
    );

    return {};
  } catch (error) {
    throw error;
  }
};

exports.unDeclareFinalMatchHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    await grpcReq.wallet.callMethod(
      "DeclareMatchProvider",
      "UnDeclareFinalMatch",
      requestData
    );

    return {};
  } catch (error) {
    throw error;
  }
};

