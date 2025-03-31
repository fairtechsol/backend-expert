const grpcReq = require("../../index");

exports.declareSessionHandler = async (requestData) => {
  try {
    // Call the gRPC method and await the response
    const response = await grpcReq.wallet.callMethod(
      "DeclareProvider",
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
      "DeclareProvider",
      "DeclareSessionNoResult",
      requestData
    );

    return response;
  } catch (error) {
    throw error;
  }
};