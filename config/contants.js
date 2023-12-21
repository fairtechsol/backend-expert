module.exports.redisTimeOut = 24 * 60 * 60;

module.exports.userRoleConstant = {
  fairGameWallet: "fairGameWallet",
  fairGameAdmin: "fairGameAdmin",
  superAdmin: "superAdmin",
  admin: "admin",
  superMaster: "superMaster",
  master: "master",
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
  completeMatch : "completeMatch"
};

module.exports.manualMatchBettingType = [
  "quickbookmaker1",
  "quickbookmaker2",
  "quickbookmaker3",
  "tiedMatch2",
];

module.exports.intialMatchBettingsName = {
  initialBookmaker: "Bookmaker Market",
  initialMatchOdd: "Match Odd",
};
module.exports.sessionBettingType = {
  marketSession: "marketSession",
  manualSession: "manualSession",
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
  back: "back",
  lay: "lay",
  yes: "yes",
  no: "no",
};

module.exports.bettingType = {
  session: "session",
  match: "match",
};

module.exports.initialMatchNames = {
  manual: "tied_manual",
  market: "tied_match",
  completeMatch : "complete_match"
};

module.exports.expertRoomSocket="expertRoom";