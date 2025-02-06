const axios = require('axios');
const { encryptWithAES, encryptAESKeyWithRSA, decryptAESKeyWithRSA, decryptWithAES } = require('./encryptDecrypt');
const crypto = require("crypto");
// create common api call function using axios to call external server http call for whole project GET <POST< PUT< DELETE
exports.apiMethod = {
  get: "get",
  post: "post",
  put: "put",
  delete: "delete"
}
exports.apiCall = async (method, url, data, headers, ReqQuery) => {
  try {
    // if (ReqQuery) {
    //   const aesKey = crypto.randomBytes(32); // Generate AES key
    //   const encryptedData = encryptWithAES(ReqQuery, aesKey);
    //   const encryptedKey = encryptAESKeyWithRSA(aesKey, true);
    //   ReqQuery = { encryptedData, encryptedKey }
    // }
    // if (data) {
    //   const aesKey = crypto.randomBytes(32); // Generate AES key
    //   const encryptedData = encryptWithAES(data, aesKey);
    //   const encryptedKey = encryptAESKeyWithRSA(aesKey, true);
    //   data = { encryptedData, encryptedKey }
    // }
    let response = await axios({
      method: method,
      url: url,
      data: data,
      headers: headers,
      params: ReqQuery
    });
    let resData = response.data;
    // if (resData?.encryptedData && resData?.encryptedKey) {
    //   const aesKey = decryptAESKeyWithRSA(resData.encryptedKey, true);
    //   resData = decryptWithAES(resData.encryptedData, aesKey);
    // }
    return resData;
  } catch (error) {
    throw error;
  }
};

exports.allApiRoutes = {
  wallet: {
    declareSessionResult: "/expert/declare/result/session",
    declareSessionNoResult: "/expert/declare/noResult/session",
    unDeclareSessionResult: "/expert/unDeclare/result/session",
    declareMatchResult: "/expert/declare/result/match",
    declareOtherMatchResult: "/expert/declare/result/other/match",
    declareOtherMarketResult: "/expert/declare/result/other/market",
    declareRacingMatchResult: "/expert/declare/result/race/match",
    declareTournamentMatchResult: "/expert/declare/result/tournament/match",
    unDeclareMatchResult: "/expert/unDeclare/result/match",
    unDeclareOtherMatchResult: "/expert/unDeclare/result/other/match",
    unDeclareOtherMarketResult: "/expert/unDeclare/result/other/market",
    unDeclareRacingMatchResult: "/expert/unDeclare/result/race/match",
    unDeclareTournamentMatchResult: "/expert/unDeclare/result/tournament/match",
    bets: "/expert/bets",
    loginData: "/expert/login/bet/data",
    addMatch: "/match/add",
    addRaceMatch: "/match/raceAdd"
  },
  user:{
    verifyBet: "/fairgameWallet/verifyBet"
  },
  thirdParty:{
    extraMarket:"/extraMarketList/"
  }

};
