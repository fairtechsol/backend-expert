module.exports.redisTimeOut = 10 * 60 * 60;
module.exports.walletDomain = process.env.WALLET_DOMAIN_URL || "127.0.0.1:50500";
module.exports.microServiceDomain = process.env.MICROSERVICEURL || "http://localhost:3200";
module.exports.noResult = "No Result";
module.exports.passwordRegex = /^(?=.*[A-Z])(?=.*[a-zA-Z].*[a-zA-Z].*[a-zA-Z].*[a-zA-Z])(?=.*\d.*\d.*\d.*\d).{8,}$/;
module.exports.jwtSecret = process.env.JWT_SECRET || "secret";
module.exports.jobQueueConcurrent = process.env.JOB_QUEUE_CONCURRENT || 5;

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

module.exports.bannerType = {
  mobile: "mobile",
  desktop: "desktop"
};

module.exports.gameType = {
  cricket: "cricket",
  football: "football",
  tennis: "tennis",
  horseRacing: "horseRacing",
  greyHound: "greyHound",
  politics: "politics",
}

module.exports.resultStatus = {
  pending: "PENDING",
  missMatched: "MISMATCHED",
  declared: "DECLARED"
}

module.exports.betStatus = {
  save: "save",
  live: "live",
  unSave: "unSave",
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
  tournament: "tournament",
};

module.exports.gameTypeMatchBetting = {
  match: "match",
  match1: "match1",
  fancy: "fancy",
  fancy1: "fancy1",
  khado: "khado",
  meter: "meter",
  oddeven: "oddeven",
  cricketcasino: "cricketcasino",
};

module.exports.racingBettingType = {
  matchOdd: "matchOdd",
};


module.exports.mainMatchRacingMarketType = [this.matchBettingType.matchOdd];

module.exports.marketBettingTypeByBettingType = {
  [this.matchBettingType.tournament]: "tournament",
  
}

module.exports.raceTypeByBettingType = {
  [this.racingBettingType.matchOdd]: "matchOdd"
}

module.exports.sessionBettingType = {
  session: "session",
  fancy1: "fancy1",
  overByOver: "overByover",
  ballByBall: "ballByBall",
  oddEven: "oddEven",
  cricketCasino: "cricketCasino",
  khado: "khado",
  meter: "meter",
  manualSession: "manualSession"
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
  unSave: "unSave",
};

module.exports.betType = {
  YES: "YES",
  NO: "NO",
  BACK: "BACK",
  LAY: "LAY"
};

module.exports.bettingType = {
  session: "session",
  match: "match",
  racing: "racing",
  tournament:"tournament"
};

module.exports.socketData = {
  CardBetPlaced: "userCardBetPlaced",
  expertRoomSocket: "expertRoom",
  updateMatchEvent: "updateMatch",
  sessionAddedEvent: "sessionAdded",
  addMatchEvent: "addMatch",
  matchActiveInActiveEvent: "matchActiveInActive",
  logoutUserForceEvent: "logoutUserForce",
  sessionUpdatedEvent: "sessionUpdated",
  multiSessionUpdatedEvent: "multiSessionUpdated",
  SessionBetPlaced: "userSessionBetPlaced",
  MatchBetPlaced: "userMatchBetPlaced",
  sessionResultDeclared: "sessionResultDeclared",
  matchResultDeclared: "matchResultDeclared",
  matchResultUnDeclared: "matchResultUnDeclared",
  verifyBet: "verifyBet",
  matchBettingStatusChange: "matchBettingStatusChange",
  matchBettingMinMaxChange: "matchBettingMinMaxChange",
  matchBettingApiChange: "matchBettingApiChange",
  sessionDeleteBet: "sessionDeleteBet",
  updateSessionRateClient: "updateSessionRateClient",
  matchDeleteBet: "matchDeleteBet",
  updateInResultDeclare: "updateInResultDeclare",
  updateDeleteReason: "updateDeleteReason"

};

module.exports.redisKeys = {
  userAllExposure: "exposure",
  userMatchExposure: "matchExposure_",
  userExposureLimit: "exposureLimit",
  expertRedisData: "expertRedisData",
  profitLoss: "_profitLoss",
  card: "_card",
  declare: "_declare",
  profitLoss: "_profitLoss",
  notification:"notification",
  banner:"banner",
  blinkingTabs:"blinkingTabs"
}

exports.cardGames = [
  {
    type: "dt20",
    name: "20-20 DRAGON TIGER",
    id: "d67dcc3f-dfa8-48c9-85cb-c258b0d7084a"
  }, {
    type: "teen20",
    name: "20-20 TEENPATTI",
    id: "27948657-084b-469e-887a-4e3dbd8532f6"
  },
  {
    type: "card32",
    name: "32 CARDS - A",
    id: "2aa3973a-91ef-4159-ad6d-b1cd99eea9a7"
  },
  {
    type: "lucky7",
    name: "LUCKY 7 - A",
    "id": "541da7e4-2c6b-429f-9c01-0952882b4cb3"
  },
  {
    type: "abj",
    name: "ANDAR BAHAR 2",
    id: "ab24f5bd-4b29-41c2-8a79-017dfaa89684"
  },
  {
    type: "dt202",
    name: "20-20 DRAGON TIGER 2",
    id: "0d6d8c3f-7b2a-4ec6-9d2c-b482c9e8425b"
  },
  {
    type: "dtl20",
    name: "20-20 D T L",
    id: "7c64e3b9-2439-4c68-8e34-7b6c8b75e5e4"
  },
  {
    type: "dt6",
    name: "1 DAY DRAGON TIGER",
    id: "9fa835c7-10ea-4d42-8963-3f5b5e99d962"
  },
  {
    type: "lucky7eu",
    name: "LUCKY 7 - B",
    id: "db0e8a6d-4b8e-4d71-9f3b-d90d1e5b1b37"
  },
  {
    type: "teen",
    name: "TEENPATTI 1-DAY",
    id: "79e1e7cb-8f38-4d5e-a9f2-674d8f4b1b0b"
  },
  {
    type: "teen9",
    name: "TEENPATTI TEST",
    id: "a3925a8b-2c85-40c6-a6f9-bd9b3d3f7b2a"
  },
  {
    type: "teen8",
    name: "TEENPATTI OPEN",
    id: "f8e627d4-4295-4d49-ae64-03d5f4eaa82b"
  },
  {
    type: "poker",
    name: "POKER 1-DAY",
    id: "4d9821ea-6474-4c6c-a9b0-36d7e05e4b79"
  },
  {
    type: "poker20",
    name: "20-20 POKER",
    id: "b7a3e6b2-f1b1-4b1d-a0e9-36d5c8f7e6d9"
  },
  {
    type: "poker6",
    name: "POKER 6 PLAYERS",
    id: "85319b1c-9838-49f3-8b0f-45c5d6b8d6f3"
  },
  {
    type: "baccarat",
    name: "BACCARAT",
    id: "7a9d7dce-7a6d-4d6b-9c7d-7d8d8d8d8d8d"
  },
  {
    type: "baccarat2",
    name: "BACCARAT 2",
    id: "1b4b8a5e-6f7a-4d4b-9d3e-7a1d3d8e6f1b"
  },
  {
    type: "card32eu",
    name: "32 CARDS - B",
    id: "c3b5e1e2-8d5e-4d5a-8a5d-7d5e7a1d8e5c"
  },
  {
    type: "ab20",
    name: "ANDAR BAHAR 1",
    id: "d1a4d7b8-8a7b-4a3b-8a7d-7d5e7a1d8e5d"
  },
  {
    type: "3cardj",
    name: "3 CARDS JUDGEMENT",
    id: "a3d8a7e4-6a3d-4d4b-9a7e-7a1d7d3e7a5d"
  },
  {
    type: "war",
    name: "CASINO WAR",
    id: "7a5d7d8e-7a5e-4a5e-9a7e-7a5e7d3e7a5d"
  },
  {
    type: "worli2",
    name: "INSTANT WORLI",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a5d"
  },
  {
    type: "superover",
    name: "SUPER OVER",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a5e"
  },
  {
    type: "cmatch20",
    name: "CRICKET MATCH 20-20",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a5f"
  },
  {
    type: "aaa",
    name: "AMAR AKBAR ANTHONY",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a60"
  },
  {
    type: "btable",
    name: "BOLLYWOOD CASINO",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a61"
  },
  {
    type: "race20",
    name: "RACE 20",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a62"
  },
  {
    type: "cricketv3",
    name: "FIVE FIVE CRICKET",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e7a63"
  },
  {
    type: "cmeter",
    name: "Casino Meter",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-9a5e7d3e7a63"
  },
  {
    type: "worli",
    name: "Worli Matka",
    id: "7a5e7d3e-7a5a-4a5e-9a7e-7a5e7d3e7a63"
  }, {
    type: "queen",
    name: "Queen",
    id: "7a5e7d3e-7a5a-4a5e-9a7e-7a5e7b3e7a63"
  }, {
    type: "ballbyball",
    name: "Ball By Ball",
    id: "7a5e7d3e-7a5e-4a5e-9a7e-7a5e7d3e8c63"
  }
];

exports.matchOddName="MATCH_ODDS"