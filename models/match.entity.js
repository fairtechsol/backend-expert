const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");

const matchSchema = new EntitySchema({
  name: "match",
  columns: {
    ...baseColumnsSchemaPart,
    gameType: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    competitionId: {
      type: "varchar",
      nullable: false,
    },
    competitionName: {
      type: "varchar",
      nullable: false,
    },
    title: {
      type: "varchar",
      nullable: false,
      length: 100,
    },
    marketId: {
      type: "varchar",
      nullable: false,
    },
    eventId: {
      type: "varchar",
      nullable: false,
    },
    teamA: {
      type: "varchar",
      nullable: false,
      length: 100,
    },
    teamB: {
      type: "varchar",
      nullable: false,
      length: 100,
    },
    teamC: {
      type: "varchar",
      nullable: true,
      length: 100,
    },
    startAt: {
      type: "timestamp with time zone",
      nullable: false,
    },
    stopAt: {
      type: "timestamp with time zone",
      nullable: true,
    },

    matchOddMinBet: {
      type: "float",
      nullable: false,
      default: 0,
    },
    matchOddMaxBet: {
      type: "float",
      nullable: false,
      default: 0,
    },
    betFairSessionMinBet: {
      type: "float",
      nullable: false,
      default: 0,
    },
    betFairSessionMaxBet: {
      type: "float",
      nullable: false,
      default: 0,
    },
    betFairBookmakerMinBet: {
      type: "float",
      nullable: false,
      default: 0,
    },
    betFairBookmakerMaxBet: {
      type: "float",
      nullable: false,
      default: 0,
    },

    apiMatchOddActive: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    apiBookMakerActive: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    apiSessionActive: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    manualBookMakerActive: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    manualSessionActive: {
      type: "boolean",
      nullable: false,
      default: false,
    },
    delaySecond: {
      type: "int",
      nullable: true,
    },
  },
  orderBy: {
    startAt: "DESC",
  },
  relations: {
    bookmakers: {
      type: "one-to-many",
      target: "bookmaker",
      inverseSide: "match",
    },
    bettings:{
      type: "one-to-many",
      target: "betting",
      inverseSide: "match",
    }
  },
  indices: [
    {
      name: "match_marketId", // index name should be start with the table name
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["marketId", "gameType"],
    },
  ],
});

module.exports = matchSchema;
