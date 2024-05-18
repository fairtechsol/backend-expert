const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");

const racingMatchSchema = new EntitySchema({
    name: "racingMatch",
    columns: {
        ...baseColumnsSchemaPart,
        matchType: {
            type: "varchar",
            nullable: false,
            length: 50,
        },
        competitionId: {
            type: "varchar",
            nullable: false,
        },
        competitionName: {
            type: "varchar",
            nullable: false,
        },
        title: {
            type: "varchar",
            nullable: false,
            length: 100,
        },
        marketId: {
            type: "varchar",
            nullable: false,
            unique: true
        },
        eventId: {
            type: "varchar",
            nullable: false,
        },
        startAt: {
            type: "timestamp with time zone",
            nullable: false,
        },
        stopAt: {
            type: "timestamp with time zone",
            nullable: true,
        },
    },
    orderBy: {
        startAt: "DESC",
    },
    relations: {
        matchBettings: {
            type: "one-to-many",
            target: "racingBetting",
            inverseSide: "racingMatch",
        },
        runners: {
            type: "one-to-many",
            target: "racingRunner",
            inverseSide: "racingMatch",
        }
    },
    indices: [
        {
            name: "racingMatch_marketId", // index name should be start with the table name
            unique: true, // Optional: Set to true if you want a unique index
            columns: ["marketId", "matchType"],
        },
    ]
});

module.exports = racingMatchSchema;
