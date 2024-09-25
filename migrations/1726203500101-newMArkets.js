const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class NewMArkets1726203500101 {
    name = 'NewMArkets1726203500101'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ADD "gtype" "public"."sessionBettings_gtype_enum" NOT NULL DEFAULT 'fancy'`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "gtype" "public"."matchBettings_gtype_enum" NOT NULL DEFAULT 'match'`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ADD "metaData" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum" RENAME TO "sessionBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum" AS ENUM('session', 'fancy1', 'overByover', 'ballByBall', 'oddEven', 'cricketCasino')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum" USING "type"::"text"::"public"."sessionBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum_old"`);
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
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "apiType" DROP NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum" RENAME TO "matchBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'bookmaker2', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'tiedMatch3', 'other', 'completeMatch', 'completeMatch1', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum" USING "type"::"text"::"public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum_old"`);
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
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum_old" AS ENUM('bookmaker', 'bookmaker2', 'completeManual', 'completeMatch', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'halfTime', 'matchOdd', 'overUnder0.5', 'overUnder1.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'setWinner0', 'setWinner1', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'tiedMatch1', 'tiedMatch2')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum_old" USING "type"::"text"::"public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum_old" RENAME TO "matchBettings_type_enum"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ALTER COLUMN "apiType" SET NOT NULL`);
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
        await queryRunner.query(`CREATE TYPE "public"."sessionBettings_type_enum_old" AS ENUM('ballByBall', 'cricketCasino', 'oddEven', 'overByover', 'session')`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" ALTER COLUMN "type" TYPE "public"."sessionBettings_type_enum_old" USING "type"::"text"::"public"."sessionBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."sessionBettings_type_enum_old" RENAME TO "sessionBettings_type_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "metaData"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" DROP COLUMN "gtype"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_gtype_enum"`);
        await queryRunner.query(`ALTER TABLE "sessionBettings" DROP COLUMN "gtype"`);
        await queryRunner.query(`DROP TYPE "public"."sessionBettings_gtype_enum"`);
    }
}
