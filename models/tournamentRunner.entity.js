const { EntitySchema } = require("typeorm");
const { baseColumnsSchemaPart, teamStatus } = require("../config/contants");
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
        backRate: {
            type: "float",
            default: 0
        },
        layRate: {
            type: "float",
            default: 0
        },
        status: {
            type: 'enum',
            enum: Object.values(teamStatus),
            nullable: true,
            default: teamStatus.suspended
        },
        stopAt: {
            type: "timestamp with time zone",
            nullable: true,
        },
        parentRunnerId:{
            type: "uuid",
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
        {
            name: "tournamentRunners_bettingId", // index name should be start with the table name
            unique: false, // Optional: Set to true if you want a unique index
            columns: ["bettingId", "deletedAt"],
        },
    ]
});

module.exports = tournamentRunnerSchema;
