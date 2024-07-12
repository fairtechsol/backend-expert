const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, bettingType } = require("../config/contants");
const { ColumnNumericTransformer } = require("../services/dbService");

const resultSchema = new EntitySchema({
  name: "result",
  columns: {
    ...baseColumnsSchemaPart,
    betType: {
      type: "varchar",
      enum: Object.values(bettingType),
      nullable: false,
    },
    betId: {
      type: "uuid",
      nullable: false,
      unique: true
    },
    matchId: {
      type: "uuid",
      nullable: false,
    },
    result: {
      type: "varchar",
      nullable: false,
    },
    profitLoss: {
      type: "varchar",
      nullable: false,
    },
    commission:{
      type: 'decimal',
      nullable: false,
      precision: 13,
      scale: 2,
      default: 0,
      transformer: new ColumnNumericTransformer()
    }
  },
  indices: [
    {
      name: "result_id", // index name should be start with the table name
      unique: false, // Optional: Set to true if you want a unique index
      columns: ["matchId", "betId"],
    },
  ],
});

module.exports = resultSchema;
