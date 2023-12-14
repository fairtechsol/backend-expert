const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class NewRunner1702560254763 {
    name = 'NewRunner1702560254763'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."bets_bettype_enum" AS ENUM('back', 'lay', 'yes', 'no')`);
        await queryRunner.query(`CREATE TYPE "public"."bets_markettype_enum" AS ENUM('session', 'match')`);
        await queryRunner.query(`CREATE TABLE "bets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying NOT NULL, "team" character varying NOT NULL, "amount" double precision NOT NULL, "odds" double precision NOT NULL, "winAmount" double precision NOT NULL, "lossAmount" double precision NOT NULL, "betType" "public"."bets_bettype_enum" NOT NULL, "rate" double precision NOT NULL, "marketType" "public"."bets_markettype_enum" NOT NULL, "deleteReason" character varying, "ipAddress" character varying, "browser" character varying, CONSTRAINT "UQ_ddd8dce54aa5f1af36c467c9dae" UNIQUE ("matchId"), CONSTRAINT "PK_7ca91a6a39623bd5c21722bcedd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "bets_betId" ON "bets" ("matchId", "betId") `);
        await queryRunner.query(`CREATE TYPE "public"."bettings_betstatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "bettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "matchType" character varying(50) NOT NULL, "betCondition" character varying(200), "noRate" double precision, "yesRate" double precision, "ratePercent" character varying(50), "sessionStatus" character varying(50) DEFAULT 'suspended', "selectionId" character varying, "sessionBet" boolean NOT NULL DEFAULT true, "betStatus" "public"."bettings_betstatus_enum" NOT NULL DEFAULT 'save', "stopAt" TIMESTAMP WITH TIME ZONE, "betResult" character varying, "sessionMinBet" double precision, "sessionMaxBet" double precision, CONSTRAINT "UQ_1e70b1452c95244c9f8bceae02b" UNIQUE ("matchId"), CONSTRAINT "PK_18baabb46e8b30402aca9c7fdb8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "teamA" character varying(100) NOT NULL, "teamB" character varying(100) NOT NULL, "teamC" character varying(100), "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_8afa35a9cde7e34e88d400dd96d" UNIQUE ("marketId"), CONSTRAINT "PK_0fdbc8e05ccfb9533008b132189" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "match_marketId" ON "matchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TYPE "public"."matchBetings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker', 'tiedMatch')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBetings_statusteam_a_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBetings_statusteam_b_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBetings_statusteam_c_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TABLE "matchBetings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."matchBetings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL, "maxBet" double precision NOT NULL, "backTeam_A" double precision NOT NULL, "backTeam_B" double precision NOT NULL, "backTeamC" double precision, "layTeam_A" double precision NOT NULL, "layTeam_B" double precision NOT NULL, "layTeam_C" double precision, "statusTeam_A" "public"."matchBetings_statusteam_a_enum" NOT NULL, "statusTeam_B" "public"."matchBetings_statusteam_b_enum" NOT NULL, "statusTeam_C" "public"."matchBetings_statusteam_c_enum", "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_f7eb9bfea4081d130580c654fbf" UNIQUE ("matchId"), CONSTRAINT "PK_90504d0f1f7f8ec4b58f8492cbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBetings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."sessionetings_type_enum" AS ENUM('marketSession', 'manualSession', 'overByover', 'ballByBall')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionetings_status_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionetings_betstatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "sessionetings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."sessionetings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL, "maxBet" double precision NOT NULL, "yesRate" double precision NOT NULL, "noRate" double precision NOT NULL, "yesPercent" double precision NOT NULL, "noPercent" double precision NOT NULL, "status" "public"."sessionetings_status_enum" NOT NULL, "selectionId" character varying NOT NULL, "betStatus" "public"."sessionetings_betstatus_enum" NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_15aa0ae74658b367417a4715562" UNIQUE ("matchId"), CONSTRAINT "PK_ea9efc5d6859a1f7dc859647997" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionetings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userName" character varying NOT NULL, "fullName" character varying, "password" character varying NOT NULL, "phoneNumber" character varying, "city" character varying, "allPrivilege" boolean NOT NULL DEFAULT false, "addMatchPrivilege" boolean NOT NULL DEFAULT false, "betFairMatchPrivilege" boolean NOT NULL DEFAULT false, "bookmakerMatchPrivilege" boolean NOT NULL DEFAULT false, "sessionMatchPrivilege" boolean NOT NULL DEFAULT false, "loginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_userName" ON "users" ("id", "userName") `);
        await queryRunner.query(`ALTER TABLE "bets" ADD CONSTRAINT "FK_ddd8dce54aa5f1af36c467c9dae" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bettings" ADD CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matchBetings" ADD CONSTRAINT "FK_f7eb9bfea4081d130580c654fbf" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessionetings" ADD CONSTRAINT "FK_15aa0ae74658b367417a4715562" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionetings" DROP CONSTRAINT "FK_15aa0ae74658b367417a4715562"`);
        await queryRunner.query(`ALTER TABLE "matchBetings" DROP CONSTRAINT "FK_f7eb9bfea4081d130580c654fbf"`);
        await queryRunner.query(`ALTER TABLE "bettings" DROP CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b"`);
        await queryRunner.query(`ALTER TABLE "bets" DROP CONSTRAINT "FK_ddd8dce54aa5f1af36c467c9dae"`);
        await queryRunner.query(`DROP INDEX "public"."user_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`DROP TABLE "sessionetings"`);
        await queryRunner.query(`DROP TYPE "public"."sessionetings_betstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionetings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionetings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`DROP TABLE "matchBetings"`);
        await queryRunner.query(`DROP TYPE "public"."matchBetings_statusteam_c_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBetings_statusteam_b_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBetings_statusteam_a_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBetings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."match_marketId"`);
        await queryRunner.query(`DROP TABLE "matchs"`);
        await queryRunner.query(`DROP TABLE "bettings"`);
        await queryRunner.query(`DROP TYPE "public"."bettings_betstatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."bets_betId"`);
        await queryRunner.query(`DROP TABLE "bets"`);
        await queryRunner.query(`DROP TYPE "public"."bets_markettype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."bets_bettype_enum"`);
    }
}
