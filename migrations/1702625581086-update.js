const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702625581086 {
    name = 'Update1702625581086'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "UQ_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "UQ_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "UQ_141d7ed86370e28ffa9ebe1dd4f" UNIQUE ("matchId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "UQ_cf6da9fb9015e506d67752d0c99" UNIQUE ("matchId")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
