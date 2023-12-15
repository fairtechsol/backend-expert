const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, betType, bettingType } = require("../config/contants");
const { ColumnNumericTransformer } = require("../services/commonService");

const betPlacedSchema = new EntitySchema({
  name: "betPlaced",
  columns: {
    ...baseColumnsSchemaPart,
    userId :{
      type: "uuid",
      nullable: false
    },
    matchId: {
      type: "uuid",
      nullable: false
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
        default : 0,
        transformer : new ColumnNumericTransformer()
    },
    odds : {
        type : 'float',
        nullable : false,
        default : 0,
        transformer : new ColumnNumericTransformer()
    },
    winAmount : {
        type : 'float',
        nullable : false,
        default : 0,
        transformer : new ColumnNumericTransformer()
    },
    lossAmount : {
        type : 'float',
        nullable : false,
        default : 0,
        transformer : new ColumnNumericTransformer()
    },
    betType : {
        type: 'enum',
        enum: Object.values(betType),
        nullable: false
    },
    rate : {
        type : 'float',
        nullable : false,
        default : 0,
        transformer : new ColumnNumericTransformer()
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
      name: "betPlaced_betId_userId", // index name should be start with the table name
      columns: ["matchId", "betId","userId"],
    },
  ],
});

module.exports = betPlacedSchema;
