const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Initial1702620219927 {
    name = 'Initial1702620219927'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."betPlaceds_bettype_enum" AS ENUM('back', 'lay', 'yes', 'no')`);
        await queryRunner.query(`CREATE TYPE "public"."betPlaceds_markettype_enum" AS ENUM('session', 'match')`);
        await queryRunner.query(`CREATE TABLE "betPlaceds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "matchId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying NOT NULL, "team" character varying NOT NULL, "amount" double precision NOT NULL DEFAULT '0', "odds" double precision NOT NULL DEFAULT '0', "winAmount" double precision NOT NULL DEFAULT '0', "lossAmount" double precision NOT NULL DEFAULT '0', "betType" "public"."betPlaceds_bettype_enum" NOT NULL, "rate" double precision NOT NULL DEFAULT '0', "marketType" "public"."betPlaceds_markettype_enum" NOT NULL, "deleteReason" character varying, "ipAddress" character varying, "browser" character varying, CONSTRAINT "PK_9c485987c2b7a57f31b0c230abf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "betPlaced_betId_userId" ON "betPlaceds" ("matchId", "betId", "userId") `);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker3', 'tiedMatch2')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteama_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamb_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamc_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TABLE "matchBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."matchBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', "backTeamA" double precision NOT NULL DEFAULT '0', "backTeamB" double precision NOT NULL DEFAULT '0', "backTeamC" double precision NOT NULL DEFAULT '0', "layTeamA" double precision NOT NULL DEFAULT '0', "layTeamB" double precision NOT NULL DEFAULT '0', "layTeamC" double precision NOT NULL DEFAULT '0', "statusTeamA" "public"."matchBettings_statusteama_enum" NOT NULL DEFAULT 'suspended', "statusTeamB" "public"."matchBettings_statusteamb_enum" NOT NULL DEFAULT 'suspended', "statusTeamC" "public"."matchBettings_statusteamc_enum" DEFAULT 'suspended', "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_cf6da9fb9015e506d67752d0c99" UNIQUE ("matchId"), CONSTRAINT "PK_a138f4924e867722232da45ae38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('marketSession', 'manualSession', 'overByover', 'ballByBall')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_status_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_betstatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "sessionBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."sessionBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '0', "yesRate" double precision NOT NULL DEFAULT '0', "noRate" double precision NOT NULL DEFAULT '0', "yesPercent" double precision NOT NULL DEFAULT '0', "noPercent" double precision NOT NULL DEFAULT '0', "status" "public"."sessionBettings_status_enum" NOT NULL DEFAULT 'suspended', "selectionId" character varying NOT NULL, "betStatus" "public"."sessionBettings_betstatus_enum" NOT NULL DEFAULT 'live', "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_141d7ed86370e28ffa9ebe1dd4f" UNIQUE ("matchId"), CONSTRAINT "PK_d3822a4209cb5e9c4bea092c3c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "sessionBetting_name" ON "sessionBettings" ("matchId", "name") `);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "matchOddMinBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "matchOddMaxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairSessionMinBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairSessionMaxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairBookmakerMinBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "betFairBookmakerMaxBet"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "apiMatchOddActive"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "apiBookMakerActive"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "apiSessionActive"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "manualSessionActive"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" ADD CONSTRAINT "FK_43a5c551e5729b21d778491ea19" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP CONSTRAINT "FK_141d7ed86370e28ffa9ebe1dd4f"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP CONSTRAINT "FK_cf6da9fb9015e506d67752d0c99"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" DROP CONSTRAINT "FK_43a5c551e5729b21d778491ea19"`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "manualSessionActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "apiSessionActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "apiBookMakerActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "apiMatchOddActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairBookmakerMaxBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairBookmakerMinBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairSessionMaxBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "betFairSessionMinBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "matchOddMaxBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "matchOddMinBet" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX "public"."sessionBetting_name"`);
        await queryRunner.query(`DROP TABLE "sessionBettings"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_betstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`DROP TABLE "matchBettings"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamc_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamb_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteama_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."betPlaced_betId_userId"`);
        await queryRunner.query(`DROP TABLE "betPlaceds"`);
        await queryRunner.query(`DROP TYPE "public"."betPlaceds_markettype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."betPlaceds_bettype_enum"`);
    }
}
