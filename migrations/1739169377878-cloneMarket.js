const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class CloneMarket1739169377878 {
    name = 'CloneMarket1739169377878'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "parentBetId" uuid`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "parentBetId"`);
    }
}
