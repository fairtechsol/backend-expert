const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ExposureLimit1733299423782 {
    name = 'ExposureLimit1733299423782'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "exposureLimit" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "exposureLimit"`);
    }
}
