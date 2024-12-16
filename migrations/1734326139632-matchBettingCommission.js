const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class MatchBettingCommission1734326139632 {
    name = 'MatchBettingCommission1734326139632'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "isCommissionActive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "isCommissionActive"`);
    }
}
