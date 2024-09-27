const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Tournament1726209536283 {
    name = 'Tournament1726209536283'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "tournamentRunners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "bettingId" uuid NOT NULL, "metadata" jsonb, "runnerName" character varying NOT NULL, "selectionId" character varying NOT NULL, "sortPriority" integer NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_924a8acbfec216937dad95020bf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tournamentRunners_name" ON "tournamentRunners" ("matchId", "bettingId", "selectionId") `);
        await queryRunner.query(`CREATE TYPE "public"."tournamentBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'tournament', 'bookmaker2', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'tiedMatch3', 'other', 'completeMatch', 'completeMatch1', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`CREATE TYPE "public"."tournamentBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close', 'unSave')`);
        await queryRunner.query(`CREATE TYPE "public"."tournamentBettings_gtype_enum" AS ENUM('match', 'match1', 'fancy', 'fancy1', 'oddeven', 'cricketcasino')`);
        await queryRunner.query(`CREATE TABLE "tournamentBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."tournamentBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', "activeStatus" "public"."tournamentBettings_activestatus_enum" NOT NULL DEFAULT 'save', "isActive" boolean NOT NULL DEFAULT false, "stopAt" TIMESTAMP WITH TIME ZONE, "result" character varying, "marketId" character varying, "apiType" integer NOT NULL DEFAULT '0', "gtype" "public"."tournamentBettings_gtype_enum" NOT NULL DEFAULT 'match1', CONSTRAINT "tournamentBetting_minBet" CHECK ("minBet" >= 0), CONSTRAINT "tournamentBetting_maxBet" CHECK ("maxBet" > "minBet"), CONSTRAINT "PK_95037394b8ca7f24f7472bc4eab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "tournamentBetting_name" ON "tournamentBettings" ("matchId", "name") `);
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
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'tournament', 'bookmaker2', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'tiedMatch3', 'other', 'completeMatch', 'completeMatch1', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum" USING "type"::"text"::"public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_activestatus_enum" RENAME TO "matchBettings_activestatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close', 'unSave')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" TYPE "public"."matchBettings_activestatus_enum" USING "activeStatus"::"text"::"public"."matchBettings_activestatus_enum"`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "activeStatus" SET DEFAULT 'live'`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_activestatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "teamB" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD CONSTRAINT "FK_6e47802bd7569c00376d3455d2c" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" ADD CONSTRAINT "FK_f79faf075ff9f2c463f7a266760" FOREIGN KEY ("bettingId") REFERENCES "tournamentBettings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournamentBettings" ADD CONSTRAINT "FK_10453007418faf27be8014eb925" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "tournamentBettings" DROP CONSTRAINT "FK_10453007418faf27be8014eb925"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP CONSTRAINT "FK_f79faf075ff9f2c463f7a266760"`);
        await queryRunner.query(`ALTER TABLE "tournamentRunners" DROP CONSTRAINT "FK_6e47802bd7569c00376d3455d2c"`);
        await queryRunner.query(`ALTER TABLE "matchs" ALTER COLUMN "teamB" SET NOT NULL`);
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
        await queryRunner.query(`DROP INDEX "public"."tournamentBetting_name"`);
        await queryRunner.query(`DROP TABLE "tournamentBettings"`);
        await queryRunner.query(`DROP TYPE "public"."tournamentBettings_gtype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tournamentBettings_activestatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tournamentBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."tournamentRunners_name"`);
        await queryRunner.query(`DROP TABLE "tournamentRunners"`);
    }
}
