const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702618783595 {
    name = 'Update1702618783595'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."betPlaced_betId"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" DROP CONSTRAINT "FK_43a5c551e5729b21d778491ea19"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" DROP CONSTRAINT "UQ_43a5c551e5729b21d778491ea19"`);
        await queryRunner.query(`CREATE INDEX "betPlaced_betId_userId" ON "betPlaceds" ("matchId", "betId", "userId") `);
        await queryRunner.query(`ALTER TABLE "betPlaceds" ADD CONSTRAINT "FK_43a5c551e5729b21d778491ea19" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "betPlaceds" DROP CONSTRAINT "FK_43a5c551e5729b21d778491ea19"`);
        await queryRunner.query(`DROP INDEX "public"."betPlaced_betId_userId"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" ADD CONSTRAINT "UQ_43a5c551e5729b21d778491ea19" UNIQUE ("matchId")`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" ADD CONSTRAINT "FK_43a5c551e5729b21d778491ea19" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX "betPlaced_betId" ON "betPlaceds" ("matchId", "betId") `);
    }
}
