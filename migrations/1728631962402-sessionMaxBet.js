const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class SessionMaxBet1728631962402 {
    name = 'SessionMaxBet1728631962402'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ADD "sessionMaxBets" jsonb DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "sessionMaxBets"`);
    }
}
