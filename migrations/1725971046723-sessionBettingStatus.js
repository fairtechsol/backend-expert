const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class SessionBettingStatus1725971046723 {
    name = 'SessionBettingStatus1725971046723'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_activestatus_enum" RENAME TO "sessionBettings_activestatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close', 'unSave')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" TYPE "public"."sessionBettings_activestatus_enum" USING "activeStatus"::"text"::"public"."sessionBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."racingBettings_activestatus_enum" RENAME TO "racingBettings_activestatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close', 'unSave')`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" TYPE "public"."racingBettings_activestatus_enum" USING "activeStatus"::"text"::"public"."racingBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'save'`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_activestatus_enum" RENAME TO "matchBettings_activestatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close', 'unSave')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" TYPE "public"."matchBettings_activestatus_enum" USING "activeStatus"::"text"::"public"."matchBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_activestatus_enum_old"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_activestatus_enum_old" AS ENUM('close', 'live', 'result', 'save')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" TYPE "public"."matchBettings_activestatus_enum_old" USING "activeStatus"::"text"::"public"."matchBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_activestatus_enum_old" RENAME TO "matchBettings_activestatus_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_activestatus_enum_old" AS ENUM('close', 'live', 'result', 'save')`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" TYPE "public"."racingBettings_activestatus_enum_old" USING "activeStatus"::"text"::"public"."racingBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'save'`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."racingBettings_activestatus_enum_old" RENAME TO "racingBettings_activestatus_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_activestatus_enum_old" AS ENUM('close', 'live', 'result', 'save')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" TYPE "public"."sessionBettings_activestatus_enum_old" USING "activeStatus"::"text"::"public"."sessionBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_activestatus_enum_old" RENAME TO "sessionBettings_activestatus_enum"`);
    }
}
