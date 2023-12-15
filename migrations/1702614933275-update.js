const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702614933275 {
    name = 'Update1702614933275'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "bets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying NOT NULL, "team" character varying NOT NULL, "amount" double precision NOT NULL, "odds" double precision NOT NULL, "winAmount" double precision NOT NULL, "lossAmount" double precision NOT NULL, "betType" "public"."bets_bettype_enum" NOT NULL, "rate" double precision NOT NULL, "marketType" "public"."bets_markettype_enum" NOT NULL, "deleteReason" character varying, "ipAddress" character varying, "browser" character varying, CONSTRAINT "UQ_ddd8dce54aa5f1af36c467c9dae" UNIQUE ("matchId"), CONSTRAINT "PK_7ca91a6a39623bd5c21722bcedd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "bet_betId" ON "bets" ("matchId", "betId") `);
        await queryRunner.query(`CREATE TABLE "bettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "matchType" character varying(50) NOT NULL, "betCondition" character varying(200), "noRate" double precision, "yesRate" double precision, "ratePercent" character varying(50), "sessionStatus" character varying(50) DEFAULT 'suspended', "selectionId" character varying, "sessionBet" boolean NOT NULL DEFAULT true, "betStatus" "public"."bettings_betstatus_enum" NOT NULL DEFAULT 'save', "stopAt" TIMESTAMP WITH TIME ZONE, "betResult" character varying, "sessionMinBet" double precision, "sessionMaxBet" double precision, CONSTRAINT "UQ_1e70b1452c95244c9f8bceae02b" UNIQUE ("matchId"), CONSTRAINT "PK_18baabb46e8b30402aca9c7fdb8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "teamA" character varying(100) NOT NULL, "teamB" character varying(100) NOT NULL, "teamC" character varying(100), "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_8afa35a9cde7e34e88d400dd96d" UNIQUE ("marketId"), CONSTRAINT "PK_0fdbc8e05ccfb9533008b132189" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "match_marketId" ON "matchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker', 'tiedMatch')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_a_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_b_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_c_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TABLE "matchBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."matchBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL, "maxBet" double precision NOT NULL, "backTeam_A" double precision NOT NULL, "backTeam_B" double precision NOT NULL, "backTeamC" double precision, "layTeam_A" double precision NOT NULL, "layTeam_B" double precision NOT NULL, "layTeam_C" double precision, "statusTeam_A" "public"."matchBettings_statusteam_a_enum" NOT NULL, "statusTeam_B" "public"."matchBettings_statusteam_b_enum" NOT NULL, "statusTeam_C" "public"."matchBettings_statusteam_c_enum", "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_cf6da9fb9015e506d67752d0c99" UNIQUE ("matchId"), CONSTRAINT "PK_a138f4924e867722232da45ae38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('marketSession', 'manualSession', 'overByover', 'ballByBall')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_status_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_betstatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "sessionBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."sessionBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL, "maxBet" double precision NOT NULL, "yesRate" double precision NOT NULL, "noRate" double precision NOT NULL, "yesPercent" double precision NOT NULL, "noPercent" double precision NOT NULL, "status" "public"."sessionBettings_status_enum" NOT NULL, "selectionId" character varying NOT NULL, "betStatus" "public"."sessionBettings_betstatus_enum" NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_141d7ed86370e28ffa9ebe1dd4f" UNIQUE ("matchId"), CONSTRAINT "PK_d3822a4209cb5e9c4bea092c3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userName" character varying NOT NULL, "fullName" character varying, "password" character varying NOT NULL, "phoneNumber" character varying, "city" character varying, "allPrivilege" boolean NOT NULL DEFAULT false, "addMatchPrivilege" boolean NOT NULL DEFAULT false, "betFairMatchPrivilege" boolean NOT NULL DEFAULT false, "bookmakerMatchPrivilege" boolean NOT NULL DEFAULT false, "sessionMatchPrivilege" boolean NOT NULL DEFAULT false, "loginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "user_userName" ON "users" ("id", "userName") `);
        await queryRunner.query(`ALTER TABLE "bets" ADD CONSTRAINT "FK_ddd8dce54aa5f1af36c467c9dae" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bettings" ADD CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`ALTER TABLE "bettings" DROP CONSTRAINT "FK_1e70b1452c95244c9f8bceae02b"`);
        await queryRunner.query(`ALTER TABLE "bets" DROP CONSTRAINT "FK_ddd8dce54aa5f1af36c467c9dae"`);
        await queryRunner.query(`DROP INDEX "public"."user_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`DROP TABLE "sessionBettings"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_betstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`DROP TABLE "matchBettings"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_c_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_b_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_a_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."match_marketId"`);
        await queryRunner.query(`DROP TABLE "matchs"`);
        await queryRunner.query(`DROP TABLE "bettings"`);
        await queryRunner.query(`DROP INDEX "public"."bet_betId"`);
        await queryRunner.query(`DROP TABLE "bets"`);
    }
}
