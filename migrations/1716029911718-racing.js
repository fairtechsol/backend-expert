const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Racing1716029911718 {
    name = 'Racing1716029911718'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "racingMatchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_043089c6d691284da2a39224499" UNIQUE ("marketId"), CONSTRAINT "PK_6041a3db78cb37a8bcda3dfdf4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "racingMatch_marketId" ON "racingMatchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_type_enum" AS ENUM('matchOdd')`);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "racingBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."racingBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', "activeStatus" "public"."racingBettings_activestatus_enum" NOT NULL DEFAULT 'live', "isActive" boolean NOT NULL DEFAULT false, "stopAt" TIMESTAMP WITH TIME ZONE, "result" character varying, "marketId" character varying, CONSTRAINT "racingBetting_minBet" CHECK ("minBet" >= 0), CONSTRAINT "racingBetting_maxBet" CHECK ("maxBet" > "minBet"), CONSTRAINT "PK_b56151bbb980b87482d50aadec0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "racingBetting_name" ON "racingBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "racingRunners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "bettingId" uuid NOT NULL, "metadata" jsonb NOT NULL, "runnerName" character varying NOT NULL, "selectionId" character varying NOT NULL, "sortPriority" integer NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ddc937b8d2d1dc740fbd92f644c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "racingRunners_name" ON "racingRunners" ("matchId", "bettingId", "selectionId") `);
        await queryRunner.query(`ALTER TABLE "racingBettings" ADD CONSTRAINT "FK_1cae8c1eee3fcb76f9f867b4d7f" FOREIGN KEY ("matchId") REFERENCES "racingMatchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "racingRunners" ADD CONSTRAINT "FK_42d89665ec2bb84df50f370d5ce" FOREIGN KEY ("matchId") REFERENCES "racingMatchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "racingRunners" ADD CONSTRAINT "FK_abd68e5751401b628839526c955" FOREIGN KEY ("bettingId") REFERENCES "racingBettings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingRunners" DROP CONSTRAINT "FK_abd68e5751401b628839526c955"`);
        await queryRunner.query(`ALTER TABLE "racingRunners" DROP CONSTRAINT "FK_42d89665ec2bb84df50f370d5ce"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" DROP CONSTRAINT "FK_1cae8c1eee3fcb76f9f867b4d7f"`);
        await queryRunner.query(`DROP INDEX "public"."racingRunners_name"`);
        await queryRunner.query(`DROP TABLE "racingRunners"`);
        await queryRunner.query(`DROP INDEX "public"."racingBetting_name"`);
        await queryRunner.query(`DROP TABLE "racingBettings"`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_activestatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."racingMatch_marketId"`);
        await queryRunner.query(`DROP TABLE "racingMatchs"`);
    }
}
