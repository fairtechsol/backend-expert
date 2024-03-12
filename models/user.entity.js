const { EntitySchema } = require("typeorm");
const {
  baseColumnsSchemaPart,
} = require("./../config/contants");

const userSchema = new EntitySchema({
  name: "user",
  columns: {
    ...baseColumnsSchemaPart,
    userName: {
      type: "varchar",
      nullable: false,
      unique: true,
    },
    fullName: {
      type: "varchar",
      nullable: true,
    },
    password: {
      type: "varchar",
      nullable: false,
    },
    phoneNumber: {
      type: "varchar",
      nullable: true,
    },
    city: {
      type: "varchar",
      nullable: true,
    },
    allPrivilege: {
      type: "boolean",
      nullable: false,
      default:false
    },
    remark: {
      type: 'varchar',
      nullable: true
    },
    addMatchPrivilege: {
      type: "boolean",
      nullable: false,
      default:false
    },
    betFairMatchPrivilege: {
      type: "boolean",
      nullable: false,
      default:false
    },
    bookmakerMatchPrivilege: {
      type: "boolean",
      nullable: false,
      default:false
    },
    sessionMatchPrivilege: {
      type: "boolean",
      nullable: false,
      default:false
    },
    loginAt: {
      type: "timestamp with time zone",
      nullable: true,
      default: null,
    },
    userBlock:{
      type:"boolean",
      nullable:false,
      default:false
    },
    blockBy:{
      type:"uuid",
      nullable:true
    }
  },
  orderBy: {
    userName: "ASC",
  },
  indices: [
    {
      name: "user_userName", // index name should be start with the table name
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["id", "userName"],
    },
  ],
});

module.exports = userSchema;
