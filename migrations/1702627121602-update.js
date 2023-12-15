const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702627121602 {
    name = 'Update1702627121602'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairSessionMinBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairSessionMaxBet" double precision NOT NULL DEFAULT '1'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairSessionMaxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairSessionMinBet"`);
    }
}
