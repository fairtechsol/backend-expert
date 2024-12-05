const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class TournamentExposureLimit1733397660575 {
    name = 'TournamentExposureLimit1733397660575'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "exposureLimit" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "exposureLimit"`);
    }
}
