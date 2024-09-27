const axios = require('axios');
// create common api call function using axios to call external server http call for whole project GET <POST< PUT< DELETE
exports.apiMethod = {
  get: "get",
  post: "post",
  put: "put",
  delete: "delete"
}
exports.apiCall = async (method, url, data, headers, ReqQuery) => {
  try {
    let query = ''
    if (ReqQuery && Object.keys(ReqQuery).length) {
      query = Object.keys(ReqQuery)
        .map(key => `${key}=${ReqQuery[key]}`)
        .join('&');
      url = url + '?' + query
    }
    let response = await axios({
      method: method,
      url: url,
      data: data,
      headers: headers
    });
    return response.data;
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
    declareRacingMatchResult: "/expert/declare/result/race/match",
    declareTournamentMatchResult: "/expert/declare/result/tournament/match",
    unDeclareMatchResult: "/expert/unDeclare/result/match",
    unDeclareOtherMatchResult: "/expert/unDeclare/result/other/match",
    unDeclareRacingMatchResult: "/expert/unDeclare/result/race/match",
    unDeclareTournamentMatchResult: "/expert/unDeclare/result/tournament/match",
    bets: "/expert/bets",
    loginData: "/expert/login/bet/data",
    addMatch: "/match/add",
    addRaceMatch: "/match/raceAdd"
  },
  thirdParty:{
    extraMarket:"/extraMarketList/"
  }

};
