const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class RaceBetting1716882476059 {
    name = 'RaceBetting1716882476059'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'save'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
    }
}
