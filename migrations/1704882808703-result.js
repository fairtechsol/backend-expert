const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Result1704882808703 {
    name = 'Result1704882808703'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "betType" character varying NOT NULL, "betId" uuid NOT NULL, "matchId" uuid NOT NULL, "result" character varying NOT NULL, "profitLoss" character varying NOT NULL, CONSTRAINT "UQ_399273f0deaa0a3f9b021e78feb" UNIQUE ("betId"), CONSTRAINT "PK_e8f2a9191c61c15b627c117a678" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "result_id" ON "results" ("matchId", "betId") `);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4"`);
        await queryRunner.query(`DROP INDEX "public"."result_id"`);
        await queryRunner.query(`DROP TABLE "results"`);
    }
}
