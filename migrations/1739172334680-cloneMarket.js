const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CloneMarket1739172334680 {
    name = 'CloneMarket1739172334680'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "parentBetId" uuid`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "mid" character varying`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "mid"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "parentBetId"`);
    }
}
