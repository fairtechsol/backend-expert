const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class MatchBetting1724830782843 {
    name = 'MatchBetting1724830782843'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "gtype" "public"."sessionBettings_gtype_enum" NOT NULL DEFAULT 'fancy'`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "gtype" "public"."matchBettings_gtype_enum" NOT NULL DEFAULT 'match'`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum" RENAME TO "sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'fancy1', 'overByover', 'ballByBall', 'oddEven', 'cricketCasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum" USING "type"::"text"::"public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum_old"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum_old" AS ENUM('ballByBall', 'cricketCasino', 'oddEven', 'overByover', 'session')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum_old" USING "type"::"text"::"public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum_old" RENAME TO "sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "gtype"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "gtype"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_gtype_enum"`);
    }
}
