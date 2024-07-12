const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class UpToCard1719216396492 {
    name = 'UpToCard1719216396492'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "results" DROP CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4"`);
        await queryRunner.query(`ALTER TABLE "expertResults" DROP CONSTRAINT "FK_d12d593a6679d826e188776ef51"`);
        await queryRunner.query(`CREATE TABLE "racingMatchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchType" character varying(50) NOT NULL, "countryCode" character varying, "betPlaceStartBefore" integer, "title" character varying(100) NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "eventName" character varying, "venue" character varying, "raceType" character varying NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_043089c6d691284da2a39224499" UNIQUE ("marketId"), CONSTRAINT "PK_6041a3db78cb37a8bcda3dfdf4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "racingMatch_marketId" ON "racingMatchs" ("marketId", "matchType") `);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_type_enum" AS ENUM('matchOdd')`);
        await queryRunner.query(`CREATE TYPE "public"."racingBettings_activestatus_enum" AS ENUM('save', 'live', 'result', 'close')`);
        await queryRunner.query(`CREATE TABLE "racingBettings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "type" "public"."racingBettings_type_enum" NOT NULL, "name" character varying NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', "activeStatus" "public"."racingBettings_activestatus_enum" NOT NULL DEFAULT 'save', "isActive" boolean NOT NULL DEFAULT false, "stopAt" TIMESTAMP WITH TIME ZONE, "result" character varying, "marketId" character varying, CONSTRAINT "racingBetting_minBet" CHECK ("minBet" >= 0), CONSTRAINT "racingBetting_maxBet" CHECK ("maxBet" > "minBet"), CONSTRAINT "PK_b56151bbb980b87482d50aadec0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "racingBetting_name" ON "racingBettings" ("matchId", "name") `);
        await queryRunner.query(`CREATE TABLE "racingRunners" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "matchId" uuid NOT NULL, "bettingId" uuid NOT NULL, "metadata" jsonb NOT NULL, "runnerName" character varying NOT NULL, "selectionId" character varying NOT NULL, "sortPriority" integer NOT NULL, "stopAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_ddc937b8d2d1dc740fbd92f644c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "racingRunners_name" ON "racingRunners" ("matchId", "bettingId", "selectionId") `);
        await queryRunner.query(`CREATE TYPE "public"."cardMatchs_type_enum" AS ENUM('dt20', 'teen20', 'card32', 'lucky7', 'abj', 'dt202', 'dtl20', 'dt6', 'lucky7eu', 'teen', 'teen9', 'teen8', 'poker', 'poker20', 'poker6', 'baccarat', 'baccarat2', 'card32eu', 'ab20', '3cardj', 'war', 'worli2', 'superover', 'cmatch20', 'aaa', 'btable', 'race20', 'cricketv3')`);
        await queryRunner.query(`CREATE TABLE "cardMatchs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createBy" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "type" "public"."cardMatchs_type_enum" NOT NULL, "minBet" double precision NOT NULL DEFAULT '0', "maxBet" double precision NOT NULL DEFAULT '1', CONSTRAINT "PK_8c9f923b259530f9f9349f76fce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "cardMatch_type" ON "cardMatchs" ("type") `);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum" RENAME TO "matchBettings_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum" AS ENUM('matchOdd', 'bookmaker', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2', 'completeMatch', 'completeManual', 'overUnder0.5', 'overUnder1.5', 'overUnder2.5', 'overUnder3.5', 'overUnder4.5', 'overUnder5.5', 'overUnder6.5', 'overUnder7.5', 'overUnder8.5', 'overUnder9.5', 'overUnder10.5', 'overUnder11.5', 'overUnder12.5', 'overUnder13.5', 'overUnder14.5', 'overUnder15.5', 'overUnder16.5', 'overUnder17.5', 'overUnder18.5', 'overUnder19.5', 'firstHalfGoal0.5', 'firstHalfGoal1.5', 'firstHalfGoal2.5', 'firstHalfGoal3.5', 'firstHalfGoal4.5', 'firstHalfGoal5.5', 'firstHalfGoal6.5', 'firstHalfGoal7.5', 'firstHalfGoal8.5', 'firstHalfGoal9.5', 'firstHalfGoal10.5', 'firstHalfGoal11.5', 'firstHalfGoal12.5', 'firstHalfGoal13.5', 'firstHalfGoal14.5', 'firstHalfGoal15.5', 'firstHalfGoal16.5', 'firstHalfGoal17.5', 'firstHalfGoal18.5', 'firstHalfGoal19.5', 'halfTime', 'setWinner0', 'setWinner1', 'setWinner2', 'setWinner3', 'setWinner4', 'setWinner5', 'setWinner6', 'setWinner7', 'setWinner8', 'setWinner9', 'setWinner10', 'setWinner11', 'setWinner12', 'setWinner13', 'setWinner14', 'setWinner15', 'setWinner16', 'setWinner17', 'setWinner18', 'setWinner19')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum" USING "type"::"text"::"public"."matchBettings_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" ADD CONSTRAINT "FK_1cae8c1eee3fcb76f9f867b4d7f" FOREIGN KEY ("matchId") REFERENCES "racingMatchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "racingRunners" ADD CONSTRAINT "FK_42d89665ec2bb84df50f370d5ce" FOREIGN KEY ("matchId") REFERENCES "racingMatchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "racingRunners" ADD CONSTRAINT "FK_abd68e5751401b628839526c955" FOREIGN KEY ("bettingId") REFERENCES "racingBettings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "racingRunners" DROP CONSTRAINT "FK_abd68e5751401b628839526c955"`);
        await queryRunner.query(`ALTER TABLE "racingRunners" DROP CONSTRAINT "FK_42d89665ec2bb84df50f370d5ce"`);
        await queryRunner.query(`ALTER TABLE "racingBettings" DROP CONSTRAINT "FK_1cae8c1eee3fcb76f9f867b4d7f"`);
        await queryRunner.query(`CREATE TYPE "public"."matchBettings_type_enum_old" AS ENUM('bookmaker', 'completeMatch', 'matchOdd', 'quickbookmaker1', 'quickbookmaker2', 'quickbookmaker3', 'tiedMatch1', 'tiedMatch2')`);
        await queryRunner.query(`ALTER TABLE "matchBettings" ALTER COLUMN "type" TYPE "public"."matchBettings_type_enum_old" USING "type"::"text"::"public"."matchBettings_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."matchBettings_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."matchBettings_type_enum_old" RENAME TO "matchBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."cardMatch_type"`);
        await queryRunner.query(`DROP TABLE "cardMatchs"`);
        await queryRunner.query(`DROP TYPE "public"."cardMatchs_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."racingRunners_name"`);
        await queryRunner.query(`DROP TABLE "racingRunners"`);
        await queryRunner.query(`DROP INDEX "public"."racingBetting_name"`);
        await queryRunner.query(`DROP TABLE "racingBettings"`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_activestatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."racingBettings_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."racingMatch_marketId"`);
        await queryRunner.query(`DROP TABLE "racingMatchs"`);
        await queryRunner.query(`ALTER TABLE "expertResults" ADD CONSTRAINT "FK_d12d593a6679d826e188776ef51" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "results" ADD CONSTRAINT "FK_70d9ea48465cd83402aa28db0d4" FOREIGN KEY ("matchId") REFERENCES "matchs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
