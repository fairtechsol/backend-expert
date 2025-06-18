const grpcReq = require("../../index");

exports.getBets = async (requestData) => {
    try {
        // Call the gRPC method and await the response
        const response = await grpcReq.wallet.callMethod(
            "BetsProvider",
            "GetBets",
            requestData
        );

        return JSON.parse(response?.data || "{}");
    } catch (error) {
        throw error;
    }
};

exports.verifyBetHandler = async (requestData, address) => {
    try {
        // Call the gRPC method and await the response
        const response = await grpcReq.user(address).callMethod(
            "BetsProvider",
            "VerifyBet",
            requestData
        );
    } catch (error) {
        throw error;
    }
};


exports.getBetsLoginData = async () => {
    try {
        // Call the gRPC method and await the response
        const response = await grpcReq.wallet.callMethod(
            "BetsProvider",
            "GetBetsLoginData"
        );

        return JSON.parse(response?.data || "{}");
    } catch (error) {
        throw error;
    }
};

exports.sessionProfitLossUserWiseData = async (requestData) => {
    try {
        // Call the gRPC method and await the response
        const response = await grpcReq.wallet.callMethod(
            "BetsProvider",
            "GetSessionProfitLossUserWise",
            requestData
        );

        return JSON.parse(response?.data || "{}");
    } catch (error) {
        throw error;
    }
};

exports.sessionProfitLossBetsData = async (requestData) => {
    try {
        // Call the gRPC method and await the response
        const response = await grpcReq.wallet.callMethod(
            "BetsProvider",
            "GetSessionProfitLossBet",
            requestData
        );

        return JSON.parse(response?.data || "{}");
    } catch (error) {
        throw error;
    }
};