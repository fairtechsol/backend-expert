const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ExposureLimit1733123432977 {
    name = 'ExposureLimit1733123432977'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "exposureLimit" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "exposureLimit"`);
    }
}
