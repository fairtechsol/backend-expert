module.exports.redisTimeOut = 10 * 60 * 60;
module.exports.walletDomain = process.env.WALLET_DOMAIN_URL || "http://localhost:5050";
module.exports.microServiceDomain = process.env.MICROSERVICEURL || "http://localhost:3200";
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

module.exports.gameType = {
  cricket: "cricket",
  football: "football",
  tennis:"tennis"
}

module.exports.resultStatus = {
  pending: "PENDING",
  missMatched: "MISSMATCHED"
}

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
  completeMatch: "completeMatch",
  completeManual: "completeManual",
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`overUnder${curr}.5`] = `overUnder${curr}.5`
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`firstHalfGoal${curr}.5`] = `firstHalfGoal${curr}.5`
    return prev;
  }, {})),
  halfTime: "halfTime",
  setWinner1:"setWinner1",
  setWinner2:"setWinner2",
};

module.exports.manualMatchBettingType = [
  "quickbookmaker1",
  "quickbookmaker2",
  "quickbookmaker3",
  "tiedMatch2",
  "completeManual"
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
  [this.matchBettingType.completeMatch]: "marketCompleteMatch",
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`overUnder${curr}.5`] = `overUnder${curr}.5`
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`firstHalfGoal${curr}.5`] = `firstHalfGoal${curr}.5`
    return prev;
  }, {})),
  [this.matchBettingType.halfTime]: "halfTime",
  [this.matchBettingType.setWinner1]: "setWinner1",
  [this.matchBettingType.setWinner2]: "setWinner2",
}

module.exports.marketMatchBettingType = {
  [this.matchBettingType.matchOdd]: "matchOdd",
  [this.matchBettingType.bookmaker]: "bookmaker",
  [this.matchBettingType.tiedMatch1]: "tiedMatch1",
  [this.matchBettingType.completeMatch]: "completeMatch",
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`overUnder${curr}.5`] = `overUnder${curr}.5`
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`firstHalfGoal${curr}.5`] = `firstHalfGoal${curr}.5`
    return prev;
  }, {})),
  [this.matchBettingType.halfTime]: "halfTime",
  [this.matchBettingType.setWinner1]: "setWinner1",
  [this.matchBettingType.setWinner2]: "setWinner2",
}

module.exports.intialMatchBettingsName = {
  [this.matchBettingType.bookmaker]: "Bookmaker Market",
  [this.matchBettingType.matchOdd]: "Match Odd",
  [this.matchBettingType.tiedMatch1]: "tied_match",
  [this.matchBettingType.tiedMatch2]: "tied_manual",
  [this.matchBettingType.completeMatch]: "complete_match",
  [this.matchBettingType.completeManual]: "complete_manual",
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`overUnder${curr}.5`] = `over_under_${curr}.5`
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`firstHalfGoal${curr}.5`] = `first_half_goal_${curr}.5`
    return prev;
  }, {})),
  [this.matchBettingType.halfTime]: "half_time",
  [this.matchBettingType.setWinner1]: "set_winner_1",
  [this.matchBettingType.setWinner2]: "set_winner_2",
};

module.exports.matchBettingKeysForMatchDetails={
  [this.matchBettingType.tiedMatch1]:"apiTideMatch",
  [this.matchBettingType.tiedMatch2]:"manualTideMatch",
  [this.matchBettingType.matchOdd]: "matchOdd",
  [this.matchBettingType.bookmaker]: "bookmaker",
  [this.matchBettingType.completeMatch]: "marketCompleteMatch",
  [this.matchBettingType.completeManual]: "completeManual",
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`overUnder${curr}.5`] = `overUnder${curr}.5`
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`firstHalfGoal${curr}.5`] = `firstHalfGoal${curr}.5`
    return prev;
  }, {})),
  [this.matchBettingType.halfTime]: "halfTime",
  [this.matchBettingType.setWinner1]: "setWinner1",
  [this.matchBettingType.setWinner2]: "setWinner2",
}

module.exports.multiMatchBettingRecord={
  "overUnder":"overUnder",
  firstHalfGoal:"firstHalfGoal"
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
  matchDeleteBet: "matchDeleteBet",
  updateInResultDeclare: "updateInResultDeclare"
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

  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`yesRateUnderOver${curr}.5`] = `yesRateUnderOver${curr}.5_`;
    prev[`noRateUnderOver${curr}.5`] = `noRateUnderOver${curr}.5_`;
    return prev;
  }, {})),
  ...(Array.from({ length: 20 }, (_, index) => index).reduce((prev, curr) => {
    prev[`yesRateFirstHalfGoal${curr}.5`] = `yesRateFirstHalfGoal${curr}.5_`;
    prev[`noRateFirstHalfGoal${curr}.5`] = `noRateFirstHalfGoal${curr}.5_`;
    return prev;
  }, {})),

  userTeamARateHalfTime: "userTeamARateHalfTime_",
  userTeamBRateHalfTime: "userTeamBRateHalfTime_",
  userTeamCRateHalfTime: "userTeamCRateHalfTime_",

  userTeamARateSetWinner1: "userTeamARateSetWinner1_",
  userTeamBRateSetWinner1: "userTeamBRateSetWinner1_",
  userTeamCRateSetWinner1: "userTeamCRateSetWinner1_",

  userTeamARateSetWinner2: "userTeamARateSetWinner2_",
  userTeamBRateSetWinner2: "userTeamBRateSetWinner2_",
  userTeamCRateSetWinner2: "userTeamCRateSetWinner2_",

  profitLoss: "_profitLoss"
}

module.exports.redisKeysMatchWise = {
  [this.gameType.cricket]: [this.redisKeys.userTeamARate, this.redisKeys.userTeamBRate, this.redisKeys.userTeamCRate, this.redisKeys.noRateComplete, this.redisKeys.yesRateComplete, this.redisKeys.noRateTie, this.redisKeys.yesRateTie],
  [this.gameType.football]: [this.redisKeys.userTeamARate, this.redisKeys.userTeamBRate, this.redisKeys.userTeamCRate, this.redisKeys.userTeamARateHalfTime, this.redisKeys.userTeamBRateHalfTime, this.redisKeys.userTeamCRateHalfTime, ...Array.from({ length: 20 }, (_, index) => this.redisKeys[`yesRateUnderOver${index}.5`]),
  ...Array.from({ length: 20 }, (_, index) => this.redisKeys[`noRateUnderOver${index}.5`]),
  ...Array.from({ length: 20 }, (_, index) => this.redisKeys[`yesRateFirstHalfGoal${index}.5`]),
  ...Array.from({ length: 20 }, (_, index) => this.redisKeys[`noRateFirstHalfGoal${index}.5`])],
  [this.gameType.tennis]: [this.redisKeys.userTeamARate, this.redisKeys.userTeamBRate, this.redisKeys.userTeamCRate, this.redisKeys.userTeamARateSetWinner1, this.redisKeys.userTeamBRateSetWinner1, this.redisKeys.userTeamCRateSetWinner1, this.redisKeys.userTeamARateSetWinner2, this.redisKeys.userTeamBRateSetWinner2, this.redisKeys.userTeamCRateSetWinner2],
}
