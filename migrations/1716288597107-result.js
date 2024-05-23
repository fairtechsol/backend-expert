const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Result1716288597107 {
    name = 'Result1716288597107'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
