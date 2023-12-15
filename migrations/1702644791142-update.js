const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702644791142 {
    name = 'Update1702644791142'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ADD CONSTRAINT "match_betFairSessionMinBet" CHECK ("betFairSessionMinBet" >= 0)`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD CONSTRAINT "match_betFairSessionMaxBet" CHECK ("betFairSessionMaxBet" > "betFairSessionMinBet")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" DROP CONSTRAINT "match_betFairSessionMaxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP CONSTRAINT "match_betFairSessionMinBet"`);
    }
}
