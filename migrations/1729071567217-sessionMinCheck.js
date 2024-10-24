const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class SessionMinCheck1729071567217 {
    name = 'SessionMinCheck1729071567217'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP CONSTRAINT "tournamentBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" DROP CONSTRAINT "racingBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "matchBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP CONSTRAINT "match_betFairSessionMaxBet"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD CONSTRAINT "tournamentBetting_maxBet" CHECK ("maxBet" >= "minBet")`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ADD CONSTRAINT "racingBetting_maxBet" CHECK ("maxBet" >= "minBet")`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "matchBetting_maxBet" CHECK ("maxBet" >= "minBet")`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD CONSTRAINT "match_betFairSessionMaxBet" CHECK ("betFairSessionMaxBet" >= "betFairSessionMinBet")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP CONSTRAINT "tournamentBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" DROP CONSTRAINT "racingBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "matchBetting_maxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP CONSTRAINT "match_betFairSessionMaxBet"`);
    }
}
