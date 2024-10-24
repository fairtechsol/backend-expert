const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class BlinkingTabs1727334337548 {
    name = 'BlinkingTabs1727334337548'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "blinkingTabss" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "order" integer NOT NULL, "matchId" uuid NOT NULL, "matchName" character varying NOT NULL, CONSTRAINT "UQ_e44446c7090abc63e9b87f134f1" UNIQUE ("matchId"), CONSTRAINT "PK_00e5d1c41fbfaf7773e14704184" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD "betLimit" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "betLimit" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "blinkingTabss"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "betLimit"`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP COLUMN "betLimit"`);
    }
}
