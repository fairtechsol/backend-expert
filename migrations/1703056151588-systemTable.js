const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class SystemTable1703056151588 {
    name = 'SystemTable1703056151588'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`CREATE TABLE "systemTables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "type" character varying NOT NULL, "value" character varying, CONSTRAINT "PK_c70d94890c6018a3a4ad2d01a56" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "systemTable_type" ON "systemTables" ("type") `);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "result" character varying`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "isManuall" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "isManuall" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."matchBeting_name"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "isManuall"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "isManuall"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "result"`);
        await queryRunner.query(`DROP INDEX "public"."systemTable_type"`);
        await queryRunner.query(`DROP TABLE "systemTables"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "matchBeting_name" ON "matchBettings" ("matchId", "name") `);
    }
}
