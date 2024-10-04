const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Betting1728034610360 {
    name = 'Betting1728034610360'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "betLimit" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "betLimit" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "betLimit"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "betLimit"`);
    }
}
