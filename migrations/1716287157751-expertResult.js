const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ExpertResult1716287157751 {
    name = 'ExpertResult1716287157751'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_d12d593a6679d826e188776ef51"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_d12d593a6679d826e188776ef51" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
