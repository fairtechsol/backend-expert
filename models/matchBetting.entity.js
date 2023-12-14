const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, matchBettingType, teamStatus } = require("../config/contants");

const matchBettingSchema = new EntitySchema({
  name: "matchBeting",
  columns: {
    ...baseColumnsSchemaPart,
    matchId: {
      type: "uuid",
      nullable: false,
      unique: true,
    },
    type : {
      type: 'enum',
      enum: Object.values(matchBettingType),
      nullable: false
    },
    name : {
      type: 'varchar',
      nullable: false
    },
    minBet : {
      type: 'float',
      nullable: false
    },
    maxBet : {
      type: 'float',
      nullable: false
    },
    backTeam_A : {
      type: 'float',
      nullable: false
    },
    backTeam_B : {
      type: 'float',
      nullable: false
    },
    backTeamC : {
      type: 'float',
      nullable: true
    },
    layTeam_A : {
      type: 'float',
      nullable: false
    },
    layTeam_B : {
      type: 'float',
      nullable: false
    },
    layTeam_C : {
      type: 'float',
      nullable: true
    },
    statusTeam_A : {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: false
    },
    statusTeam_B : {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: false
    },
    statusTeam_C : {
      type: 'enum',
      enum: Object.values(teamStatus),
      nullable: true
    },
    stopAt :{
      type: 'timestamp with time zone',
      nullable: true
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
      unique: true, // Optional: Set to true if you want a unique index
      columns: ["matchId", "name"],
    },
  ],
});

module.exports = matchBettingSchema;
