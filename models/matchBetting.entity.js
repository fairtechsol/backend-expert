const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, matchBettingType, teamStatus, betStatusType } = require("../config/contants");
const { ColumnNumericTransformer } = require("../services/commonService");
const e = require("express");

const matchBettingSchema = new EntitySchema({
  name: "matchBetting",
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
    backTeamA: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    backTeamB: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    backTeamC: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    layTeamA: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    layTeamB: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    layTeamC: {
      type: 'float',
      nullable: false,
      default: 0,
      transformer: new ColumnNumericTransformer()
    },
    statusTeamA: {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: false,
      default: teamStatus.suspended
    },
    statusTeamB: {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: false,
      default: teamStatus.suspended
    },
    statusTeamC: {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: true,
      default: teamStatus.suspended
    },
    activeStatus: {
      type: 'enum',
      enum: Object.values(betStatusType),
      nullable: false,
      default: betStatusType.live
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
    isManuall: {
      type: "boolean",
      nullable: false,
      default: true
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
  },
  indices: [
    {
      name: "matchBeting_name", // index name should be start with the table name
      unique: false, // Optional: Set to true if you want a unique index
      columns: ["matchId", "name"],
    },
  ],
  checks: [
    {
      name: "matchBetting_minBet",
      expression: `"minBet" >= 0`
    },
    {
      name: "matchBetting_maxBet",
      expression: `"maxBet" > "minBet"`
    }
  ]
});

module.exports = matchBettingSchema;
