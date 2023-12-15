const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, teamStatus, sessionBettingType, betStatusType } = require("../config/contants");
const { ColumnNumericTransformer } = require("../services/commonService");

const sessionBettingSchema = new EntitySchema({
    name: "sessionBetting",
    columns: {
        ...baseColumnsSchemaPart,
        matchId: {
            type: "uuid",
            nullable: false,
            unique: true,
        },
        type: {
            type: 'enum',
            enum: Object.values(sessionBettingType),
            nullable: false
        },
        name : {
            type: 'varchar',
            nullable: false
        },
        minBet : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        maxBet : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        yesRate : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        noRate : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        yesPercent : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        noPercent : {
            type: 'float',
            nullable: false,
            default : 0,
            transformer : new ColumnNumericTransformer()
        },
        status : {
            type: 'enum',
            enum: Object.values(teamStatus),
            nullable: false,
            default : teamStatus.suspended
        },
        selectionId : {
            type: 'varchar',
            nullable: false
        },
        betStatus : {
            type: 'enum',
            enum: Object.values(betStatusType),
            nullable: false,
            default : betStatusType.live
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
            name: "sessionBetting_name", // index name should be start with the table name
            unique: true, // Optional: Set to true if you want a unique index
            columns: ["matchId", "name"],
        },
    ],
});

module.exports = sessionBettingSchema;
