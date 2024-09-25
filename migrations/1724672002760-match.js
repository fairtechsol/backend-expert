const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Match1724672002760 {
    name = 'Match1724672002760'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ADD "isTv" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "isFancy" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "matchs" ADD "isBookmaker" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum" RENAME TO "sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'overByover', 'ballByBall', 'oddEven', 'cricketCasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum" USING "type"::"text"::"public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum" RENAME TO "matchBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'bookmaker2', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'completeMatch', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum" USING "type"::"text"::"public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "competitionId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "competitionName" DROP NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "competitionName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "competitionId" SET NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum_old" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'completeMatch', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum_old" USING "type"::"text"::"public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum_old" RENAME TO "matchBettings_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum_old" AS ENUM('session', 'overByover', 'ballByBall')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum_old" USING "type"::"text"::"public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum_old" RENAME TO "sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "isBookmaker"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "isFancy"`);
        await queryRunner.query(`ALTER TABLE "matchs" DROP COLUMN "isTv"`);
    }
}
