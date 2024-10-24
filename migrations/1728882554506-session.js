const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Session1728882554506 {
    name = 'Session1728882554506'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."tournamentBettings_gtype_enum" RENAME TO "tournamentBettings_gtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tournamentBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'khado', 'meter', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" TYPE "public"."tournamentBettings_gtype_enum" USING "gtype"::"text"::"public"."tournamentBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" SET DEFAULT 'match1'`);
        await queryRunner.query(`DROP TYPE "public"."tournamentBettings_gtype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum" RENAME TO "sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'fancy1', 'overByover', 'ballByBall', 'oddEven', 'cricketCasino', 'khado', 'meter')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum" USING "type"::"text"::"public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_gtype_enum" RENAME TO "sessionBettings_gtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'khado', 'meter', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" TYPE "public"."sessionBettings_gtype_enum" USING "gtype"::"text"::"public"."sessionBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" SET DEFAULT 'fancy'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_gtype_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_gtype_enum" RENAME TO "matchBettings_gtype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'khado', 'meter', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" TYPE "public"."matchBettings_gtype_enum" USING "gtype"::"text"::"public"."matchBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" SET DEFAULT 'match'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_gtype_enum_old"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_gtype_enum_old" AS ENUM('cricketcasino', 'fancy', 'fancy1', 'match', 'match1', 'oddeven')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" TYPE "public"."matchBettings_gtype_enum_old" USING "gtype"::"text"::"public"."matchBettings_gtype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "gtype" SET DEFAULT 'match'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_gtype_enum_old" RENAME TO "matchBettings_gtype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_gtype_enum_old" AS ENUM('cricketcasino', 'fancy', 'fancy1', 'match', 'match1', 'oddeven')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" TYPE "public"."sessionBettings_gtype_enum_old" USING "gtype"::"text"::"public"."sessionBettings_gtype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "gtype" SET DEFAULT 'fancy'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_gtype_enum_old" RENAME TO "sessionBettings_gtype_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum_old" AS ENUM('ballByBall', 'cricketCasino', 'fancy1', 'oddEven', 'overByover', 'session')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum_old" USING "type"::"text"::"public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum_old" RENAME TO "sessionBettings_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."tournamentBettings_gtype_enum_old" AS ENUM('cricketcasino', 'fancy', 'fancy1', 'match', 'match1', 'oddeven')`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" TYPE "public"."tournamentBettings_gtype_enum_old" USING "gtype"::"text"::"public"."tournamentBettings_gtype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ALTER COLUMN "gtype" SET DEFAULT 'match1'`);
        await queryRunner.query(`DROP TYPE "public"."tournamentBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tournamentBettings_gtype_enum_old" RENAME TO "tournamentBettings_gtype_enum"`);
    }
}
