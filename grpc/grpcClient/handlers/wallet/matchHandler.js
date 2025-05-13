const grpcReq = require("../../index");

exports.addMatchHandler = async (requestData) => {
    try {
        await grpcReq.wallet.callMethod(
            "MatchProvider",
            "AddMatch",
            requestData
        );

    } catch (error) {
        throw error;
    }
};

exports.addRaceMatchHandler = async (requestData) => {
    try {
        await grpcReq.wallet.callMethod(
            "MatchProvider",
            "AddRaceMatch",
            requestData
        );

    } catch (error) {
        throw error;
    }
};
