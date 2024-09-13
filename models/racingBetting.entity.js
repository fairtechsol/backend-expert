const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, betStatusType, racingBettingType } = require("../config/contants");
const {ColumnNumericTransformer} = require('../services/dbService')
const racingBettingSchema = new EntitySchema({
  name: "racingBetting",
  columns: {
    ...baseColumnsSchemaPart,
    matchId: {
      type: "uuid",
      nullable: false
    },
    type: {
      type: 'enum',
      enum: Object.values(racingBettingType),
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
      nullable: true,
      default: 0
    }
  },
  relations: {
    match: {
      type: "many-to-one",
      target: "racingMatch",
      joinColumn: {
        name: "matchId",
        referencedColumnName: "id",
      },
    },
    runners: {
        type: "one-to-many",
        target: "racingRunner",
        inverseSide: "racingBetting",
      }
  },
  indices: [
    {
      name: "racingBetting_name", // index name should be start with the table name
      unique: false, // Optional: Set to true if you want a unique index
      columns: ["matchId", "name"],
    },
  ],
  checks: [
    {
      name: "racingBetting_minBet",
      expression: `"minBet" >= 0`
    },
    {
      name: "racingBetting_maxBet",
      expression: `"maxBet" > "minBet"`
    }
  ]
});

module.exports = racingBettingSchema;
