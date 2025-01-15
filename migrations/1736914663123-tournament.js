const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1736914663123 {
    name = 'Tournament1736914663123'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "rate" double precision NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "rate"`);
    }
}
