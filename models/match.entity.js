const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");
const { ColumnNumericTransformer } = require("../services/commonService");

const matchSchema = new EntitySchema({
  name: "match",
  columns: {
    ...baseColumnsSchemaPart,
    matchType: {
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
      unique:true
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
    betFairSessionMinBet : {
      type: 'float',
      nullable: false,
      default : 0,
      check: "betFairSessionMinBet >= 0",
      transformer : new ColumnNumericTransformer()
    },
    betFairSessionMaxBet : {
      type: 'float',
      nullable: false,
      default : 1,
      check: "betFairSessionMaxBet > betFairSessionMinBet",
      transformer : new ColumnNumericTransformer()
    },
    startAt: {
      type: "timestamp with time zone",
      nullable: false,
    },
    stopAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
  },
  orderBy: {
    startAt: "DESC",
  },
  relations: {
    matchBettings: {
      type: "one-to-many",
      target: "matchBetting",
      inverseSide: "match",
    },
    sessionBettings:{
      type: "one-to-many",
      target: "sessionBetting",
      inverseSide: "match",
    },
    betPlaceds:{
      type: "one-to-many",
      target: "betPlaced",
      inverseSide: "match",
    }
  },
  indices: [
    {
      name: "match_marketId", // index name should be start with the table name
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["marketId", "matchType"],
    },
  ],
  // checks : [{
  //   name: "match_betFairSessionMinBet",
  //   expression: `"betFairSessionMinBet" >= 0`
  // },{
  //   name: "match_betFairSessionMaxBet",
  //   expression: `"betFairSessionMaxBet" > "betFairSessionMinBet"`
  // }]
});

module.exports = matchSchema;
