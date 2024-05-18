const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");
const racingRunnerSchema = new EntitySchema({
    name: "racingRunner",
    columns: {
        ...baseColumnsSchemaPart,
        matchId: {
            type: "uuid",
            nullable: false
        },
        bettingId: {
            type: 'uuid',
            nullable: false
        },
        metadata: {
            type: "jsonb",
            nullable: false
        },
        runnerName: {
            type: 'varchar',
            nullable: false,
        },
        selectionId: {
            type: 'varchar',
            nullable: false
        },
        sortPriority: {
            type: 'int',
            nullable: false
        },
        stopAt: {
            type: "timestamp with time zone",
            nullable: true,
        },

    },
    relations: {
        match: {
            type: "many-to-one",
            target: "racingMatch",
            joinColumn: {
                name: "matchId",
                referencedColumnName: "id",
            },
        },
        bettingId: {
            type: "many-to-one",
            target: "racingBetting",
            joinColumn: {
                name: "bettingId",
                referencedColumnName: "id",
            },
        },
    },
    indices: [
        {
            name: "racingRunners_name", // index name should be start with the table name
            unique: false, // Optional: Set to true if you want a unique index
            columns: ["matchId", "bettingId", "selectionId"],
        },
    ]
});

module.exports = racingRunnerSchema;
