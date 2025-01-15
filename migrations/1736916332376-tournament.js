const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1736916332376 {
    name = 'Tournament1736916332376'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "rate"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "backRate" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "layRate" double precision NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "layRate"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "backRate"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "rate" double precision NOT NULL DEFAULT '0'`);
    }
}
