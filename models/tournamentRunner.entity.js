const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart } = require("../config/contants");
const tournamentRunnerSchema = new EntitySchema({
    name: "tournamentRunner",
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
            nullable: true
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
        rate: {
            type: "float",
            default: 0
        },
        stopAt: {
            type: "timestamp with time zone",
            nullable: true,
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
        betting: {
            type: "many-to-one",
            target: "tournamentBetting",
            joinColumn: {
                name: "bettingId",
                referencedColumnName: "id",
            },
        },
    },
    indices: [
        {
            name: "tournamentRunners_name", // index name should be start with the table name
            unique: false, // Optional: Set to true if you want a unique index
            columns: ["matchId", "bettingId", "selectionId"],
        },
    ]
});

module.exports = tournamentRunnerSchema;
