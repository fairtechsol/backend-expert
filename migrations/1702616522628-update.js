const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702616522628 {
    name = 'Update1702616522628'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "backTeam_A"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "backTeam_B"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeam_A"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeam_B"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeam_C"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeam_A"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_a_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeam_B"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_b_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeam_C"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteam_c_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "backTeamA" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "backTeamB" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeamA" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeamB" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeamC" double precision NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteama_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeamA" "public"."matchBettings_statusteama_enum" NOT NULL DEFAULT 'suspended'`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamb_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeamB" "public"."matchBettings_statusteamb_enum" NOT NULL DEFAULT 'suspended'`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteamc_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeamC" "public"."matchBettings_statusteamc_enum" DEFAULT 'suspended'`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "amount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "odds" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "winAmount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "lossAmount" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "rate" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "minBet" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "maxBet" SET DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "backTeamC" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "backTeamC" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "minBet" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "maxBet" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "yesRate" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "noRate" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "yesPercent" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "noPercent" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" SET DEFAULT 'suspended'`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "betStatus" SET DEFAULT 'live'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "betStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "noPercent" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "yesPercent" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "noRate" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "yesRate" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "maxBet" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "minBet" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "backTeamC" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "backTeamC" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "maxBet" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "minBet" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "rate" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "lossAmount" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "winAmount" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "odds" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "bets" ALTER COLUMN "amount" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeamC"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamc_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeamB"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteamb_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "statusTeamA"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_statusteama_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeamC"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeamB"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "layTeamA"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "backTeamB"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "backTeamA"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_c_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeam_C" "public"."matchBettings_statusteam_c_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_b_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeam_B" "public"."matchBettings_statusteam_b_enum" NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_statusteam_a_enum" AS ENUM('suspended', 'active', 'closed', 'ballStart', 'ballStop', 'ballRunning')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "statusTeam_A" "public"."matchBettings_statusteam_a_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeam_C" double precision`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeam_B" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "layTeam_A" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "backTeam_B" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "backTeam_A" double precision NOT NULL`);
    }
}
