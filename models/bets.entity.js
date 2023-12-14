const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, betType, bettingType } = require("../config/contants");

const betSchema = new EntitySchema({
  name: "bet",
  columns: {
    ...baseColumnsSchemaPart,
    matchId: {
      type: "uuid",
      nullable: false,
      unique: true,
    },
    betId : {
        type : 'uuid',
        nullable : false,
    },
    result : {
        type : 'varchar',
        nullable : false,
    },
    team : {
        type : 'varchar',   // add team name or session name
        nullable : false,
    },
    amount : {
        type : 'float',
        nullable : false,
    },
    odds : {
        type : 'float',
        nullable : false,
    },
    winAmount : {
        type : 'float',
        nullable : false,
    },
    lossAmount : {
        type : 'float',
        nullable : false,
    },
    betType : {
        type: 'enum',
        enum: Object.values(betType),
        nullable: false
    },
    rate : {
        type : 'float',
        nullable : false,
    },
    marketType : {
        type: 'enum',
        enum: Object.values(bettingType),
        nullable: false
    },
    deleteReason :{
        type : 'varchar',
        nullable : true
    },
    ipAddress : {
        type : 'varchar',
        nullable : true
    },
    browser : {
        type : 'varchar',
        nullable : true
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
      name: "bets_betId", // index name should be start with the table name
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["matchId", "betId"],
    },
  ],
});

module.exports = betSchema;
