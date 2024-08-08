const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Match1723103495389 {
    name = 'Match1723103495389'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ADD "rateThan100" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "rateThan100"`);
    }
}
