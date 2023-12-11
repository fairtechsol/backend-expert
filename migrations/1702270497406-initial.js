const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Initial1702270497406 {
    name = 'Initial1702270497406'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookmakers" RENAME COLUMN "betStatus" TO "isActive"`);
        await queryRunner.query(`ALTER TYPE "public"."bookmakers_betstatus_enum" RENAME TO "bookmakers_isactive_enum"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "manualBookMakerActive"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "delaySecond"`);
        await queryRunner.query(`ALTER TABLE "bookmakers" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "bookmakers" ADD "isActive" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookmakers" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "bookmakers" ADD "isActive" "public"."bookmakers_isactive_enum" NOT NULL DEFAULT 'save'`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "delaySecond" integer`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "manualBookMakerActive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."bookmakers_isactive_enum" RENAME TO "bookmakers_betstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "bookmakers" RENAME COLUMN "isActive" TO "betStatus"`);
    }
}
