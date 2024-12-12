const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, teamStatus, sessionBettingType, betStatusType, gameTypeMatchBetting } = require("../config/contants");
const {ColumnNumericTransformer} = require('../services/dbService')

const sessionBettingSchema = new EntitySchema({
    name: "sessionBetting",
    columns: {
        ...baseColumnsSchemaPart,
        matchId: {
            type: "uuid",
            nullable: false,
        },
        type: {
            type: 'enum',
            enum: Object.values(sessionBettingType),
            nullable: false
        },
        gtype:{
            type: 'enum',
            enum: Object.values(gameTypeMatchBetting),
            nullable: false,
            default: gameTypeMatchBetting.fancy
          },
        name: {
            type: 'varchar',
            nullable: false
        },
        minBet: {
            type: 'float',
            nullable: false,
            default: 0,
            check: "minBet >= 0",
            transformer: new ColumnNumericTransformer()
        },
        maxBet: {
            type: 'float',
            nullable: false,
            default: 0,
            check: "maxBet > minBet",
            transformer: new ColumnNumericTransformer()
        },
        yesRate: {
            type: 'float',
            nullable: false,
            default: 0,
            transformer: new ColumnNumericTransformer()
        },
        noRate: {
            type: 'float',
            nullable: false,
            default: 0,
            transformer: new ColumnNumericTransformer()
        },
        yesPercent: {
            type: 'float',
            nullable: false,
            default: 0,
            transformer: new ColumnNumericTransformer()
        },
        noPercent: {
            type: 'float',
            nullable: false,
            default: 0,
            transformer: new ColumnNumericTransformer()
        },
        status: {
            type: 'enum',
            enum: Object.values(teamStatus),
            nullable: false,
            default: teamStatus.suspended
        },
        selectionId: {
            type: 'varchar',
            nullable: true
        },
        activeStatus: {
            type: 'enum',
            enum: Object.values(betStatusType),
            nullable: false,
            default: betStatusType.live
        },
        stopAt: {
            type: 'timestamp with time zone',
            nullable: true
        },
        result: {
          type: "varchar",
          nullable: true
        },
        isManual: {
          type: "boolean",
          nullable: false,
          default: true
        },
        exposureLimit:{
            type: "int",
            nullable: true,
        },
        isCommissionActive:{
            type: "boolean",
            default: false
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
            name: "sessionBetting_name",// Optional: Set to true if you want a unique index
            columns: ["matchId", "name"],
        },
    ],
});

module.exports = sessionBettingSchema;
