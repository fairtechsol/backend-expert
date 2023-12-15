const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Update1702626454301 {
    name = 'Update1702626454301'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sessionBettings" RENAME COLUMN "betStatus" TO "activeStatus"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_betstatus_enum" RENAME TO "sessionBettings_activestatus_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "activeStatus" "public"."matchBettings_activestatus_enum" NOT NULL DEFAULT 'live'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "activeStatus"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_activestatus_enum" RENAME TO "sessionBettings_betstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" RENAME COLUMN "activeStatus" TO "betStatus"`);
    }
}
