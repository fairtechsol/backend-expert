module.exports.redisTimeOut = 24 * 60 * 60;

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
  matchOdd : 'matchOdd',
  bookmaker : 'bookmaker',
  quickbookmaker : 'quickbookmaker1',
  quickbookmaker : 'quickbookmaker2',
  quickbookmaker : 'quickbookmaker3',
  tiedMatch : 'tiedMatch1',
  tiedMatch : 'tiedMatch2'
}

module.exports.sessionBettingType = {
  marketSession : 'marketSession',
  manualSession : 'manualSession',
  overByOver : 'overByover',
  ballByBall : 'ballByBall'
}
module.exports.teamStatus = {
  suspended : 'suspended',
  active : 'active',
  closed : 'closed',
  ballStart : "ball start",
  ballStop : "ball stop",
  ballRunning : 'ball running'
}

module.exports.betStatusType = {
  save:'save',
  live : 'live',
  result : 'result',
  close : 'close'
}

module.exports.betType = {
  back : 'back',
  lay : 'lay',
  yes : 'yes',
  no : 'no'
}

module.exports.bettingType = {
session : 'session',
match : 'match'
}