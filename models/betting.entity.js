const { EntitySchema } = require("typeorm");
const { betStatus } = require("../config/contants");

const bettingSchema = new EntitySchema({
  name: "betting",
  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },
    matchId: {
      type: "uuid",
      nullable: false,
      unique: true,
    },
    matchType: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    betCondition: {
      type: "varchar",
      length: 200,
      nullable: false,
    },
    noRate: {
      type: "float",
      nullable: true,
    },
    yesRate: {
      type: "float",
      nullable: true,
    },
    ratePercent: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    sessionStatus: {
      type: "varchar",
      length: 50,
      nullable: true,
      default: "suspended",
    },
    selectionId: {
      type: "varchar",
      nullable: true,
    },
    sessionBet: {
      type: "boolean",
      nullable: false,
      default: true,
    },
    betStatus: {
      type: "enum",
      enum: Object.values(betStatus),
      default: betStatus.save,
    },
    stopAt: {
      type: "timestamp with time zone",
      nullable: true,
    },
    betResult: {
      type: "varchar",
      nullable: true,
    },
    sessionMinBet: {
      type: "float",
      nullable: true,
    },
    sessionMaxBet: {
      type: "float",
      nullable: true,
    },
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
});

module.exports = bettingSchema;
