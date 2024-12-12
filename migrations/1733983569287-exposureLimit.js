const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ExposureLimit1733983569287 {
    name = 'ExposureLimit1733983569287'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "exposureLimit" integer`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "exposureLimit" integer`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "isCommissionActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "exposureLimit" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "exposureLimit"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "isCommissionActive"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "exposureLimit"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "exposureLimit"`);
    }
}
