module.exports.redisTimeOut = 24 * 60 * 60;
module.exports.walletDomain = process.env.WALLET_DOMAIN_URL || "http://localhost:5050";
module.exports.noResult="No Result";
module.exports.passwordRegex = /^(?=.*[A-Z])(?=.*[a-zA-Z].*[a-zA-Z].*[a-zA-Z].*[a-zA-Z])(?=.*\d.*\d.*\d.*\d).{8,}$/;

module.exports.userRoleConstant = {
  fairGameWallet: "fairGameWallet",
  fairGameAdmin: "fairGameAdmin",
  superAdmin: "superAdmin",
  admin: "admin",
  superMaster: "superMaster",
  master: "master",
  agent: "agent",
  expert: "expert",
  user: "user",
};

module.exports.betStatus = {
  save: "save",
  live: "live",
  result: "result",
  close: "close",
};

module.exports.baseColumnsSchemaPart = {
  id: {
    type: "uuid",
    primary: true,
    generated: "uuid",
  },
  createBy: {
    type: "uuid",
    nullable: true,
  },
  createdAt: {
    type: "timestamp with time zone",
    createDate: true,
  },
  updatedAt: {
    type: "timestamp with time zone",
    updateDate: true,
  },
  deletedAt: {
    type: "timestamp with time zone",
    deleteDate: true,
  },
};

module.exports.matchBettingType = {
  matchOdd: "matchOdd",
  bookmaker: "bookmaker",
  quickbookmaker1: "quickbookmaker1",
  quickbookmaker2: "quickbookmaker2",
  quickbookmaker3: "quickbookmaker3",
  tiedMatch1: "tiedMatch1",
  tiedMatch2: "tiedMatch2",
  completeMatch: "completeMatch"
};

module.exports.manualMatchBettingType = [
  "quickbookmaker1",
  "quickbookmaker2",
  "quickbookmaker3",
  "tiedMatch2",
];

module.exports.quickBookmakers = [
  "quickbookmaker1",
  "quickbookmaker2",
  "quickbookmaker3",
];

module.exports.marketBettingTypeByBettingType = {
  [this.matchBettingType.matchOdd]: "matchOdd",
  [this.matchBettingType.bookmaker]: "marketBookmaker",
  [this.matchBettingType.tiedMatch1]: "marketTiedMatch",
  [this.matchBettingType.completeMatch]: "marketCompleteMatch"
}

module.exports.marketMatchBettingType = {
  [this.matchBettingType.matchOdd]: "matchOdd",
  [this.matchBettingType.bookmaker]: "bookmaker",
  [this.matchBettingType.tiedMatch1]: "tiedMatch1",
  [this.matchBettingType.completeMatch]: "completeMatch"
}

module.exports.intialMatchBettingsName = {
  [this.matchBettingType.bookmaker]: "Bookmaker Market",
  [this.matchBettingType.matchOdd]: "Match Odd",
  [this.matchBettingType.tiedMatch1]: "tied_match",
  [this.matchBettingType.tiedMatch2]: "tied_manual",
  [this.matchBettingType.completeMatch]: "complete_match"
};

module.exports.matchBettingKeysForMatchDetails={
  [this.matchBettingType.tiedMatch1]:"apiTideMatch",
  [this.matchBettingType.tiedMatch2]:"manualTideMatch",
  [this.matchBettingType.matchOdd]: "matchOdd",
  [this.matchBettingType.bookmaker]: "bookmaker",
  [this.matchBettingType.completeMatch]: "marketCompleteMatch"
}

module.exports.sessionBettingType = {
  session: "session",
  overByOver: "overByover",
  ballByBall: "ballByBall",
};
module.exports.teamStatus = {
  suspended: "suspended",
  active: "active",
  closed: "closed",
  ballStart: "ball start",
  ballStop: "ball stop",
  ballRunning: "ball running",
};

module.exports.betStatusType = {
  save: "save",
  live: "live",
  result: "result",
  close: "close",
};

module.exports.betType = {
  YES : "YES",
  NO : "NO",
  BACK : "BACK",
  LAY : "LAY"
};

module.exports.bettingType = {
  session: "session",
  match: "match",
};


module.exports.socketData ={
  expertRoomSocket : "expertRoom",
  updateMatchEvent : "updateMatch",
  sessionAddedEvent : "sessionAdded",
  addMatchEvent : "addMatch",
  matchActiveInActiveEvent : "matchActiveInActive",
  logoutUserForceEvent : "logoutUserForce",
  sessionUpdatedEvent :"sessionUpdated",
  SessionBetPlaced:"userSessionBetPlaced",
  MatchBetPlaced:"userMatchBetPlaced",
  sessionResultDeclared:"sessionResultDeclared",
  matchResultDeclared:"matchResultDeclared",
  matchResultUnDeclared:"matchResultUnDeclared",
  matchBettingStatusChange:"matchBettingStatusChange",
  sessionDeleteBet: "sessionDeleteBet",
  updateSessionRateClient: "updateSessionRateClient",
  matchDeleteBet: "matchDeleteBet"
};

module.exports.redisKeys = {
  userAllExposure : "exposure",
  userMatchExposure : "matchExposure_",
  userTeamARate : "teamARate_",
  userTeamBRate : "teamBRate_",
  userTeamCRate : "teamCRate_",
  userExposureLimit : "exposureLimit",
  expertRedisData:"expertRedisData",
  profitLoss:"_profitLoss",
  yesRateTie: "yesRateTie_",
  noRateTie: "noRateTie_",
  yesRateComplete: "yesRateComplete_",
  noRateComplete: "noRateComplete_",
}