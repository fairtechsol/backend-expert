const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1736913606038 {
    name = 'Tournament1736913606038'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "isManual" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "isManual"`);
    }
}
