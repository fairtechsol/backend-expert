const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");

const blinkingTabsSchema = new EntitySchema({
  name: "blinkingTabs",
  columns: {
    ...baseColumnsSchemaPart,
    matchType: {
      type: "varchar",
      nullable: false,
      length: 50,
    },
    order:{
        type: "int",
        nullable: false
    },
    matchId: {
      type: "uuid",
      nullable: false,
      unique: true
    },
    matchName: {
      type: "varchar",
      nullable: false,
    },
   
  },
  orderBy: {
    createdAt: "DESC",
  },
});

module.exports = blinkingTabsSchema;
