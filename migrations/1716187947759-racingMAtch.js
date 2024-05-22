const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class RacingMAtch1716187947759 {
    name = 'RacingMAtch1716187947759'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingMatchs" ADD "betPlaceStartBefore" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingMatchs" DROP COLUMN "betPlaceStartBefore"`);
    }
}
