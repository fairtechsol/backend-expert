const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");

const expertResultSchema = new EntitySchema({
  name: "expertResult",
  columns: {
    ...baseColumnsSchemaPart,
    matchId: {
      type: "uuid",
      nullable: false
    },
    userId: {
      type: "uuid",
      nullable: false
    },
    betId: {
        type: "uuid",
        nullable: false
    },
    result: {
      type: 'varchar',
      nullable: true
    },
    isApprove: {
      type: 'boolean',
      nullable: false
    },
   isReject: {
    type: 'boolean',
    nullable: false
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
    user:{
      type: "many-to-one",
      target: "user",
      joinColumn: {
        name: "userId",
        referencedColumnName: "id",
      },
    }
  },
  indices: [
    {
      name: "expertResult_id", // index name should be start with the table name
      unique: false, // Optional: Set to true if you want a unique index
      columns: ["matchId", "userId", "betId"],
    },
  ]
});

module.exports = expertResultSchema;
