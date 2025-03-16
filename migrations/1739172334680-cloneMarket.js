const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CloneMarket1739172334680 {
    name = 'CloneMarket1739172334680'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "parentBetId" uuid`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "mid" character varying`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD "parentRunnerId" uuid`);
        await queryRunner.query(`UPDATE "tournamentBettings" set "mid" = "marketId"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "mid"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "parentBetId"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP COLUMN "parentRunnerId"`);
    }
}
