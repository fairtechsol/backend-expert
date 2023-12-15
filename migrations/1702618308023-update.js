const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702618308023 {
    name = 'Update1702618308023'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."betPlaceds_bettype_enum" AS ENUM('back', 'lay', 'yes', 'no')`);
        await queryRunner.query(`CREATE TYPE "public"."betPlaceds_markettype_enum" AS ENUM('session', 'match')`);
        await queryRunner.query(`CREATE TABLE "betPlaceds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "userId" uuid NOT NULL, "matchId" uuid NOT NULL, "betId" uuid NOT NULL, "result" character varying NOT NULL, "team" character varying NOT NULL, "amount" double precision NOT NULL DEFAULT '0', "odds" double precision NOT NULL DEFAULT '0', "winAmount" double precision NOT NULL DEFAULT '0', "lossAmount" double precision NOT NULL DEFAULT '0', "betType" "public"."betPlaceds_bettype_enum" NOT NULL, "rate" double precision NOT NULL DEFAULT '0', "marketType" "public"."betPlaceds_markettype_enum" NOT NULL, "deleteReason" character varying, "ipAddress" character varying, "browser" character varying, CONSTRAINT "UQ_43a5c551e5729b21d778491ea19" UNIQUE ("matchId"), CONSTRAINT "PK_9c485987c2b7a57f31b0c230abf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "betPlaced_betId" ON "betPlaceds" ("matchId", "betId") `);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteama_enum" RENAME TO "matchBettings_statusteama_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteama_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" TYPE "public"."matchBettings_statusteama_enum" USING "statusTeamA"::"text"::"public"."matchBettings_statusteama_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteama_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteamb_enum" RENAME TO "matchBettings_statusteamb_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamb_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" TYPE "public"."matchBettings_statusteamb_enum" USING "statusTeamB"::"text"::"public"."matchBettings_statusteamb_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamb_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteamc_enum" RENAME TO "matchBettings_statusteamc_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamc_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" TYPE "public"."matchBettings_statusteamc_enum" USING "statusTeamC"::"text"::"public"."matchBettings_statusteamc_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamc_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_status_enum" RENAME TO "sessionBettings_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_status_enum" AS ENUM('suspended', 'active', 'closed', 'ball start', 'ball stop', 'ball running')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" TYPE "public"."sessionBettings_status_enum" USING "status"::"text"::"public"."sessionBettings_status_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "betPlaceds" ADD CONSTRAINT "FK_43a5c551e5729b21d778491ea19" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "betPlaceds" DROP CONSTRAINT "FK_43a5c551e5729b21d778491ea19"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_status_enum_old" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" TYPE "public"."sessionBettings_status_enum_old" USING "status"::"text"::"public"."sessionBettings_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_status_enum_old" RENAME TO "sessionBettings_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamc_enum_old" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" TYPE "public"."matchBettings_statusteamc_enum_old" USING "statusTeamC"::"text"::"public"."matchBettings_statusteamc_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamC" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamc_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteamc_enum_old" RENAME TO "matchBettings_statusteamc_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamb_enum_old" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" TYPE "public"."matchBettings_statusteamb_enum_old" USING "statusTeamB"::"text"::"public"."matchBettings_statusteamb_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamB" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamb_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteamb_enum_old" RENAME TO "matchBettings_statusteamb_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteama_enum_old" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" TYPE "public"."matchBettings_statusteama_enum_old" USING "statusTeamA"::"text"::"public"."matchBettings_statusteama_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "statusTeamA" SET DEFAULT 'suspended'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteama_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_statusteama_enum_old" RENAME TO "matchBettings_statusteama_enum"`);
        await queryRunner.query(`DROP INDEX "public"."betPlaced_betId"`);
        await queryRunner.query(`DROP TABLE "betPlaceds"`);
        await queryRunner.query(`DROP TYPE "public"."betPlaceds_markettype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."betPlaceds_bettype_enum"`);
    }
}
