const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class User1705912022921 {
    name = 'User1705912022921'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "userBlock" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "blockBy" uuid`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "blockBy"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "userBlock"`);
    }
}
