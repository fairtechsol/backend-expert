const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Session1733890980227 {
    name = 'Session1733890980227'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "isCommissionActive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "isCommissionActive"`);
    }
}
