const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1737712183453 {
    name = 'Tournament1737712183453'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "sNo" double precision NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "sNo"`);
    }
}
