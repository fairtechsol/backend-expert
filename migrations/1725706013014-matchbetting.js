const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Matchbetting1725706013014 {
    name = 'Matchbetting1725706013014'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "metaData" jsonb`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "metaData"`);
    }
}
