const { EntitySchema } = require("typeorm");
const { betStatus } = require("../config/contants");

const bookmakerSchema = new EntitySchema({
  name: "bookmaker",
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
    betId: {
      type: "uuid",
      nullable: false,
      unique: true,
    },
    matchType: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    marketType: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    marketName: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    minBet: {
      type: "float",
      nullable: true,
    },
    maxBet: {
      type: "float",
      nullable: true,
    },
    teamABack: {
      type: "float",
      nullable: true,
    },
    teamBBack: {
      type: "float",
      nullable: true,
    },
    teamCBack: {
      type: "float",
      nullable: true,
    },
    teamAStatus: {
      type: "varchar",
      nullable: true,
      default: "suspended",
    },
    teamBStatus: {
      type: "varchar",
      nullable: true,
      default: "suspended",
    },
    teamCStatus: {
      type: "varchar",
      nullable: true,
      default: "suspended",
    },
    teamALay: {
      type: "float",
      nullable: true,
    },
    teamBLay: {
      type: "float",
      nullable: true,
    },
    teamCLay: {
      type: "float",
      nullable: true,
    },
    betStatus: {
      type: "enum",
      enum: Object.values(betStatus),
      default: betStatus.save,
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
  indices: [
    {
      name: "bookmaker_marketName", // index name should be start with the table name
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["matchId", "marketName"],
    },
  ],
});

module.exports = bookmakerSchema;
