const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class MatchBettingApiType1724134727867 {
    name = 'MatchBettingApiType1724134727867'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingBettings" ADD "apiType" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "apiType" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "sessionApiType" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "sessionApiType"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "apiType"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" DROP COLUMN "apiType"`);
    }
}
