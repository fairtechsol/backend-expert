const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1736843029695 {
    name = 'Tournament1736843029695'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "isCommissionActive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "isCommissionActive"`);
    }
}
