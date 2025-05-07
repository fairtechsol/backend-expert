const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class AddIndex1746620799801 {
    name = 'AddIndex1746620799801'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum" RENAME TO "sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'fancy1', 'overByover', 'ballByBall', 'oddEven', 'cricketCasino', 'khado', 'meter', 'manualSession')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum" USING "type"::"text"::"public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "tournamentRunners_bettingId" ON "tournamentRunners" ("bettingId", "deletedAt") `);
        await queryRunner.query(`CREATE INDEX "tournamentBetting_matchId" ON "tournamentBettings" ("matchId") `);
        await queryRunner.query(`CREATE INDEX "expertResult_betId_deletedAt" ON "expertResults" ("betId", "deletedAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."expertResult_betId_deletedAt"`);
        await queryRunner.query(`DROP INDEX "public"."tournamentBetting_matchId"`);
        await queryRunner.query(`DROP INDEX "public"."tournamentRunners_bettingId"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum_old" AS ENUM('ballByBall', 'cricketCasino', 'fancy1', 'khado', 'meter', 'oddEven', 'overByover', 'session')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum_old" USING "type"::"text"::"public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum_old" RENAME TO "sessionBettings_type_enum"`);
    }
}
