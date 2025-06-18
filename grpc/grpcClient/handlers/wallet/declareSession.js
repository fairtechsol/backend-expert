const grpcReq = require("../../index");

exports.declareSessionHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "DeclareSessionProvider",
      "DeclareSession",
      requestData
    );

    return response;
  } catch (error) {
    throw error;
  }
};

exports.declareSessionNoResultHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "DeclareSessionProvider",
      "DeclareSessionNoResult",
      requestData
    );

    return response;
  } catch (error) {
    throw error;
  }
};

exports.unDeclareSessionHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "DeclareSessionProvider",
      "UnDeclareSession",
      requestData
    );

    return {
      data: {
        profitLoss: response?.data?.profitLoss, profitLossObj: JSON.parse(response?.data?.profitLossObj),
      }
    };
  } catch (error) {
    throw error;
  }
};