const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, betStatusType, matchBettingType, gameTypeMatchBetting } = require("../config/contants");
const {ColumnNumericTransformer} = require('../services/dbService')
const tournamentBettingSchema = new EntitySchema({
  name: "tournamentBetting",
  columns: {
    ...baseColumnsSchemaPart,
    matchId: {
      type: "uuid",
      nullable: false
    },
    type: {
      type: 'enum',
      enum: Object.values(matchBettingType),
      nullable: false
    },
    name: {
      type: 'varchar',
      nullable: false
    },
    minBet: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    maxBet: {
      type: 'float',
      nullable: false,
      default: 1,
      transformer: new ColumnNumericTransformer()
    },
    activeStatus: {
      type: 'enum',
      enum: Object.values(betStatusType),
      nullable: false,
      default: betStatusType.save
    },
    isActive: {
      type: "boolean",
      default: false,
      nullable: false,
    },
    stopAt: {
      type: 'timestamp with time zone',
      nullable: true
    },
    result: {
      type: "varchar",
      nullable: true
    },
    marketId : {
      type : "varchar",
      nullable : true
    },
    apiType:{
      type: "int",
      nullable: false,
      default: 0
    },
    gtype:{
      type: 'enum',
      enum: Object.values(gameTypeMatchBetting),
      nullable: false,
      default: gameTypeMatchBetting.match1
    },
    betLimit: {
      type: "int",
      nullable: false,
      default: 0
    }
  },
  relations: {
    match: {
      type: "many-to-one",
      target: "match",
      joinColumn: {
        name: "matchId",
        referencedColumnName: "id",
      },
    },
    runners: {
        type: "one-to-many",
        target: "tournamentRunner",
        inverseSide: "betting",
      }
  },
  indices: [
    {
      name: "tournamentBetting_name", // index name should be start with the table name
      unique: false, // Optional: Set to true if you want a unique index
      columns: ["matchId", "name"],
    },
  ],
  checks: [
    {
      name: "tournamentBetting_minBet",
      expression: `"minBet" >= 0`
    },
    {
      name: "tournamentBetting_maxBet",
      expression: `"maxBet" >= "minBet"`
    }
  ]
});

module.exports = tournamentBettingSchema;
