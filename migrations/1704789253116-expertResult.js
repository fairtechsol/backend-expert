const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class ExpertResult1704789253116 {
    name = 'ExpertResult1704789253116'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "expertResults" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "userId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying, "isApprove" boolean NOT NULL, "isReject" boolean NOT NULL, CONSTRAINT "PK_d8805413e56866dcc43a767ddd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "expertResult_id" ON "expertResults" ("matchId", "userId", "betId") `);
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_d12d593a6679d826e188776ef51" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_45643fb8ef7b26097eac4170e3a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
   
        await queryRunner.query(`CREATE TABLE "results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "betType" character varying NOT NULL, "betId" uuid NOT NULL, "matchId" uuid NOT NULL, "result" character varying NOT NULL, "profitLoss" character varying NOT NULL, CONSTRAINT "UQ_399273f0deaa0a3f9b021e78feb" UNIQUE ("betId"), CONSTRAINT "PK_e8f2a9191c61c15b627c117a678" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "result_id" ON "results" ("matchId", "betId") `);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_45643fb8ef7b26097eac4170e3a"`);
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_d12d593a6679d826e188776ef51"`);
        await queryRunner.query(`DROP INDEX "public"."expertResult_id"`);
        await queryRunner.query(`DROP TABLE "expertResults"`);

        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4"`);
        await queryRunner.query(`DROP INDEX "public"."result_id"`);
        await queryRunner.query(`DROP TABLE "results"`);
    }
}
