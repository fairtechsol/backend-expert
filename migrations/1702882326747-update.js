const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702882326747 {
    name = 'Update1702882326747'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "isActive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "isActive"`);
    }
}
