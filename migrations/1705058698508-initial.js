const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Initial1705058698508 {
    name = 'Initial1705058698508'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "expertResults" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "userId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying, "isApprove" boolean NOT NULL, "isReject" boolean NOT NULL, CONSTRAINT "PK_d8805413e56866dcc43a767ddd7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "expertResult_id" ON "expertResults" ("matchId", "userId", "betId") `);
        await queryRunner.query(`CREATE TABLE "matchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "teamA" character varying(100) NOT NULL, "teamB" character varying(100) NOT NULL, "teamC" character varying(100), "betFairSessionMinBet" double precision NOT NULL DEFAULT '0', "betFairSessionMaxBet" double precision NOT NULL DEFAULT '1', "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, "apiSessionActive" boolean NOT NULL DEFAULT false, "manualSessionActive" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_8afa35a9cde7e34e88d400dd96d" UNIQUE ("marketId"), CONSTRAINT "match_betFairSessionMinBet" CHECK ("betFairSessionMinBet" >= 0), CONSTRAINT "match_betFairSessionMaxBet" CHECK ("betFairSessionMaxBet" > "betFairSessionMinBet"), CONSTRAINT "PK_0fdbc8e05ccfb9533008b132189" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "match_marketId" ON "matchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'completeMatch')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteama_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamb_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamc_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "matchBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."matchBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', "backTeamA" double precision NOT NULL DEFAULT '0', "backTeamB" double precision NOT NULL DEFAULT '0', "backTeamC" double precision NOT NULL DEFAULT '0', "layTeamA" double precision NOT NULL DEFAULT '0', "layTeamB" double precision NOT NULL DEFAULT '0', "layTeamC" double precision NOT NULL DEFAULT '0', "statusTeamA" "public"."matchBettings_statusteama_enum" NOT NULL DEFAULT 'suspended', "statusTeamB" "public"."matchBettings_statusteamb_enum" NOT NULL DEFAULT 'suspended', "statusTeamC" "public"."matchBettings_statusteamc_enum" DEFAULT 'suspended', "activeStatus" "public"."matchBettings_activestatus_enum" NOT NULL DEFAULT 'live', "isActive" boolean NOT NULL DEFAULT false, "stopAt" TIMESTAMP WITH TIME ZONE, "result" character varying, "isManual" boolean NOT NULL DEFAULT true, "marketId" character varying, CONSTRAINT "matchBetting_minBet" CHECK ("minBet" >= 0), CONSTRAINT "matchBetting_maxBet" CHECK ("maxBet" > "minBet"), CONSTRAINT "PK_a138f4924e867722232da45ae38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "betType" character varying NOT NULL, "betId" uuid NOT NULL, "matchId" uuid NOT NULL, "result" character varying NOT NULL, "profitLoss" character varying NOT NULL, CONSTRAINT "UQ_399273f0deaa0a3f9b021e78feb" UNIQUE ("betId"), CONSTRAINT "PK_e8f2a9191c61c15b627c117a678" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "result_id" ON "results" ("matchId", "betId") `);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'overByover', 'ballByBall')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_status_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "sessionBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."sessionBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '0', "yesRate" double precision NOT NULL DEFAULT '0', "noRate" double precision NOT NULL DEFAULT '0', "yesPercent" double precision NOT NULL DEFAULT '0', "noPercent" double precision NOT NULL DEFAULT '0', "status" "public"."sessionBettings_status_enum" NOT NULL DEFAULT 'suspended', "selectionId" character varying, "activeStatus" "public"."sessionBettings_activestatus_enum" NOT NULL DEFAULT 'live', "stopAt" TIMESTAMP WITH TIME ZONE, "result" character varying, "isManual" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_d3822a4209cb5e9c4bea092c3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "systemTables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "type" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_c70d94890c6018a3a4ad2d01a56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "systemTable_type" ON "systemTables" ("type") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userName" character varying NOT NULL, "fullName" character varying, "password" character varying NOT NULL, "phoneNumber" character varying, "city" character varying, "allPrivilege" boolean NOT NULL DEFAULT false, "addMatchPrivilege" boolean NOT NULL DEFAULT false, "betFairMatchPrivilege" boolean NOT NULL DEFAULT false, "bookmakerMatchPrivilege" boolean NOT NULL DEFAULT false, "sessionMatchPrivilege" boolean NOT NULL DEFAULT false, "loginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_userName" ON "users" ("id", "userName") `);
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_d12d593a6679d826e188776ef51" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_45643fb8ef7b26097eac4170e3a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_45643fb8ef7b26097eac4170e3a"`);
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_d12d593a6679d826e188776ef51"`);
        await queryRunner.query(`DROP INDEX "public"."user_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."systemTable_type"`);
        await queryRunner.query(`DROP TABLE "systemTables"`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`DROP TABLE "sessionBettings"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_activestatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."result_id"`);
        await queryRunner.query(`DROP TABLE "results"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`DROP TABLE "matchBettings"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_activestatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamc_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamb_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteama_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."match_marketId"`);
        await queryRunner.query(`DROP TABLE "matchs"`);
        await queryRunner.query(`DROP INDEX "public"."expertResult_id"`);
        await queryRunner.query(`DROP TABLE "expertResults"`);
    }
}
