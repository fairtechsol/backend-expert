const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Commission1709537053666 {
    name = 'Commission1709537053666'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" ADD "commission" numeric(13,2) NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" DROP COLUMN "commission"`);
    }
}
